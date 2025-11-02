"use client";
import { useEffect, useState } from "react";
import { useAuth } from "../auth/context";
import { ProtectedRoute } from "../ProtectedRoute";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";

// Assignment Details Modal
function AssignmentDetails({
  assignment,
  onClose,
  onToggle,
}: {
  assignment: Assignment | undefined;
  onClose: () => void;
  onToggle: (id: string, completed: boolean) => void;
}) {
  if (!assignment) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4">
        <div className="flex justify-between items-start">
          <h3 className="text-xl font-semibold text-gray-900">Assignment Details</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
          >
            ×
          </button>
        </div>
        
        <div className="space-y-3">
          <div>
            <div className="text-sm font-medium text-gray-600">Task</div>
            <div className="text-lg text-gray-900">{assignment.task?.title || "Unknown Task"}</div>
          </div>
          
          <div>
            <div className="text-sm font-medium text-gray-600">Assigned To</div>
            <div className="text-gray-900">{assignment.member?.user_name || "Unassigned"}</div>
          </div>
          
          <div>
            <div className="text-sm font-medium text-gray-600">Date & Time</div>
            <div className="text-gray-900">
              {new Date(assignment.when_ts).toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </div>
            <div className="text-gray-700">
              {new Date(assignment.when_ts).toLocaleTimeString("en-US", {
                hour: "numeric",
                minute: "2-digit",
              })}
            </div>
          </div>
          
          {assignment.task?.duration_min && (
            <div>
              <div className="text-sm font-medium text-gray-600">Duration</div>
              <div className="text-gray-900">{assignment.task.duration_min} minutes</div>
            </div>
          )}
          
          {assignment.task?.notes && (
            <div>
              <div className="text-sm font-medium text-gray-600">Notes</div>
              <div className="text-gray-900">{assignment.task.notes}</div>
            </div>
          )}
          
          <div className="flex gap-3 pt-4">
            <button
              onClick={() => {
                onToggle(assignment.id, !assignment.completed_at);
              }}
              className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium ${
                assignment.completed_at
                  ? "bg-orange-500 text-white hover:bg-orange-600"
                  : "bg-green-500 text-white hover:bg-green-600"
              }`}
            >
              {assignment.completed_at ? "Mark Incomplete" : "Mark Complete"}
            </button>
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 rounded-lg text-sm font-medium border border-gray-300 hover:bg-gray-50"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Calendar Component
function CalendarView({
  date,
  assignments,
  onToggleAssignment,
  selectedAssignmentId,
  selectedGroupId,
  router,
  setSelectedAssignmentId,
}: {
  date: Date;
  assignments: Assignment[];
  onToggleAssignment: (id: string, completed: boolean) => void;
  selectedAssignmentId: string | null;
  selectedGroupId: string | null;
  router: any;
  setSelectedAssignmentId: (id: string | null) => void;
}) {
  const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
  const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  const startDate = new Date(monthStart);
  startDate.setDate(startDate.getDate() - startDate.getDay());
  const endDate = new Date(monthEnd);
  endDate.setDate(endDate.getDate() + (6 - endDate.getDay()));

  const monthName = date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  // Group assignments by date
  const assignmentsByDate = new Map<string, Assignment[]>();
  assignments.forEach((assignment) => {
    const assignmentDate = new Date(assignment.when_ts);
    const dateKey = `${assignmentDate.getFullYear()}-${assignmentDate.getMonth()}-${assignmentDate.getDate()}`;
    if (!assignmentsByDate.has(dateKey)) {
      assignmentsByDate.set(dateKey, []);
    }
    assignmentsByDate.get(dateKey)!.push(assignment);
  });

  const days = [];
  const currentDate = new Date(startDate);
  while (currentDate <= endDate) {
    days.push(new Date(currentDate));
    currentDate.setDate(currentDate.getDate() + 1);
  }

  const isToday = (day: Date) => {
    const today = new Date();
    return (
      day.getDate() === today.getDate() &&
      day.getMonth() === today.getMonth() &&
      day.getFullYear() === today.getFullYear()
    );
  };

  const isCurrentMonth = (day: Date) => {
    return day.getMonth() === date.getMonth();
  };

  return (
    <div>
      <div className="mb-4 text-center text-lg font-semibold text-gray-900">{monthName}</div>
      <div className="grid grid-cols-7 gap-1">
        {weekDays.map((day) => (
          <div key={day} className="p-2 text-center text-sm font-medium text-gray-600">
            {day}
          </div>
        ))}
        {days.map((day, idx) => {
          const dateKey = `${day.getFullYear()}-${day.getMonth()}-${day.getDate()}`;
          const dayAssignments = assignmentsByDate.get(dateKey) || [];
          const today = isToday(day);
          const currentMonth = isCurrentMonth(day);

          return (
            <div
              key={idx}
              className={`min-h-24 p-1 border border-gray-200 rounded ${
                !currentMonth ? "bg-gray-50" : "bg-white"
              } ${today ? "ring-2 ring-blue-500" : ""}`}
            >
              <div
                className={`text-sm font-medium mb-1 ${
                  today ? "text-blue-600" : currentMonth ? "text-gray-900" : "text-gray-400"
                }`}
              >
                {day.getDate()}
              </div>
              <div className="space-y-1">
                {dayAssignments.slice(0, 3).map((assignment) => {
                  const isSelected = assignment.id === selectedAssignmentId;
                  return (
                    <div
                      key={assignment.id}
                      className={`text-xs p-1 rounded truncate cursor-pointer ${
                        isSelected
                          ? "ring-2 ring-yellow-400 bg-yellow-100"
                          : assignment.completed_at
                          ? "bg-green-100 text-green-800 line-through"
                          : "bg-blue-100 text-blue-800 hover:bg-blue-200"
                      }`}
                      onClick={() => {
                        if (selectedAssignmentId !== assignment.id) {
                          const params = new URLSearchParams();
                          params.set("group", selectedGroupId || "");
                          params.set("assignment", assignment.id);
                          router.push(`/schedule?${params.toString()}`);
                          setSelectedAssignmentId(assignment.id);
                        }
                      }}
                      title={`${assignment.task?.title || "Task"} - ${assignment.member?.user_name || "Unassigned"} at ${new Date(assignment.when_ts).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`}
                    >
                    <div className="font-medium truncate">
                      {assignment.task?.title || "Task"}
                    </div>
                    <div className="text-xs truncate">
                      {assignment.member?.user_name || "Unassigned"} • {new Date(assignment.when_ts).toLocaleTimeString([], {
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </div>
                    </div>
                  );
                })}
                {dayAssignments.length > 3 && (
                  <div className="text-xs text-gray-500 text-center">
                    +{dayAssignments.length - 3} more
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

type Group = { id: string; name: string; join_token: string };
type Task = {
  id: string;
  title: string;
  freq: "weekly" | "biweekly" | "daily" | "every_other_day" | "monthly";
  preferred_day?: number;
  preferred_time?: string;
  duration_min?: number;
  notes?: string;
  start_date?: string; // ISO date string (YYYY-MM-DD)
  end_date?: string; // ISO date string (YYYY-MM-DD)
};
type Assignment = {
  id: string;
  task_id: string;
  member_id: string;
  when_ts: string;
  completed_at?: string | null;
  task?: Task;
  member?: { id: string; user_name: string };
};

export default function SchedulePage() {
  const { user, signOut } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(
    searchParams.get("group") || null
  );
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string | null>(
    searchParams.get("assignment") || null
  );
  const [tasks, setTasks] = useState<Task[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [members, setMembers] = useState<{ id: string; user_name: string }[]>([]);
  const [newTask, setNewTask] = useState({
    title: "",
    freq: "weekly" as Task["freq"],
    preferred_day: undefined as number | undefined,
    preferred_time: "18:00",
    duration_min: 30,
    notes: "",
    start_date: new Date().toISOString().split("T")[0], // Today's date as default
    end_date: "", // Empty by default (optional)
  });
  const [newMemberName, setNewMemberName] = useState("");
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [addingMember, setAddingMember] = useState(false);
  const [calendarDate, setCalendarDate] = useState(new Date());

  useEffect(() => {
    loadGroups();
  }, []);

  useEffect(() => {
    if (selectedGroupId) {
      loadTasks();
      loadAssignments();
      loadMembers();
    }
  }, [selectedGroupId]);

  // When assignment is selected, set calendar to that date
  useEffect(() => {
    if (selectedAssignmentId && assignments.length > 0) {
      const assignment = assignments.find(a => a.id === selectedAssignmentId);
      if (assignment) {
        const assignmentDate = new Date(assignment.when_ts);
        setCalendarDate(assignmentDate);
      }
    }
  }, [selectedAssignmentId, assignments]);

  async function loadGroups() {
    if (!user?.id) return;
    try {
      const res = await fetch("/api/groups");
      if (!res.ok) return;
      const text = await res.text();
      const allGroups = text ? JSON.parse(text).groups || [] : [];
      
      // Filter to only show groups where user is a member
      let userProfileName = "";
      try {
        const profileRes = await fetch(`/api/profile?user_id=${user.id}`);
        if (profileRes.ok) {
          const profileData = await profileRes.json();
          userProfileName = profileData.profile?.name?.trim() || "";
        }
      } catch (err) {
        console.error("Failed to load profile:", err);
      }
      const userEmailPrefix = user?.email?.split("@")[0] || "";
      
      // Check membership for each group
      const membershipChecks = await Promise.all(
        allGroups.map(async (group: Group) => {
          try {
            const membersRes = await fetch(`/api/groups/${group.id}/members`);
            if (membersRes.ok) {
              const membersData = await membersRes.json();
              const members = membersData.members || [];
              const isMember = members.some((m: { user_name: string }) => 
                (userProfileName && m.user_name === userProfileName) ||
                (!userProfileName && m.user_name === userEmailPrefix)
              );
              return isMember ? group : null;
            }
            return null;
          } catch (err) {
            console.error(`Error checking membership for group ${group.id}:`, err);
            return null;
          }
        })
      );
      
      const userGroups = membershipChecks.filter((g): g is Group => g !== null);
      setGroups(userGroups);
      if (!selectedGroupId && userGroups.length > 0) {
        setSelectedGroupId(userGroups[0].id);
      }
    } catch (err) {
      console.error("Failed to load groups:", err);
    }
  }

  async function loadTasks() {
    if (!selectedGroupId) return;
    try {
      const res = await fetch(`/api/groups/${selectedGroupId}/tasks`);
      if (!res.ok) return;
      const data = await res.json();
      setTasks(data.tasks || []);
    } catch (err) {
      console.error("Failed to load tasks:", err);
    }
  }

  async function loadAssignments() {
    if (!selectedGroupId) return;
    try {
      const start = new Date();
      start.setDate(start.getDate() - 7);
      const end = new Date();
      end.setDate(end.getDate() + 60);
      const res = await fetch(
        `/api/groups/${selectedGroupId}/schedule?start=${start.toISOString()}&end=${end.toISOString()}`
      );
      if (!res.ok) return;
      const data = await res.json();
      setAssignments(data.assignments || []);
    } catch (err) {
      console.error("Failed to load assignments:", err);
    }
  }

  async function loadMembers() {
    if (!selectedGroupId || !user?.id) return;
    try {
      const res = await fetch(`/api/groups/${selectedGroupId}/members`);
      if (!res.ok) return;
      const data = await res.json();
      const loadedMembers = data.members || [];
      setMembers(loadedMembers);
      
      // Note: Users must explicitly join groups or create them
      // We no longer auto-add users when viewing a group
    } catch (err) {
      console.error("Failed to load members:", err);
    }
  }

  async function addMember() {
    if (!selectedGroupId || !newMemberName.trim()) return;
    setAddingMember(true);
    try {
      const res = await fetch(`/api/groups/${selectedGroupId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_name: newMemberName.trim() }),
      });
      if (res.ok) {
        setNewMemberName("");
        loadMembers();
      } else {
        const error = await res.json();
        alert(error.error || "Failed to add member");
      }
    } catch (err) {
      console.error("Failed to add member:", err);
      alert("Failed to add member");
    } finally {
      setAddingMember(false);
    }
  }

  async function removeMember(memberId: string) {
    if (!selectedGroupId) return;
    if (!confirm("Remove this member from the group?")) return;
    try {
      const res = await fetch(`/api/groups/${selectedGroupId}/members?id=${memberId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        loadMembers();
      } else {
        const error = await res.json();
        alert(error.error || "Failed to remove member");
      }
    } catch (err) {
      console.error("Failed to remove member:", err);
      alert("Failed to remove member");
    }
  }

  async function createTask() {
    if (!selectedGroupId || !newTask.title.trim()) {
      alert("Please select a group and enter a task title");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/groups/${selectedGroupId}/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newTask),
      });
      
      let data;
      const text = await res.text();
      try {
        data = text ? JSON.parse(text) : {};
      } catch (e) {
        console.error("Failed to parse response:", text);
        alert(`Failed to add task: Invalid response from server`);
        return;
      }
      
      if (res.ok) {
        setNewTask({
          title: "",
          freq: "weekly",
          preferred_day: undefined,
          preferred_time: "18:00",
          duration_min: 30,
          notes: "",
          start_date: new Date().toISOString().split("T")[0],
          end_date: "",
        });
        loadTasks();
        alert("Task created successfully!");
      } else {
        const errorMessage = data?.error || text || "Unknown error";
        alert(`Failed to add task: ${errorMessage}`);
        console.error("API error:", { status: res.status, statusText: res.statusText, data, text });
      }
    } catch (err) {
      console.error("Failed to create task:", err);
      alert(`Error: ${err instanceof Error ? err.message : "Failed to create task"}`);
    } finally {
      setLoading(false);
    }
  }

  async function deleteTask(taskId: string) {
    if (!selectedGroupId) return;
    if (!confirm("Delete this task?")) return;
    try {
      const res = await fetch(`/api/groups/${selectedGroupId}/tasks/${taskId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        loadTasks();
      }
    } catch (err) {
      console.error("Failed to delete task:", err);
    }
  }

  async function generateSchedule() {
    if (!selectedGroupId) {
      alert("Please select a group first");
      return;
    }
    setGenerating(true);
    try {
      const res = await fetch(`/api/groups/${selectedGroupId}/schedule`, {
        method: "POST",
      });
      const data = await res.json();
      if (res.ok) {
        loadAssignments();
        alert(`Schedule generated successfully! Created ${data.assignments?.length || 0} assignments.`);
      } else {
        alert(`Failed to generate schedule: ${data.error || "Unknown error"}`);
        console.error("API error:", data);
      }
    } catch (err) {
      console.error("Failed to generate schedule:", err);
      alert(`Error: ${err instanceof Error ? err.message : "Failed to generate schedule"}`);
    } finally {
      setGenerating(false);
    }
  }

  async function toggleAssignment(assignmentId: string, completed: boolean) {
    try {
      const res = await fetch(
        `/api/groups/${selectedGroupId}/assignments/${assignmentId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ completed }),
        }
      );
      if (res.ok) {
        loadAssignments();
      }
    } catch (err) {
      console.error("Failed to update assignment:", err);
    }
  }

  const selectedGroup = groups.find((g) => g.id === selectedGroupId);

  return (
    <ProtectedRoute>
      <div className="flex h-screen overflow-hidden" style={{ backgroundColor: '#FCFBF4' }}>
        {/* Sidebar */}
        <aside className="w-52 bg-white border-r border-gray-200 flex flex-col p-4 h-full overflow-y-auto">
          <Link href="/" className="text-3xl font-extrabold mb-8 hover:opacity-80 transition-opacity tracking-tight" style={{ color: '#B22222', letterSpacing: '-0.02em', textShadow: '0 2px 4px rgba(178, 34, 34, 0.1)' }}>
            ROOMI
          </Link>
          <nav className="flex-1 space-y-2">
            <Link
              href="/"
              className="block w-full px-4 py-2 rounded-lg text-white text-sm font-medium transition-all shadow-md hover:shadow-lg text-left"
              style={{ backgroundColor: '#B22222' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#991919'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#B22222'}
            >
              Dashboard
            </Link>
            <Link
              href="/match"
              className="block w-full px-4 py-2 rounded-lg text-white text-sm font-medium transition-all shadow-md hover:shadow-lg text-left"
              style={{ backgroundColor: '#B22222' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#991919'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#B22222'}
            >
              Find Matches
            </Link>
            <Link
              href="/groups"
              className="block w-full px-4 py-2 rounded-lg text-white text-sm font-medium transition-all shadow-md hover:shadow-lg text-left"
              style={{ backgroundColor: '#B22222' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#991919'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#B22222'}
            >
              Groups
            </Link>
            <Link
              href="/schedule"
              className="block w-full px-4 py-2 rounded-lg text-white text-sm font-medium transition-all shadow-md hover:shadow-lg text-left"
              style={{ backgroundColor: '#B22222' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#991919'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#B22222'}
            >
              Tasks & Schedule
            </Link>
            <Link
              href="/bills"
              className="block w-full px-4 py-2 rounded-lg text-white text-sm font-medium transition-all shadow-md hover:shadow-lg text-left"
              style={{ backgroundColor: '#B22222' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#991919'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#B22222'}
            >
              Bills
            </Link>
            <Link
              href="/profile"
              className="block w-full px-4 py-2 rounded-lg text-white text-sm font-medium transition-all shadow-md hover:shadow-lg text-left"
              style={{ backgroundColor: '#B22222' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#991919'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#B22222'}
            >
              Profile
            </Link>
            <Link
              href="/mediate"
              className="block w-full px-4 py-2 rounded-lg text-white text-sm font-medium transition-all shadow-md hover:shadow-lg text-left"
              style={{ backgroundColor: '#B22222' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#991919'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#B22222'}
            >
              Mediator
            </Link>
          </nav>
          {user && (
            <div className="mt-auto pt-4 border-t border-gray-200 space-y-2">
              <div className="text-xs text-gray-600 px-4 truncate">{user.email}</div>
              <button
                onClick={signOut}
                className="w-full px-4 py-2 rounded-lg text-white text-sm font-medium transition-all shadow-md hover:shadow-lg"
                style={{ backgroundColor: '#B22222' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#991919'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#B22222'}
              >
                Logout
              </button>
            </div>
          )}
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6 overflow-y-auto overflow-x-hidden">
          <div className="max-w-6xl mx-auto space-y-6">
            {/* Header */}
            <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-200">
              <h1 className="text-3xl font-bold" style={{ color: '#B22222' }}>Tasks & Schedule</h1>
              <p className="text-sm text-gray-700 mt-1">Manage tasks and generate cleaning schedules</p>
            </div>

          {/* Group Selector */}
          <section className="bg-white rounded-2xl shadow-sm p-6 border border-gray-200">
            <label className="block text-sm font-medium mb-2 text-gray-700">Select Group</label>
            <select
              value={selectedGroupId || ""}
              onChange={(e) => setSelectedGroupId(e.target.value)}
              className="border border-gray-300 p-3 rounded-lg w-full focus:outline-none focus:ring-2 focus:border-transparent transition-all text-gray-900"
              style={{ '--tw-ring-color': '#B22222' } as React.CSSProperties}
            >
              <option value="">Select a group...</option>
              {groups.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.name}
                </option>
              ))}
            </select>
          </section>

          {selectedGroupId && (
            <>
              {/* Group Members */}
              <section className="bg-white rounded-2xl shadow-sm p-6 border border-gray-200 space-y-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold" style={{ color: '#B22222' }}>Group Members</h2>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Add test user..."
                      value={newMemberName}
                      onChange={(e) => setNewMemberName(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && addMember()}
                      className="border border-gray-300 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent transition-all text-gray-900"
                      style={{ '--tw-ring-color': '#B22222' } as React.CSSProperties}
                    />
                    <button
                      onClick={addMember}
                      disabled={addingMember || !newMemberName.trim()}
                      className="px-4 py-2 rounded-lg text-white text-sm font-medium transition-all disabled:opacity-50"
                      style={{ backgroundColor: '#B22222' }}
                      onMouseEnter={(e) => !e.currentTarget.disabled && (e.currentTarget.style.backgroundColor = '#991919')}
                      onMouseLeave={(e) => !e.currentTarget.disabled && (e.currentTarget.style.backgroundColor = '#B22222')}
                    >
                      {addingMember ? "Adding..." : "Add"}
                    </button>
                  </div>
                </div>
                {members.length === 0 ? (
                  <div className="text-center py-4 text-gray-500 text-sm">No members yet. Add some test users!</div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {members.map((member) => (
                      <div
                        key={member.id}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg text-sm font-medium text-blue-900"
                      >
                        <span>{member.user_name}</span>
                        <button
                          onClick={() => removeMember(member.id)}
                          className="text-red-600 hover:text-red-800 text-lg leading-none font-bold"
                          title="Remove member"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {/* Add Task */}
              <section className="bg-white rounded-2xl shadow-sm p-6 border border-gray-200 space-y-4">
                <h2 className="text-xl font-semibold" style={{ color: '#B22222' }}>Add Task</h2>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Task Title</label>
                    <input
                      type="text"
                      placeholder="e.g., Wash dishes, Take out trash"
                      value={newTask.title}
                      onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                      className="w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Frequency</label>
                    <select
                      value={newTask.freq}
                      onChange={(e) => setNewTask({ ...newTask, freq: e.target.value as Task["freq"] })}
                      className="w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                    >
                      <option value="daily">Daily</option>
                      <option value="every_other_day">Every Other Day</option>
                      <option value="weekly">Weekly</option>
                      <option value="biweekly">Biweekly</option>
                      <option value="monthly">Monthly</option>
                    </select>
                  </div>
                  {newTask.freq !== "daily" && (
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">Preferred Day</label>
                      <select
                        value={newTask.preferred_day ?? ""}
                        onChange={(e) => setNewTask({ ...newTask, preferred_day: e.target.value ? Number(e.target.value) : undefined })}
                        className="w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                      >
                        <option value="">Any day</option>
                        <option value={0}>Sunday</option>
                        <option value={1}>Monday</option>
                        <option value={2}>Tuesday</option>
                        <option value={3}>Wednesday</option>
                        <option value={4}>Thursday</option>
                        <option value={5}>Friday</option>
                        <option value={6}>Saturday</option>
                      </select>
                    </div>
                  )}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Preferred Time</label>
                    <input
                      type="time"
                      value={newTask.preferred_time}
                      onChange={(e) => setNewTask({ ...newTask, preferred_time: e.target.value })}
                      className="w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Duration (minutes)</label>
                    <input
                      type="number"
                      placeholder="e.g., 30"
                      value={newTask.duration_min}
                      onChange={(e) => setNewTask({ ...newTask, duration_min: Number(e.target.value) })}
                      className="w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Start Date</label>
                    <input
                      type="date"
                      value={newTask.start_date}
                      onChange={(e) => setNewTask({ ...newTask, start_date: e.target.value })}
                      className="w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">End Date (optional)</label>
                    <input
                      type="date"
                      value={newTask.end_date || ""}
                      onChange={(e) => setNewTask({ ...newTask, end_date: e.target.value })}
                      className="w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700">Notes (optional)</label>
                    <input
                      type="text"
                      placeholder="Additional details or instructions"
                      value={newTask.notes}
                      onChange={(e) => setNewTask({ ...newTask, notes: e.target.value })}
                      className="w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                    />
                  </div>
                </div>
                <button
                  onClick={createTask}
                  disabled={loading || !newTask.title.trim()}
                  className="w-full px-6 py-3 rounded-lg text-white font-medium transition-all shadow-md hover:shadow-lg disabled:opacity-50"
                  style={{ backgroundColor: '#B22222' }}
                  onMouseEnter={(e) => !e.currentTarget.disabled && (e.currentTarget.style.backgroundColor = '#991919')}
                  onMouseLeave={(e) => !e.currentTarget.disabled && (e.currentTarget.style.backgroundColor = '#B22222')}
                >
                  {loading ? "Adding..." : "Add Task"}
                </button>
              </section>

              {/* Tasks List */}
              <section className="bg-white rounded-2xl shadow-sm p-6 border border-gray-200 space-y-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold" style={{ color: '#B22222' }}>Tasks</h2>
                  <button
                    onClick={generateSchedule}
                    disabled={generating || tasks.length === 0}
                    className="px-4 py-2 rounded-lg text-white text-sm font-medium transition-all disabled:opacity-50"
                    style={{ backgroundColor: '#B22222' }}
                    onMouseEnter={(e) => !e.currentTarget.disabled && (e.currentTarget.style.backgroundColor = '#991919')}
                    onMouseLeave={(e) => !e.currentTarget.disabled && (e.currentTarget.style.backgroundColor = '#B22222')}
                  >
                    {generating ? "Generating..." : "Generate Schedule"}
                  </button>
                </div>
                {tasks.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">No tasks yet. Add one above.</div>
                ) : (
                  <div className="space-y-2">
                    {tasks.map((task) => (
                      <div
                        key={task.id}
                        className="flex items-center justify-between border border-gray-200 rounded-lg p-4"
                        style={{ backgroundColor: '#FCFBF4' }}
                      >
                        <div>
                            <div className="font-medium text-gray-900">{task.title}</div>
                            <div className="text-sm text-gray-600">
                              {task.freq}
                              {task.preferred_day !== undefined && task.preferred_day !== null && ` • Day ${task.preferred_day}`}
                              {task.preferred_time && ` • ${task.preferred_time}`}
                              {task.duration_min && ` • ${task.duration_min} min`}
                            </div>
                          {task.notes && <div className="text-xs text-gray-500 mt-1">{task.notes}</div>}
                        </div>
                        <button
                          onClick={() => deleteTask(task.id)}
                          className="px-3 py-1 rounded-lg bg-red-500 text-white text-sm hover:bg-red-600"
                        >
                          Delete
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {/* Schedule/Assignments Calendar */}
              <section className="bg-white rounded-2xl shadow-sm p-6 border border-gray-200 space-y-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold" style={{ color: '#B22222' }}>Schedule Calendar</h2>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        const newDate = new Date(calendarDate);
                        newDate.setMonth(newDate.getMonth() - 1);
                        setCalendarDate(newDate);
                      }}
                      className="px-3 py-1 rounded-lg border border-gray-300 text-sm hover:bg-gray-50"
                    >
                      ← Prev
                    </button>
                    <button
                      onClick={() => setCalendarDate(new Date())}
                      className="px-3 py-1 rounded-lg border border-gray-300 text-sm hover:bg-gray-50"
                    >
                      Today
                    </button>
                    <button
                      onClick={() => {
                        const newDate = new Date(calendarDate);
                        newDate.setMonth(newDate.getMonth() + 1);
                        setCalendarDate(newDate);
                      }}
                      className="px-3 py-1 rounded-lg border border-gray-300 text-sm hover:bg-gray-50"
                    >
                      Next →
                    </button>
                  </div>
                </div>
                {assignments.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    Generate a schedule to see assignments
                  </div>
                ) : (
                  <>
                    <CalendarView
                      date={calendarDate}
                      assignments={assignments}
                      onToggleAssignment={toggleAssignment}
                      selectedAssignmentId={selectedAssignmentId}
                      selectedGroupId={selectedGroupId}
                      router={router}
                      setSelectedAssignmentId={setSelectedAssignmentId}
                    />
                    {selectedAssignmentId && (
                      <AssignmentDetails
                        assignment={assignments.find(a => a.id === selectedAssignmentId)}
                        onClose={() => {
                          setSelectedAssignmentId(null);
                          const params = new URLSearchParams();
                          if (selectedGroupId) params.set("group", selectedGroupId);
                          router.push(`/schedule?${params.toString()}`);
                        }}
                        onToggle={toggleAssignment}
                      />
                    )}
                  </>
                )}
              </section>
            </>
          )}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}

