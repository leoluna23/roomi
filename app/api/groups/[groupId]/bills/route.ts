import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export const runtime = "nodejs";

export async function GET(req: NextRequest, { params }: { params: Promise<{ groupId: string }> }) {
  if (!supabase) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
  }

  try {
    const { groupId } = await params;
    const searchParams = req.nextUrl.searchParams;
    const month = searchParams.get("month"); // Optional: filter by month (YYYY-MM)

    // Use a simpler approach: load bills first, then manually join related data
    let billsQuery = supabase
      .from("bills")
      .select("*")
      .eq("group_id", groupId)
      .order("bill_date", { ascending: false });

    if (month) {
      // Calculate the last day of the month properly
      const [year, monthNum] = month.split("-").map(Number);
      const lastDay = new Date(year, monthNum, 0).getDate(); // Day 0 gives last day of previous month
      const startDate = `${month}-01`;
      const endDate = `${month}-${String(lastDay).padStart(2, "0")}`;
      billsQuery = billsQuery.gte("bill_date", startDate).lte("bill_date", endDate);
    }

    const { data: bills, error: billsError } = await billsQuery;

    if (billsError) {
      console.error("Error loading bills:", billsError);
      return NextResponse.json({ error: billsError.message }, { status: 500 });
    }

    if (!bills || bills.length === 0) {
      return NextResponse.json({ bills: [] });
    }

    // Load related data for each bill
    if (!supabase) {
      return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
    }
    
    const billsWithData = await Promise.all(
      bills.map(async (bill: any) => {
        // Get paid_by member
        const { data: paidByMember } = await supabase!
          .from("group_members")
          .select("*")
          .eq("id", bill.paid_by)
          .single();
        
        // Get splits with members (manual join to avoid nested query issues)
        const { data: splitsData } = await supabase!
          .from("bill_splits")
          .select("*")
          .eq("bill_id", bill.id);
        
        // Manually attach member data to each split
        const splits = await Promise.all(
          (splitsData || []).map(async (split: any) => {
            const { data: member } = await supabase!
              .from("group_members")
              .select("*")
              .eq("id", split.member_id)
              .single();
            return {
              ...split,
              member: member || null,
            };
          })
        );
        
        return {
          ...bill,
          paid_by_member: paidByMember || null,
          splits: splits || [],
        };
      })
    );

    return NextResponse.json({ bills: billsWithData });
  } catch (error: any) {
    console.error("Error in GET bills route:", error);
    return NextResponse.json({ error: error.message || "Unknown error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ groupId: string }> }) {
  if (!supabase) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
  }

  try {
    const { groupId } = await params;
    const body = await req.json();
    const { title, amount, category, paid_by, bill_date, notes, split_type = "equal", custom_splits = [] } = body;

    if (!title?.trim() || !amount || !category || !paid_by || !bill_date) {
      return NextResponse.json({ error: "title, amount, category, paid_by, and bill_date are required" }, { status: 400 });
    }

    // Create the bill
    const { data: bill, error: billError } = await supabase
      .from("bills")
      .insert({
        group_id: groupId,
        title,
        amount: parseFloat(amount),
        category,
        paid_by,
        bill_date,
        notes: notes || null,
      })
      .select()
      .single();

    if (billError) return NextResponse.json({ error: billError.message }, { status: 500 });
    if (!bill) return NextResponse.json({ error: "Failed to create bill" }, { status: 500 });

    // Get all group members
    const { data: members, error: membersError } = await supabase
      .from("group_members")
      .select("id")
      .eq("group_id", groupId);

    if (membersError || !members || members.length === 0) {
      return NextResponse.json({ error: "Failed to fetch group members" }, { status: 500 });
    }

    // Create bill splits
    let splits: any[] = [];
    if (split_type === "equal") {
      const perPerson = parseFloat(amount) / members.length;
      splits = members.map((member) => ({
        bill_id: bill.id,
        member_id: member.id,
        amount: Math.round(perPerson * 100) / 100, // Round to 2 decimal places
      }));
    } else if (split_type === "custom" && custom_splits.length > 0) {
      splits = custom_splits.map((split: any) => ({
        bill_id: bill.id,
        member_id: split.member_id,
        amount: parseFloat(split.amount),
      }));
    } else {
      // Default to equal split
      const perPerson = parseFloat(amount) / members.length;
      splits = members.map((member) => ({
        bill_id: bill.id,
        member_id: member.id,
        amount: Math.round(perPerson * 100) / 100,
      }));
    }

    // Insert splits
    const { data: insertedSplits, error: splitsError } = await supabase
      .from("bill_splits")
      .insert(splits)
      .select("*, member:group_members(*)");

    if (splitsError) {
      // Delete the bill if splits fail
      await supabase.from("bills").delete().eq("id", bill.id);
      return NextResponse.json({ error: splitsError.message }, { status: 500 });
    }

    return NextResponse.json({ bill, splits: insertedSplits || [] }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Unknown error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ groupId: string }> }) {
  if (!supabase) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
  }

  try {
    const { groupId } = await params;
  const { searchParams } = new URL(req.url);
  const billId = searchParams.get("id");

  if (!billId) return NextResponse.json({ error: "bill id required" }, { status: 400 });

  // Verify the bill belongs to this group
  const { data: bill, error: checkError } = await supabase
    .from("bills")
    .select("id")
    .eq("id", billId)
    .eq("group_id", groupId)
    .single();

  if (checkError || !bill) {
    return NextResponse.json({ error: "Bill not found or not authorized" }, { status: 404 });
  }

    // Delete bill (cascade will delete splits)
    const { error } = await supabase.from("bills").delete().eq("id", billId);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error in DELETE bills route:", error);
    return NextResponse.json({ error: error.message || "Unknown error" }, { status: 500 });
  }
}

