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
  try {
    const body = await req.json();
    
    // Clean up the body - remove undefined values and handle empty strings
    const cleanBody: any = {
      group_id: groupId,
      title: body.title?.trim(),
      freq: body.freq,
      preferred_time: body.preferred_time || null,
      duration_min: body.duration_min || null,
      notes: body.notes?.trim() || null,
      start_date: body.start_date || null,
      end_date: body.end_date || null,
    };
    
    // Only include preferred_day if it's not undefined/null and frequency is not daily
    if (body.preferred_day !== undefined && body.preferred_day !== null && body.freq !== 'daily') {
      cleanBody.preferred_day = body.preferred_day;
    }
    
    // Validate required fields
    if (!cleanBody.title) {
      return NextResponse.json({ error: "Task title is required" }, { status: 400 });
    }
    
    if (!cleanBody.freq) {
      return NextResponse.json({ error: "Task frequency is required" }, { status: 400 });
    }
    
    const { data, error } = await supabase
      .from("tasks")
      .insert(cleanBody)
      .select()
      .single();
      
    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json({ error: error.message || "Failed to create task" }, { status: 500 });
    }
    
    return NextResponse.json({ task: data });
  } catch (err) {
    console.error("Request parsing error:", err);
    return NextResponse.json({ 
      error: err instanceof Error ? err.message : "Failed to parse request" 
    }, { status: 400 });
  }
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

