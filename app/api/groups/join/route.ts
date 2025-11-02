import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    if (!supabase) {
      return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
    }

    const { token, user_name } = await req.json();
    if (!token || !user_name) {
      return NextResponse.json({ error: "token and user_name required" }, { status: 400 });
    }

    const { data: grp, error: gErr } = await supabase
      .from("groups")
      .select("id")
      .eq("join_token", token)
      .single();
    
    if (gErr || !grp) {
      return NextResponse.json({ error: "Invalid token" }, { status: 404 });
    }

    const { data: member, error: mErr } = await supabase
      .from("group_members")
      .insert({ group_id: grp.id, user_name })
      .select()
      .single();
    
    if (mErr) {
      // Check if it's a duplicate member error
      if (mErr.code === "23505" || mErr.message?.includes("duplicate")) {
        return NextResponse.json({ 
          error: `${user_name} is already a member of this group`,
          group_id: grp.id 
        }, { status: 400 });
      }
      return NextResponse.json({ error: mErr.message }, { status: 500 });
    }

    return NextResponse.json({ group_id: grp.id, member }, { status: 200 });
  } catch (error) {
    console.error("Error in join route:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
