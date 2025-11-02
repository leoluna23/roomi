"use client";
import { useState, useEffect } from "react";
import { useAuth } from "../auth/context";
import { ProtectedRoute } from "../ProtectedRoute";
import Link from "next/link";
import type { Profile } from "@/lib/types";

export default function MatchPage() {
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState<Profile>({
    name: "",
    major: "",
    bio: "",
    sleep_sched: "normal",
    cleanliness: "medium",
    noise: "moderate",
    guests: "sometimes",
    budget_min: undefined,
    budget_max: undefined,
    interests: [],
  });
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [useSavedProfile, setUseSavedProfile] = useState(false);
  const [groups, setGroups] = useState<{ id: string; name: string }[]>([]);
  const [invitingToGroup, setInvitingToGroup] = useState<string | null>(null);
  const [inviteModalOpen, setInviteModalOpen] = useState<string | null>(null); // Stores the match name for which modal is open
  const [selectedMatch, setSelectedMatch] = useState<any | null>(null); // Stores the selected match for detailed view

  useEffect(() => {
    if (user?.id) {
      loadSavedProfile();
    } else {
      setLoadingProfile(false);
    }
    loadGroups();
  }, [user]);

  async function loadSavedProfile() {
    if (!user?.id) return;
    setLoadingProfile(true);
    try {
      const res = await fetch(`/api/profile?user_id=${user.id}`);
      if (res.ok) {
        const data = await res.json();
        if (data.profile && data.profile.name) {
          // Only auto-load if profile has a name
          setProfile({
            name: data.profile.name || "",
            major: data.profile.major || "",
            bio: data.profile.bio || "",
            sleep_sched: data.profile.sleep_sched || "normal",
            cleanliness: data.profile.cleanliness || "medium",
            noise: data.profile.noise || "moderate",
            guests: data.profile.guests || "sometimes",
            budget_min: data.profile.budget_min || undefined,
            budget_max: data.profile.budget_max || undefined,
            interests: data.profile.interests || [],
          });
          setUseSavedProfile(true);
        }
      }
    } catch (err) {
      console.error("Failed to load saved profile:", err);
    } finally {
      setLoadingProfile(false);
    }
  }

  async function handleMatch() {
    if (!profile.name?.trim()) {
      alert("Please enter your name or load your saved profile");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/demo-candidates.json");
      const candidates = await res.json();
      const matchRes = await fetch("/api/match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ me: profile, candidates }),
      });
      const data = await matchRes.json();
      setResults(data.results || []);
    } catch (err) {
      console.error("Match error:", err);
      alert("Failed to find matches. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function loadGroups() {
    try {
      const res = await fetch("/api/groups");
      if (res.ok) {
        const text = await res.text();
        const data = text ? JSON.parse(text) : { groups: [] };
        setGroups(data.groups || []);
      }
    } catch (err) {
      console.error("Failed to load groups:", err);
    }
  }

  async function inviteToGroup(matchName: string, groupId: string) {
    setInvitingToGroup(groupId);
    try {
      const res = await fetch(`/api/groups/${groupId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_name: matchName }),
      });
      if (res.ok) {
        alert(`${matchName} has been added to the group!`);
      } else {
        const error = await res.json();
        alert(error.error || "Failed to invite to group");
      }
    } catch (err) {
      console.error("Failed to invite to group:", err);
      alert("Failed to invite to group");
    } finally {
      setInvitingToGroup(null);
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
              <h1 className="text-3xl font-bold" style={{ color: '#B22222' }}>Find Matches</h1>
              <p className="text-sm text-gray-700 mt-1">Profile & Roommate Matching</p>
            </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Profile Form */}
            <section className="bg-white rounded-2xl shadow-sm p-6 border border-gray-200 space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold" style={{ color: '#B22222' }}>Your Profile</h2>
                {useSavedProfile && (
                  <span className="text-xs px-2 py-1 rounded bg-green-100 text-green-700">Using saved profile</span>
                )}
              </div>
              <div className="flex gap-2 mb-3">
                <button
                  onClick={loadSavedProfile}
                  disabled={loadingProfile}
                  className="px-3 py-1.5 rounded-lg text-sm font-medium text-white transition-all shadow-sm hover:shadow-md disabled:opacity-50"
                  style={{ backgroundColor: '#B22222' }}
                  onMouseEnter={(e) => !e.currentTarget.disabled && (e.currentTarget.style.backgroundColor = '#991919')}
                  onMouseLeave={(e) => !e.currentTarget.disabled && (e.currentTarget.style.backgroundColor = '#B22222')}
                >
                  {loadingProfile ? "Loading..." : "Load Saved Profile"}
                </button>
                {useSavedProfile && (
                  <button
                    onClick={() => {
                      setUseSavedProfile(false);
                      setProfile({
                        name: "",
                        major: "",
                        bio: "",
                        sleep_sched: "normal",
                        cleanliness: "medium",
                        noise: "moderate",
                        guests: "sometimes",
                        budget_min: undefined,
                        budget_max: undefined,
                        interests: [],
                      });
                    }}
                    className="px-3 py-1.5 rounded-lg text-sm font-medium text-white transition-all shadow-sm hover:shadow-md"
                    style={{ backgroundColor: '#B22222' }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#991919'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#B22222'}
                  >
                    Use Form Instead
                  </button>
                )}
              </div>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium mb-1.5 text-gray-700">Name</label>
                  <input
                    type="text"
                    placeholder="Your name"
                    value={profile.name}
                    onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                    className="border border-gray-300 p-3 rounded-lg w-full focus:outline-none focus:ring-2 focus:border-transparent transition-all text-gray-900"
                    style={{ '--tw-ring-color': '#B22222' } as React.CSSProperties}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5 text-gray-700">Major</label>
                  <input
                    type="text"
                    placeholder="Your major/field of study"
                    value={profile.major}
                    onChange={(e) => setProfile({ ...profile, major: e.target.value })}
                    className="border border-gray-300 p-3 rounded-lg w-full focus:outline-none focus:ring-2 focus:border-transparent transition-all text-gray-900"
                    style={{ '--tw-ring-color': '#B22222' } as React.CSSProperties}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5 text-gray-700">Bio</label>
                  <textarea
                    placeholder="Tell us about yourself..."
                    value={profile.bio}
                    onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                    className="border border-gray-300 p-3 rounded-lg w-full focus:outline-none focus:ring-2 focus:border-transparent transition-all text-gray-900"
                    style={{ '--tw-ring-color': '#B22222' } as React.CSSProperties}
                    rows={3}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5 text-gray-700">Sleep Schedule</label>
                  <select
                    value={profile.sleep_sched}
                    onChange={(e) => setProfile({ ...profile, sleep_sched: e.target.value as any })}
                    className="border border-gray-300 p-3 rounded-lg w-full focus:outline-none focus:ring-2 focus:border-transparent transition-all text-gray-900"
                    style={{ '--tw-ring-color': '#B22222' } as React.CSSProperties}
                  >
                    <option value="early">Early Bird</option>
                    <option value="normal">Normal</option>
                    <option value="late">Night Owl</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5 text-gray-700">Cleanliness Preference</label>
                  <select
                    value={profile.cleanliness}
                    onChange={(e) => setProfile({ ...profile, cleanliness: e.target.value as any })}
                    className="border border-gray-300 p-3 rounded-lg w-full focus:outline-none focus:ring-2 focus:border-transparent transition-all text-gray-900"
                    style={{ '--tw-ring-color': '#B22222' } as React.CSSProperties}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5 text-gray-700">Noise Level Preference</label>
                  <select
                    value={profile.noise}
                    onChange={(e) => setProfile({ ...profile, noise: e.target.value as any })}
                    className="border border-gray-300 p-3 rounded-lg w-full focus:outline-none focus:ring-2 focus:border-transparent transition-all text-gray-900"
                    style={{ '--tw-ring-color': '#B22222' } as React.CSSProperties}
                  >
                    <option value="quiet">Quiet</option>
                    <option value="moderate">Moderate</option>
                    <option value="loud">Loud</option>
                  </select>
                </div>
                <button
                  onClick={handleMatch}
                  disabled={loading || !profile.name?.trim()}
                  className="w-full px-6 py-3 rounded-lg text-white font-medium transition-all shadow-md hover:shadow-lg disabled:opacity-50"
                  style={{ backgroundColor: '#B22222' }}
                  onMouseEnter={(e) => !e.currentTarget.disabled && (e.currentTarget.style.backgroundColor = '#991919')}
                  onMouseLeave={(e) => !e.currentTarget.disabled && (e.currentTarget.style.backgroundColor = '#B22222')}
                >
                  {loading ? "Finding matches..." : "Find Matches"}
                </button>
                {useSavedProfile && (
                  <p className="text-xs text-gray-500 text-center mt-2">
                    Using your saved profile preferences to find the best matches
                  </p>
                )}
              </div>
            </section>

            {/* Match Results */}
            <section className="bg-white rounded-2xl shadow-sm p-6 border border-gray-200 space-y-4">
              <h2 className="text-xl font-semibold" style={{ color: '#B22222' }}>Match Results</h2>
              {results.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  Fill out your profile and click "Find Matches" We will find the best matches for you!
                </div>
              ) : (
                <div className="space-y-3">
                  {results.map((r, i) => (
                    <div 
                      key={i} 
                      onClick={() => setSelectedMatch(r)}
                      className="border border-gray-200 rounded-lg p-4 cursor-pointer hover:shadow-md hover:border-gray-300 transition-all" 
                      style={{ backgroundColor: '#FCFBF4' }}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <div className="font-semibold text-gray-900">{r.profile.name}</div>
                          <div className="text-sm text-gray-600">{r.profile.major}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold" style={{ color: '#B22222' }}>{r.score}%</div>
                          <div className="text-xs text-gray-500">Match</div>
                        </div>
                      </div>
                      <p className="text-sm text-gray-700 mb-2">{r.summary}</p>
                      {r.friction?.length > 0 && (
                        <div className="text-xs text-orange-600 mb-1">
                          ⚠️ Friction: {r.friction.join(", ")}
                        </div>
                      )}
                      {r.tips?.length > 0 && (
                        <div className="text-xs" style={{ color: '#B22222' }}>
                          💡 Tips: {r.tips.join(", ")}
                        </div>
                      )}
                      <div className="mt-2 text-xs text-gray-500">
                        Click to view detailed profile →
                      </div>
                      {groups.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setInviteModalOpen(r.profile.name);
                            }}
                            disabled={invitingToGroup !== null}
                            className="w-full px-4 py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-50"
                            style={{ backgroundColor: '#B22222', color: 'white' }}
                            onMouseEnter={(e) => !e.currentTarget.disabled && (e.currentTarget.style.backgroundColor = '#991919')}
                            onMouseLeave={(e) => !e.currentTarget.disabled && (e.currentTarget.style.backgroundColor = '#B22222')}
                          >
                            Invite to Roommate Group
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>

          {/* Match Details Modal */}
          {selectedMatch && (
            <div 
              className="fixed inset-0 bg-gray-900 bg-opacity-30 backdrop-blur-md flex items-center justify-center z-50 p-4" 
              onClick={() => setSelectedMatch(null)}
            >
              <div 
                className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-6 border-2 border-gray-200" 
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-gray-900 mb-1">{selectedMatch.profile.name}</h3>
                    {selectedMatch.profile.major && (
                      <div className="text-sm text-gray-600">{selectedMatch.profile.major}</div>
                    )}
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-3xl font-bold" style={{ color: '#B22222' }}>{selectedMatch.score}%</div>
                      <div className="text-xs text-gray-500">Match Score</div>
                    </div>
                    <button
                      onClick={() => setSelectedMatch(null)}
                      className="text-gray-400 hover:text-gray-600 text-3xl leading-none"
                    >
                      ×
                    </button>
                  </div>
                </div>

                {/* Bio Section */}
                {selectedMatch.profile.bio && (
                  <div>
                    <div className="text-sm font-semibold text-gray-900 mb-2">About</div>
                    <p className="text-sm text-gray-700">{selectedMatch.profile.bio}</p>
                  </div>
                )}

                {/* AI Summary */}
                {selectedMatch.summary && (
                  <div>
                    <div className="text-sm font-semibold text-gray-900 mb-2">Match Summary</div>
                    <p className="text-sm text-gray-700 bg-blue-50 p-3 rounded-lg">{selectedMatch.summary}</p>
                  </div>
                )}

                {/* Preferences Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs font-medium text-gray-500 mb-1">Sleep Schedule</div>
                    <div className="text-sm text-gray-900 capitalize">
                      {selectedMatch.profile.sleep_sched === "early" ? "Early Bird" : 
                       selectedMatch.profile.sleep_sched === "late" ? "Night Owl" : 
                       "Normal"}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs font-medium text-gray-500 mb-1">Cleanliness</div>
                    <div className="text-sm text-gray-900 capitalize">{selectedMatch.profile.cleanliness || "Not specified"}</div>
                  </div>
                  <div>
                    <div className="text-xs font-medium text-gray-500 mb-1">Noise Level</div>
                    <div className="text-sm text-gray-900 capitalize">{selectedMatch.profile.noise || "Not specified"}</div>
                  </div>
                  <div>
                    <div className="text-xs font-medium text-gray-500 mb-1">Guests</div>
                    <div className="text-sm text-gray-900 capitalize">{selectedMatch.profile.guests || "Not specified"}</div>
                  </div>
                </div>

                {/* Budget */}
                {(selectedMatch.profile.budget_min || selectedMatch.profile.budget_max) && (
                  <div>
                    <div className="text-xs font-medium text-gray-500 mb-1">Budget Range</div>
                    <div className="text-sm text-gray-900">
                      ${selectedMatch.profile.budget_min || 0} - ${selectedMatch.profile.budget_max || "∞"} per month
                    </div>
                  </div>
                )}

                {/* Interests */}
                {selectedMatch.profile.interests && selectedMatch.profile.interests.length > 0 && (
                  <div>
                    <div className="text-xs font-medium text-gray-500 mb-2">Interests</div>
                    <div className="flex flex-wrap gap-2">
                      {selectedMatch.profile.interests.map((interest: string, idx: number) => (
                        <span 
                          key={idx}
                          className="px-3 py-1 rounded-full text-xs font-medium"
                          style={{ backgroundColor: '#FCFBF4', color: '#B22222', border: '1px solid #B22222' }}
                        >
                          {interest}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Friction Points */}
                {selectedMatch.friction && selectedMatch.friction.length > 0 && (
                  <div>
                    <div className="text-xs font-semibold text-orange-600 mb-2">⚠️ Potential Friction Points</div>
                    <ul className="list-disc list-inside space-y-1">
                      {selectedMatch.friction.map((f: string, idx: number) => (
                        <li key={idx} className="text-sm text-gray-700">{f}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Tips */}
                {selectedMatch.tips && selectedMatch.tips.length > 0 && (
                  <div>
                    <div className="text-xs font-semibold mb-2" style={{ color: '#B22222' }}>💡 Tips for Living Together</div>
                    <ul className="list-disc list-inside space-y-1">
                      {selectedMatch.tips.map((tip: string, idx: number) => (
                        <li key={idx} className="text-sm text-gray-700">{tip}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Invite Button */}
                {groups.length > 0 && (
                  <div className="pt-4 border-t border-gray-200">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedMatch(null);
                        setInviteModalOpen(selectedMatch.profile.name);
                      }}
                      disabled={invitingToGroup !== null}
                      className="w-full px-4 py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-50"
                      style={{ backgroundColor: '#B22222', color: 'white' }}
                      onMouseEnter={(e) => !e.currentTarget.disabled && (e.currentTarget.style.backgroundColor = '#991919')}
                      onMouseLeave={(e) => !e.currentTarget.disabled && (e.currentTarget.style.backgroundColor = '#B22222')}
                    >
                      Invite to Roommate Group
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Invite Modal */}
          {inviteModalOpen && (
            <div 
              className="fixed inset-0 bg-opacity-75 backdrop-blur-sm flex items-center justify-center z-50 p-4" 
              onClick={() => setInviteModalOpen(null)}
            >
              <div 
                className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4 border-2 border-gray-200" 
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex justify-between items-start">
                  <h3 className="text-xl font-semibold text-gray-900">
                    Invite {inviteModalOpen} to Group
                  </h3>
                  <button
                    onClick={() => setInviteModalOpen(null)}
                    className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
                  >
                    ×
                  </button>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  Select a group to invite {inviteModalOpen} to:
                </p>
                {groups.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <p className="mb-3">You don't have any groups yet.</p>
                    <Link
                      href="/groups"
                      className="text-sm font-medium"
                      style={{ color: '#B22222' }}
                    >
                      Create a group →
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {groups.map((group) => (
                      <button
                        key={group.id}
                        onClick={() => {
                          inviteToGroup(inviteModalOpen, group.id);
                          setInviteModalOpen(null);
                        }}
                        disabled={invitingToGroup === group.id}
                        className="w-full px-4 py-3 rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all text-left disabled:opacity-50"
                        style={{ backgroundColor: invitingToGroup === group.id ? '#FCFBF4' : 'white' }}
                      >
                        <div className="font-medium text-gray-900">{group.name}</div>
                        {invitingToGroup === group.id && (
                          <div className="text-xs text-gray-500 mt-1">Inviting...</div>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}

