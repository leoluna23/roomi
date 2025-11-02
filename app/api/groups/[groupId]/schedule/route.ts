import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { roundRobinAssign } from "@/lib/schedule";
import type { Chore, Member, Assignment } from "@/lib/types";

export const runtime = "nodejs";

export async function POST(req: NextRequest, { params }: { params: Promise<{ groupId: string }> }) {
  if (!supabase) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
  }

  try {
    const { groupId } = await params;
    // Fetch tasks and members
    const [tasksRes, membersRes] = await Promise.all([
      supabase.from("tasks").select("*").eq("group_id", groupId),
      supabase.from("group_members").select("*").eq("group_id", groupId),
    ]);

    if (tasksRes.error) return NextResponse.json({ error: tasksRes.error.message }, { status: 500 });
    if (membersRes.error) return NextResponse.json({ error: membersRes.error.message }, { status: 500 });

    const tasks = (tasksRes.data || []) as Chore[];
    const members = (membersRes.data || []) as Member[];

    if (!tasks.length || !members.length) {
      return NextResponse.json({ error: "Need at least one task and one member" }, { status: 400 });
    }

    // Generate assignments
    const assignments = roundRobinAssign(tasks, members);

    // Delete existing future assignments for this group
    const now = new Date();
    const tasksIds = tasks.map((t) => t.id);
    await supabase
      .from("assignments")
      .delete()
      .in(
        "task_id",
        tasksIds.map((id) => id)
      )
      .gt("when_ts", now.toISOString());

    // Insert new assignments (roundRobinAssign returns chore_id, but DB uses task_id)
    const insertData = assignments.map((a: any) => ({
      task_id: a.chore_id || a.task_id,
      member_id: a.member_id,
      when_ts: a.when_ts,
    }));

    const { data: inserted, error: insertError } = await supabase
      .from("assignments")
      .insert(insertData)
      .select();

    if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 });

    return NextResponse.json({ assignments: inserted });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ groupId: string }> }) {
  if (!supabase) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
  }

  const { groupId } = await params;
  const searchParams = req.nextUrl.searchParams;
  const start = searchParams.get("start");
  const end = searchParams.get("end");

  // First get all tasks for this group, then get assignments for those tasks
  const { data: tasksData } = await supabase
    .from("tasks")
    .select("id")
    .eq("group_id", groupId);

  if (!tasksData || tasksData.length === 0) {
    return NextResponse.json({ assignments: [] });
  }

  const taskIds = tasksData.map((t) => t.id);
  let query = supabase
    .from("assignments")
    .select("*, task:tasks(*), member:group_members(*)")
    .in("task_id", taskIds);

  if (start) query = query.gte("when_ts", start);
  if (end) query = query.lte("when_ts", end);

  const { data, error } = await query.order("when_ts");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ assignments: data || [] });
}

