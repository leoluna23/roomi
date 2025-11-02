"use client";
import { useEffect, useState } from "react";
import { useAuth } from "../auth/context";
import { ProtectedRoute } from "../ProtectedRoute";
import Link from "next/link";

type Group = { id: string; name: string; join_token: string };
type Member = { id: string; user_name: string };

export default function GroupsPage() {
  const { user, signOut } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [newGroupName, setNewGroupName] = useState("");
  const [joinToken, setJoinToken] = useState("");
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadGroups();
  }, []);

  async function loadGroups() {
    if (!user?.id) return;
    try {
      const res = await fetch("/api/groups");
      if (!res.ok) return;
      const text = await res.text();
      const allGroups = text ? JSON.parse(text).groups || [] : [];
      
      // Filter to only show groups where user is a member
      // Get user's profile name to match against members
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
              const isMember = members.some((m: Member) => 
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
    } catch (err) {
      console.error("Failed to load groups:", err);
    }
  }

  async function createGroup() {
    if (!newGroupName.trim() || !user?.id) return;
    setLoading(true);
    try {
      const res = await fetch("/api/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newGroupName, user_id: user.id, user_email: user.email }),
      });
      if (res.ok) {
        setNewGroupName("");
        loadGroups();
      }
    } catch (err) {
      console.error("Failed to create group:", err);
    } finally {
      setLoading(false);
    }
  }

  async function joinGroup() {
    if (!joinToken.trim() || !user?.id) return;
    setLoading(true);
    try {
      // Fetch user's profile name
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
      const displayName = userProfileName || userEmailPrefix || "User";
      
      const res = await fetch("/api/groups/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: joinToken, user_name: displayName }),
      });
      if (res.ok) {
        setJoinToken("");
        loadGroups();
      }
    } catch (err) {
      console.error("Failed to join group:", err);
    } finally {
      setLoading(false);
    }
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
              <h1 className="text-3xl font-bold" style={{ color: '#B22222' }}>Groups</h1>
              <p className="text-sm text-gray-700 mt-1">Manage your roommate groups</p>
            </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Create Group */}
            <section className="bg-white rounded-2xl shadow-sm p-6 border border-gray-200 space-y-4">
                  <h2 className="text-xl font-semibold" style={{ color: '#B22222' }}>Create Group</h2>
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Group name"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  className="border border-gray-300 p-3 rounded-lg w-full focus:outline-none focus:ring-2 focus:border-transparent transition-all text-gray-900"
                  style={{ '--tw-ring-color': '#B22222' } as React.CSSProperties}
                />
                <button
                  onClick={createGroup}
                  disabled={loading || !newGroupName.trim()}
                  className="w-full px-6 py-3 rounded-lg text-white font-medium transition-all shadow-md hover:shadow-lg disabled:opacity-50"
                  style={{ backgroundColor: '#B22222' }}
                  onMouseEnter={(e) => !e.currentTarget.disabled && (e.currentTarget.style.backgroundColor = '#991919')}
                  onMouseLeave={(e) => !e.currentTarget.disabled && (e.currentTarget.style.backgroundColor = '#B22222')}
                >
                  {loading ? "Creating..." : "Create Group"}
                </button>
              </div>
            </section>

            {/* Join Group */}
            <section className="bg-white rounded-2xl shadow-sm p-6 border border-gray-200 space-y-4">
                  <h2 className="text-xl font-semibold" style={{ color: '#B22222' }}>Join Group</h2>
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Join token"
                  value={joinToken}
                  onChange={(e) => setJoinToken(e.target.value.toUpperCase())}
                  className="border border-gray-300 p-3 rounded-lg w-full focus:outline-none focus:ring-2 focus:border-transparent transition-all text-gray-900"
                  style={{ '--tw-ring-color': '#B22222' } as React.CSSProperties}
                />
                <button
                  onClick={joinGroup}
                  disabled={loading || !joinToken.trim()}
                  className="w-full px-6 py-3 rounded-lg text-white font-medium transition-all shadow-md hover:shadow-lg disabled:opacity-50"
                  style={{ backgroundColor: '#B22222' }}
                  onMouseEnter={(e) => !e.currentTarget.disabled && (e.currentTarget.style.backgroundColor = '#991919')}
                  onMouseLeave={(e) => !e.currentTarget.disabled && (e.currentTarget.style.backgroundColor = '#B22222')}
                >
                  {loading ? "Joining..." : "Join Group"}
                </button>
              </div>
            </section>
          </div>

          {/* Your Groups */}
          <section className="bg-white rounded-2xl shadow-sm p-6 border border-gray-200 space-y-4">
            <h2 className="text-xl font-semibold" style={{ color: '#B22222' }}>Your Groups</h2>
            {groups.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                Create or join a group to get started
              </div>
            ) : (
              <div className="space-y-3">
                {groups.map((group) => (
                  <Link
                    key={group.id}
                    href={`/schedule?group=${group.id}`}
                    className="block border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow"
                    style={{ backgroundColor: '#FCFBF4' }}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-gray-900">{group.name}</div>
                        <div className="text-sm text-gray-600">Token: {group.join_token}</div>
                      </div>
                      <div className="text-gray-400">→</div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}

