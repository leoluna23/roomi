import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export const runtime = "nodejs";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ groupId: string; assignmentId: string }> }
) {
  if (!supabase) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
  }

  const { groupId, assignmentId } = await params;
  const { completed } = await req.json();

  const { data, error } = await supabase
    .from("assignments")
    .update({ completed_at: completed ? new Date().toISOString() : null })
    .eq("id", assignmentId)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ assignment: data });
}

