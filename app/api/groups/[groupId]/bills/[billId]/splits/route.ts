import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export const runtime = "nodejs";

// Mark a split as paid
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ groupId: string; billId: string }> }
) {
  if (!supabase) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
  }

  try {
    const { groupId, billId } = await params;
    const { split_id, paid } = await req.json();

    if (!split_id || typeof paid !== "boolean") {
      return NextResponse.json({ error: "split_id and paid (boolean) are required" }, { status: 400 });
    }

    // Verify bill belongs to group
    const { data: bill } = await supabase.from("bills").select("id").eq("id", billId).eq("group_id", groupId).single();
    if (!bill) {
      return NextResponse.json({ error: "Bill not found or not authorized" }, { status: 404 });
    }

    // Update split
    const { data, error } = await supabase
      .from("bill_splits")
      .update({ paid_at: paid ? new Date().toISOString() : null })
      .eq("id", split_id)
      .eq("bill_id", billId)
      .select("*, member:group_members(*)")
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ split: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Unknown error" }, { status: 500 });
  }
}

