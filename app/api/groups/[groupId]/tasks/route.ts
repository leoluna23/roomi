import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export const runtime = "nodejs";

export async function GET(req: NextRequest, { params }: { params: Promise<{ groupId: string }> }) {
  if (!supabase) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
  }
  const { groupId } = await params;
  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .eq("group_id", groupId)
    .order("created_at");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ tasks: data });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ groupId: string }> }) {
  if (!supabase) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
  }
  const { groupId } = await params;
  const body = await req.json();
  const { data, error } = await supabase
    .from("tasks")
    .insert({ ...body, group_id: groupId })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ task: data });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ groupId: string }> }) {
  if (!supabase) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
  }
  const { groupId } = await params;
  const { searchParams } = new URL(req.url);
  const taskId = searchParams.get("id");
  if (!taskId) return NextResponse.json({ error: "task id required" }, { status: 400 });
  const { error } = await supabase.from("tasks").delete().eq("id", taskId).eq("group_id", groupId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

