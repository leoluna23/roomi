import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  if (!supabase) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("user_id");
    if (!userId) {
      return NextResponse.json({ error: "user_id is required" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (error && error.code !== "PGRST116") {
      // PGRST116 is "no rows returned"
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ profile: data || null });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Unknown error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!supabase) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
  }

  try {
    const body = await req.json();
    const { user_id } = body;
    if (!user_id) {
      return NextResponse.json({ error: "user_id is required" }, { status: 400 });
    }
    const {
      name,
      major,
      bio,
      sleep_sched,
      cleanliness,
      noise,
      guests,
      budget_min,
      budget_max,
      interests,
      notifications_enabled,
      email_notifications,
    } = body;

    // Upsert profile
    const { data, error } = await supabase
      .from("user_profiles")
      .upsert(
        {
          user_id: user_id,
          name,
          major,
          bio,
          sleep_sched,
          cleanliness,
          noise,
          guests,
          budget_min: budget_min ? parseFloat(budget_min) : null,
          budget_max: budget_max ? parseFloat(budget_max) : null,
          interests: interests || [],
          notifications_enabled: notifications_enabled !== undefined ? notifications_enabled : true,
          email_notifications: email_notifications !== undefined ? email_notifications : true,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "user_id",
        }
      )
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ profile: data }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Unknown error" }, { status: 500 });
  }
}

