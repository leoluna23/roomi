"use client";
import { useEffect, useState } from "react";
import { useAuth } from "./auth/context";
import Link from "next/link";
import { ProtectedRoute } from "./ProtectedRoute";



type Group = { id: string; name: string; join_token: string };
type Task = {
  id: string;
  title: string;
  freq: string;
  preferred_day?: number | null;
  preferred_time?: string | null;
  duration_min?: number | null;
  notes?: string | null;
  group_id: string;
};
type Member = { id: string; user_name: string; group_id: string };
type Assignment = {
  id: string;
  task_id: string;
  member_id: string;
  when_ts: string;
  completed_at?: string | null;
  task?: Task;
  member?: Member;
};

// Assignment Details Modal Component
function AssignmentModal({
  assignment,
  onClose,
  onToggle,
}: {
  assignment: Assignment | null;
  onClose: () => void;
  onToggle: (id: string, completed: boolean) => void;
}) {
  if (!assignment) return null;

  return (
    <div className="fixed inset-0 bg-opacity-75 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4 border-2 border-gray-200" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-start">
          <h3 className="text-xl font-semibold text-gray-900">Task Details</h3>
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
                // Note: This won't update the dashboard immediately since assignments come from API
                // You might want to reload assignments after toggle
              }}
              className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium ${
                assignment.completed_at
                  ? "bg-orange-500 text-white hover:bg-orange-600"
                  : "bg-green-500 text-white hover:bg-green-600"
              }`}
            >
              {assignment.completed_at ? "Mark Incomplete" : "Mark Complete"}
            </button>
            <Link
              href={`/schedule?group=${assignment.task?.group_id}&assignment=${assignment.id}`}
              className="flex-1 px-4 py-2 rounded-lg text-sm font-medium text-center border border-gray-300 hover:bg-gray-50"
            >
              View in Schedule
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const { user, signOut } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [allAssignments, setAllAssignments] = useState<Assignment[]>([]);
  const [userMemberIds, setUserMemberIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [billBalance, setBillBalance] = useState<{
    youOwe: number;
    owedToYou: number;
    netBalance: number;
  }>({ youOwe: 0, owedToYou: 0, netBalance: 0 });

  useEffect(() => {
    loadDashboardData();
    
    // Check for bill updates and refresh if needed
    const checkBillUpdates = () => {
      const billUpdated = localStorage.getItem("billUpdated");
      if (billUpdated) {
        // Clear the flag
        localStorage.removeItem("billUpdated");
        // Reload bill balance by reloading dashboard data
        loadDashboardData();
      }
    };
    
    // Check immediately and also set up interval to check periodically when on dashboard
    checkBillUpdates();
    const interval = setInterval(checkBillUpdates, 2000); // Check every 2 seconds
    
    return () => clearInterval(interval);
  }, [user]);

  async function loadDashboardData() {
    setLoading(true);
    try {
      // Load all groups
      const groupsRes = await fetch("/api/groups");
      if (!groupsRes.ok) {
        const errorText = await groupsRes.text();
        console.error("Failed to load groups:", groupsRes.status, groupsRes.statusText);
        console.error("Error response:", errorText);
        setLoading(false);
        return;
      }
      const groupsData = await groupsRes.json().catch(() => ({ groups: [] }));
      const allGroups = groupsData.groups || [];

      // Load user's profile name to match against members
      let userProfileName = "";
      if (user?.id) {
        try {
          const profileRes = await fetch(`/api/profile?user_id=${user.id}`);
          if (profileRes.ok) {
            const profileData = await profileRes.json();
            userProfileName = profileData.profile?.name?.trim() || "";
          }
        } catch (error) {
          console.error("Failed to load user profile:", error);
        }
      }
      const userEmailPrefix = user?.email?.split("@")[0] || "";
      
      // Filter groups to only show ones where user is actually a member
      // and get user's member IDs
      const groupMembershipPromises = allGroups.map(async (group: Group) => {
        try {
          const res = await fetch(`/api/groups/${group.id}/members`);
          if (res.ok) {
            const data = await res.json().catch(() => ({ members: [] }));
            const members = data.members || [];
            // Match by profile name first, then email prefix (for backwards compatibility)
            const userMember = members.find((m: Member) => 
              (userProfileName && m.user_name === userProfileName) || 
              (!userProfileName && m.user_name === userEmailPrefix)
            );
            return userMember ? { group, memberId: userMember.id } : null;
          }
          return null;
        } catch (error) {
          console.error(`Error loading members for group ${group.id}:`, error);
          return null;
        }
      });

      const groupMemberships = await Promise.all(groupMembershipPromises);
      const userGroups = groupMemberships
        .filter((gm): gm is { group: Group; memberId: string } => gm !== null)
        .map(gm => gm.group);
      const validMemberIds = groupMemberships
        .filter((gm): gm is { group: Group; memberId: string } => gm !== null)
        .map(gm => gm.memberId);
      
      setGroups(userGroups);
      setUserMemberIds(new Set(validMemberIds));

      // Load assignments for all groups
      const assignmentPromises = userGroups.map(async (group: Group) => {
        try {
          const res = await fetch(
            `/api/groups/${group.id}/schedule?start=${new Date().toISOString()}&end=${new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()}`
          );
          if (res.ok) {
            const data = await res.json().catch(() => ({ assignments: [] }));
            return data.assignments || [];
          }
          return [];
        } catch (error) {
          console.error(`Error loading assignments for group ${group.id}:`, error);
          return [];
        }
      });

      const allAssignmentsData = await Promise.all(assignmentPromises);
      const flattened = allAssignmentsData.flat();
      setAllAssignments(flattened);

      // Load bill balance data
      await loadBillBalance(userGroups);
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    } finally {
      setLoading(false);
    }
  }

  async function loadBillBalance(userGroups: Group[]) {
    if (!user || userGroups.length === 0) {
      setBillBalance({ youOwe: 0, owedToYou: 0, netBalance: 0 });
      return;
    }

    // Get user profile name for bill matching
    let billUserProfileName = "";
    if (user?.id) {
      try {
        const profileRes = await fetch(`/api/profile?user_id=${user.id}`);
        if (profileRes.ok) {
          const profileData = await profileRes.json();
          billUserProfileName = profileData.profile?.name?.trim() || "";
        }
      } catch (error) {
        // Ignore errors, will use email prefix as fallback
      }
    }
    const userEmailPrefix = user?.email?.split("@")[0] || "";
    const userDisplayName = billUserProfileName || userEmailPrefix;

    try {
      let youOwe = 0;
      let owedToYou = 0;

      for (const group of userGroups) {
        const res = await fetch(`/api/groups/${group.id}/bills`);
        if (res.ok) {
          const data = await res.json();
          const bills = data.bills || [];

          for (const bill of bills) {
            const splits = bill.splits || [];
            // Match by profile name first, then email prefix (for backwards compatibility)
            const userSplit = splits.find((s: any) => {
              const memberName = s.member?.user_name || "";
              return memberName === userDisplayName || 
                     (billUserProfileName && memberName === userEmailPrefix) ||
                     (!billUserProfileName && memberName === userEmailPrefix);
            });

            const paidByName = bill.paid_by_member?.user_name || "";
            if (paidByName === userDisplayName || 
                (billUserProfileName && paidByName === userEmailPrefix) ||
                (!billUserProfileName && paidByName === userEmailPrefix)) {
              // User paid this bill, others owe them
              const othersSplits = splits.filter((s: any) => {
                const memberName = s.member?.user_name || "";
                return memberName !== userDisplayName && 
                       memberName !== userEmailPrefix;
              });
              owedToYou += othersSplits.reduce((sum: number, s: any) => sum + (s.amount || 0), 0);
            } else if (userSplit && !userSplit.paid_at) {
              // User owes this bill
              youOwe += userSplit.amount || 0;
            }
          }
        }
      }

      setBillBalance({
        youOwe,
        owedToYou,
        netBalance: owedToYou - youOwe,
      });
    } catch (error) {
      console.error("Error loading bill balance:", error);
    }
  }

  const totalGroups = groups.length;
  
  // Personal assignments (assigned to the user)
  const myAssignments = allAssignments.filter((a) => userMemberIds.has(a.member_id));
  const myCompletedCount = myAssignments.filter((a) => a.completed_at).length;
  const myPendingCount = myAssignments.filter((a) => !a.completed_at).length;
  
  // Group-wide stats (all assignments)
  const completedCount = allAssignments.filter((a) => a.completed_at).length;
  const pendingCount = allAssignments.filter((a) => !a.completed_at).length;
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const myTodayAssignments = myAssignments.filter((a) => {
    const assignmentDate = new Date(a.when_ts);
    assignmentDate.setHours(0, 0, 0, 0);
    return assignmentDate.getTime() === today.getTime() && !a.completed_at;
  }).length;
  
  const todayAssignments = allAssignments.filter((a) => {
    const assignmentDate = new Date(a.when_ts);
    assignmentDate.setHours(0, 0, 0, 0);
    return assignmentDate.getTime() === today.getTime();
  }).length;

  // My upcoming personal assignments
  const myUpcomingAssignments = myAssignments
    .filter((a) => new Date(a.when_ts) >= new Date() && !a.completed_at)
    .sort((a, b) => new Date(a.when_ts).getTime() - new Date(b.when_ts).getTime())
    .slice(0, 5);
    
  // All upcoming assignments (for group context)
  const upcomingAssignments = allAssignments
    .filter((a) => new Date(a.when_ts) >= new Date() && !a.completed_at)
    .sort((a, b) => new Date(a.when_ts).getTime() - new Date(b.when_ts).getTime())
    .slice(0, 5);

  function formatDate(dateString: string) {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }

  function formatTime(dateString: string) {
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  }

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
              <h1 className="text-3xl font-bold" style={{ color: '#B22222' }}>Dashboard</h1>
              <p className="text-sm text-gray-700 mt-1">Overview of your roommate groups and tasks</p>
            </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="text-gray-500">Loading dashboard...</div>
            </div>
          ) : (
            <>
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-200">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#B22222' }}>
                      <img src="/icons/users.svg" alt="Groups" className="w-6 h-6" style={{ filter: 'brightness(0) invert(1)' }} />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-gray-900">{totalGroups}</div>
                      <div className="text-sm text-gray-600">Groups</div>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-200">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#B22222' }}>
                      <img src="/icons/check.svg" alt="Completed" className="w-6 h-6" style={{ filter: 'brightness(0) invert(1)' }} />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-gray-900">{myCompletedCount}</div>
                      <div className="text-sm text-gray-600">My Completed</div>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-200">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#B22222' }}>
                      <img src="/icons/calendar-clock.svg" alt="Pending" className="w-6 h-6" style={{ filter: 'brightness(0) invert(1)' }} />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-gray-900">{myPendingCount}</div>
                      <div className="text-sm text-gray-600">My Pending</div>
                    </div>
        </div>
        </div>

                <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-200">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#B22222' }}>
                      <img src="/icons/calendar.svg" alt="Today" className="w-6 h-6" style={{ filter: 'brightness(0) invert(1)' }} />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-gray-900">{myTodayAssignments}</div>
                      <div className="text-sm text-gray-600">My Tasks Today</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bill Balance Section */}
              <section className="bg-white rounded-2xl shadow-sm p-6 border border-gray-200 space-y-4">
                <div className="flex items-center gap-2">
                  <div className="w-1 h-6 rounded-full" style={{ backgroundColor: '#B22222' }}></div>
                  <h2 className="text-xl font-semibold text-gray-900">Bill Balance</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="border border-gray-200 rounded-lg p-4" style={{ backgroundColor: '#FCFBF4' }}>
                    <div className="text-sm text-gray-600 mb-1">You Owe</div>
                    <div className="text-2xl font-bold" style={{ color: '#B22222' }}>
                      ${billBalance.youOwe.toFixed(2)}
                    </div>
                  </div>
                  <div className="border border-gray-200 rounded-lg p-4" style={{ backgroundColor: '#FCFBF4' }}>
                    <div className="text-sm text-gray-600 mb-1">Owed To You</div>
                    <div className="text-2xl font-bold text-green-600">
                      ${billBalance.owedToYou.toFixed(2)}
                    </div>
                  </div>
                  <div className={`border rounded-lg p-4 ${
                    billBalance.netBalance >= 0 
                      ? 'border-green-200 bg-green-50' 
                      : 'border-red-200 bg-red-50'
                  }`}>
                    <div className="text-sm text-gray-600 mb-1">Net Balance</div>
                    <div className={`text-2xl font-bold ${
                      billBalance.netBalance >= 0 
                        ? 'text-green-600' 
                        : 'text-red-600'
                    }`}>
                      {billBalance.netBalance >= 0 ? '+' : ''}${billBalance.netBalance.toFixed(2)}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {billBalance.netBalance >= 0 
                        ? 'You are owed money' 
                        : 'You owe money'}
                    </div>
                  </div>
                </div>
                {groups.length > 0 && (
                  <div className="pt-2 border-t border-gray-200">
                    <Link
                      href="/bills"
                      className="text-sm font-medium"
                      style={{ color: '#B22222' }}
                      onMouseEnter={(e) => e.currentTarget.style.color = '#991919'}
                      onMouseLeave={(e) => e.currentTarget.style.color = '#B22222'}
                    >
                      View All Bills →
                    </Link>
                  </div>
                )}
              </section>

              <div className="grid md:grid-cols-2 gap-6">
                {/* My Personal Tasks */}
                <section className="bg-white rounded-2xl shadow-sm p-6 border border-gray-200 space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="w-1 h-6 rounded-full" style={{ backgroundColor: '#B22222' }}></div>
                    <h2 className="text-xl font-semibold text-gray-900">My Tasks</h2>
                  </div>
                  {myUpcomingAssignments.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="flex justify-center mb-3">
                        <img src="/icons/hand-metal.svg" alt="Empty" className="w-16 h-16 opacity-50" />
                      </div>
                      <p className="text-sm text-gray-600">
                        {totalGroups === 0
                          ? "Create or join a group to see your assignments"
                          : "No upcoming tasks assigned to you"}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {myUpcomingAssignments.map((assignment) => (
                        <div
                          key={assignment.id}
                          onClick={() => setSelectedAssignment(assignment)}
                          className="border-2 border-gray-300 rounded-lg p-4 hover:shadow-md hover:border-indigo-500 transition-all cursor-pointer"
                          style={{ backgroundColor: '#FCFBF4' }}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="font-semibold text-sm text-gray-900">
                                {assignment.task?.title || "Unknown Task"}
                              </div>
                              <div className="text-xs text-gray-600 mt-1">
                                {assignment.task?.group_id && groups.find(g => g.id === assignment.task?.group_id)?.name} • {formatDate(assignment.when_ts)}{" "}
                                {formatTime(assignment.when_ts)}
                              </div>
                              {assignment.task?.duration_min && (
                                <div className="text-xs text-gray-500 mt-1">
                                  Duration: {assignment.task.duration_min} min
                                </div>
                              )}
                              {assignment.task?.notes && (
                                <div className="text-xs text-gray-500 mt-1 italic">
                                  {assignment.task.notes}
                                </div>
                              )}
                            </div>
                            <div className="ml-3">
                              {assignment.completed_at ? (
                                <span className="text-green-600 text-sm font-bold">✓</span>
                              ) : (
                                <span className="text-orange-500 text-sm font-bold">○</span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {myUpcomingAssignments.length > 0 && (
                    <Link
                      href="/schedule"
                      className="block text-center text-sm font-medium pt-2 border-t border-gray-200"
                      style={{ color: '#B22222' }}
                      onMouseEnter={(e) => e.currentTarget.style.color = '#991919'}
                      onMouseLeave={(e) => e.currentTarget.style.color = '#B22222'}
                    >
                      View All My Assignments →
                    </Link>
                  )}
                </section>

                {/* Group Tasks Overview */}
                <section className="bg-white rounded-2xl shadow-sm p-6 border border-gray-200 space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="w-1 h-6 rounded-full" style={{ backgroundColor: '#B22222' }}></div>
                    <h2 className="text-xl font-semibold text-gray-900">Group Tasks</h2>
                  </div>
                  {upcomingAssignments.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="flex justify-center mb-3">
                        <img src="/icons/hand-metal.svg" alt="Empty" className="w-16 h-16 opacity-50" />
                      </div>
                      <p className="text-sm text-gray-600">
                        {totalGroups === 0
                          ? "Create or join a group to see assignments"
                          : "No upcoming assignments in the next 7 days"}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {upcomingAssignments.map((assignment) => (
                        <div
                          key={assignment.id}
                          onClick={() => setSelectedAssignment(assignment)}
                          className={`border rounded-lg p-4 hover:shadow-md transition-all cursor-pointer ${
                            userMemberIds.has(assignment.member_id) 
                              ? 'border-indigo-400 bg-indigo-50' 
                              : 'border-gray-200'
                          }`}
                          style={{ backgroundColor: userMemberIds.has(assignment.member_id) ? '#EEF2FF' : '#FCFBF4' }}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="font-medium text-sm text-gray-900">
                                {assignment.task?.title || "Unknown Task"}
                              </div>
                              <div className="text-xs text-gray-600 mt-1">
                                {assignment.member?.user_name || "Unassigned"} • {formatDate(assignment.when_ts)}{" "}
                                {formatTime(assignment.when_ts)}
                              </div>
                              {assignment.task?.duration_min && (
                                <div className="text-xs text-gray-500 mt-1">
                                  Duration: {assignment.task.duration_min} min
                                </div>
                              )}
                              {assignment.task?.notes && (
                                <div className="text-xs text-gray-500 mt-1 italic">
                                  {assignment.task.notes}
                                </div>
                              )}
                            </div>
                            <div className="ml-3">
                              {assignment.completed_at ? (
                                <span className="text-green-600 text-sm">✓</span>
                              ) : (
                                <span className="text-orange-500 text-sm">○</span>
                              )}
                            </div>
                          </div>
            </div>
          ))}
        </div>
                  )}
                  {upcomingAssignments.length > 0 && (
                    <Link
                      href="/schedule"
                      className="block text-center text-sm font-medium pt-2 border-t border-gray-200"
                      style={{ color: '#B22222' }}
                      onMouseEnter={(e) => e.currentTarget.style.color = '#991919'}
                      onMouseLeave={(e) => e.currentTarget.style.color = '#B22222'}
                    >
                      View All Group Assignments →
                    </Link>
                  )}
      </section>

                {/* Your Groups */}
                <section className="bg-white rounded-2xl shadow-sm p-6 border border-gray-200 space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="w-1 h-6 rounded-full" style={{ backgroundColor: '#B22222' }}></div>
                    <h2 className="text-xl font-semibold text-gray-900">Your Groups</h2>
                  </div>
                  {groups.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="flex justify-center mb-3">
                        <img src="/icons/annoyed.svg" alt="Empty" className="w-16 h-16 opacity-50" />
                      </div>
                      <p className="text-sm text-gray-600 mb-4">You haven't joined any groups yet</p>
                      <Link
                      href="/groups"
                      className="inline-block px-4 py-2 rounded-lg text-white text-sm font-medium transition-all shadow-md hover:shadow-lg"
                      style={{ backgroundColor: '#B22222' }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#991919'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#B22222'}
                      >
                        Create or Join Group
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {groups.map((group) => (
                        <Link
                          key={group.id}
                          href="/groups"
                          className="block border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow"
                          style={{ backgroundColor: '#FCFBF4' }}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="font-medium text-sm text-gray-900">{group.name}</div>
                              <div className="text-xs text-gray-600 mt-1">Token: {group.join_token}</div>
                            </div>
                            <div className="text-gray-400">→</div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                  {groups.length > 0 && (
                    <Link
                      href="/groups"
                      className="block text-center text-sm font-medium pt-2 border-t border-gray-200"
                      style={{ color: '#B22222' }}
                      onMouseEnter={(e) => e.currentTarget.style.color = '#991919'}
                      onMouseLeave={(e) => e.currentTarget.style.color = '#B22222'}
                    >
                      Manage Groups →
                    </Link>
                  )}
                </section>
              </div>

              {/* Quick Actions */}
              <section className="bg-white rounded-2xl shadow-sm p-6 border border-gray-200 space-y-4">
                <div className="flex items-center gap-2">
                    <div className="w-1 h-6 rounded-full" style={{ backgroundColor: '#B22222' }}></div>
                  <h2 className="text-xl font-semibold text-gray-900">Quick Actions</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Link
                    href="/groups"
                      className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg hover:shadow-sm transition-all"
                      style={{ backgroundColor: '#FCFBF4' }}
                  >
                    <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#B22222' }}>
                      {/* QUICK ACTION ICON 1 - CREATE GROUP: Replace the <span> below with your custom icon */}
                      {/* Option 1: Image file - Place your icon file in /public/icons/ and use:
                          <img src="/icons/create-group-icon.svg" alt="Create Group" className="w-6 h-6" /> */}
                      {/* Option 2: Inline SVG - Replace <span> with your SVG code */}
                      <img src="/icons/square-plus.svg" alt="Create Group" className="w-6 h-6" style={{ filter: 'brightness(0) invert(1)' }} />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-sm text-gray-900">Create Group</div>
                      <div className="text-xs text-gray-600">Start a new roommate group</div>
                    </div>
                  </Link>

                  <Link
                    href="/schedule"
                      className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg hover:shadow-sm transition-all"
                      style={{ backgroundColor: '#FCFBF4' }}
                  >
                    <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#B22222' }}>
                      {/* QUICK ACTION ICON 2 - MANAGE SCHEDULE: Replace the <span> below with your custom icon */}
                      <img src="/icons/calendar.svg" alt="Manage Schedule" className="w-6 h-6" style={{ filter: 'brightness(0) invert(1)' }} />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-sm text-gray-900">Manage Schedule</div>
                      <div className="text-xs text-gray-600">Tasks and assignments</div>
                    </div>
                  </Link>

                  <Link
                    href="/match"
                      className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg hover:shadow-sm transition-all"
                      style={{ backgroundColor: '#FCFBF4' }}
                  >
                    <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#B22222' }}>
                      {/* QUICK ACTION ICON 3 - FIND MATCHES: Replace the <span> below with your custom icon */}
                      <img src="/icons/user-search.svg" alt="Find Matches" className="w-6 h-6" style={{ filter: 'brightness(0) invert(1)' }} />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-sm text-gray-900">Find Matches</div>
                      <div className="text-xs text-gray-600">Discover roommate matches</div>
                    </div>
                  </Link>

                  <Link
                    href="/bills"
                      className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg hover:shadow-sm transition-all"
                      style={{ backgroundColor: '#FCFBF4' }}
                  >
                    <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#B22222' }}>
                      {/* QUICK ACTION ICON 4 - SPLIT BILLS: Replace the <span> below with your custom icon */}
                      <img src="/icons/piggy-bank.svg" alt="Split Bills" className="w-6 h-6" style={{ filter: 'brightness(0) invert(1)' }} />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-sm text-gray-900">Split Bills</div>
                      <div className="text-xs text-gray-600">Manage expenses</div>
                    </div>
                  </Link>
                </div>
              </section>
            </>
          )}
          {selectedAssignment && (
            <AssignmentModal
              assignment={selectedAssignment}
              onClose={() => setSelectedAssignment(null)}
              onToggle={async (id: string, completed: boolean) => {
                try {
                  // Find the group ID for this assignment
                  const groupId = selectedAssignment.task?.group_id || 
                    groups.find(g => 
                      allAssignments.find(a => a.task?.group_id === g.id && a.id === id)
                    )?.id || 
                    groups[0]?.id;
                  
                  if (groupId) {
                    const res = await fetch(
                      `/api/groups/${groupId}/assignments/${id}`,
                      {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ completed }),
                      }
                    );
                    if (res.ok) {
                      // Update the assignment in local state
                      setAllAssignments(prev => 
                        prev.map(a => 
                          a.id === id 
                            ? { ...a, completed_at: completed ? new Date().toISOString() : null }
                            : a
                        )
                      );
                      // Update selected assignment
                      setSelectedAssignment({
                        ...selectedAssignment,
                        completed_at: completed ? new Date().toISOString() : null,
                      });
                    }
                  }
                } catch (err) {
                  console.error("Failed to toggle assignment:", err);
                }
              }}
            />
            )}
          </div>
    </main>
      </div>
    </ProtectedRoute>
  );
}
