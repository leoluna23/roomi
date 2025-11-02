import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export const runtime = "nodejs";

function makeToken() {
  return Math.random().toString(36).slice(2,8).toUpperCase(); // e.g., 6-char code
}

export async function GET(req: NextRequest) {
  if (!supabase) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
  }
  
  try {
    // Get all groups - frontend will filter to show only groups user is a member of
    // This is necessary because group_members uses user_name (text) not user_id (UUID)
    const { data, error } = await supabase.from("groups").select("id,name,join_token").order("created_at");
    if (error) {
      console.error("Supabase error loading groups:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ groups: data || [] }, { status: 200 });
  } catch (error: any) {
    console.error("Error in GET groups route:", error);
    return NextResponse.json({ error: error.message || "Unknown error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!supabase) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
  }
  const { name, user_id, user_email } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: "name required" }, { status: 400 });
  if (!user_id?.trim()) return NextResponse.json({ error: "user_id required" }, { status: 400 });
  
  // Fetch user's profile name, fallback to email prefix if not found
  let displayName = "";
  if (user_id) {
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("name")
      .eq("user_id", user_id)
      .single();
    displayName = profile?.name?.trim() || "";
  }
  
  // Fallback to email prefix if no profile name exists
  const user_name = displayName || (user_email ? user_email.split("@")[0] : user_id.slice(0, 8));
  
  // Create the group
  const { data: group, error: groupError } = await supabase
    .from("groups")
    .insert({ name, join_token: makeToken() })
    .select()
    .single();
  
  if (groupError || !group) {
    return NextResponse.json({ error: groupError?.message || "Failed to create group" }, { status: 500 });
  }

  // Automatically add the creator as a member
  const { data: member, error: memberError } = await supabase
    .from("group_members")
    .insert({ group_id: group.id, user_name })
    .select()
    .single();

  // If member creation fails (e.g., duplicate), still return the group
  // The user might already be a member somehow
  if (memberError && !memberError.message?.includes("duplicate")) {
    console.error("Failed to add creator as member:", memberError);
    // Still return success since group was created
  }

  return NextResponse.json({ group, member: member || null }, { status: 200 });
}
