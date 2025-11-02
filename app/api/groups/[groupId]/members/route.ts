import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export const runtime = "nodejs";

export async function GET(req: NextRequest, { params }: { params: Promise<{ groupId: string }> }) {
  if (!supabase) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
  }
  const { groupId } = await params;
  const { data, error } = await supabase
    .from("group_members")
    .select("*")
    .eq("group_id", groupId)
    .order("created_at");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ members: data || [] });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ groupId: string }> }) {
  if (!supabase) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
  }
  const { groupId } = await params;
  const { user_name } = await req.json();
  if (!user_name?.trim()) {
    return NextResponse.json({ error: "user_name required" }, { status: 400 });
  }
  const { data, error } = await supabase
    .from("group_members")
    .insert({ group_id: groupId, user_name })
    .select()
    .single();
  if (error) {
    if (error.code === "23505" || error.message?.includes("duplicate")) {
      return NextResponse.json({ error: `${user_name} is already a member` }, { status: 400 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ member: data }, { status: 200 });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ groupId: string }> }) {
  if (!supabase) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
  }
  const { groupId } = await params;
  const { searchParams } = new URL(req.url);
  const memberId = searchParams.get("id");
  if (!memberId) {
    return NextResponse.json({ error: "member id required" }, { status: 400 });
  }
  const { error } = await supabase
    .from("group_members")
    .delete()
    .eq("id", memberId)
    .eq("group_id", groupId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true }, { status: 200 });
}

