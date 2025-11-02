"use client";
import { useEffect, useState } from "react";
import { useAuth } from "../auth/context";
import { ProtectedRoute } from "../ProtectedRoute";
import Link from "next/link";
import type { Profile } from "@/lib/types";

type UserProfile = Profile & {
  notifications_enabled?: boolean;
  email_notifications?: boolean;
};

export default function ProfilePage() {
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState<UserProfile>({
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
    notifications_enabled: true,
    email_notifications: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [newInterest, setNewInterest] = useState("");

  useEffect(() => {
    if (user) {
      loadProfile();
    }
  }, [user]);

  async function loadProfile() {
    if (!user?.id) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/profile?user_id=${user.id}`);
      if (res.ok) {
        const data = await res.json();
        if (data.profile) {
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
            notifications_enabled: data.profile.notifications_enabled !== undefined ? data.profile.notifications_enabled : true,
            email_notifications: data.profile.email_notifications !== undefined ? data.profile.email_notifications : true,
          });
        }
      }
    } catch (err) {
      console.error("Failed to load profile:", err);
    } finally {
      setLoading(false);
    }
  }

  async function saveProfile() {
    if (!user?.id) return;
    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user.id,
          ...profile,
        }),
      });

      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      } else {
        const data = await res.json();
        alert(`Failed to save profile: ${data.error || "Unknown error"}`);
      }
    } catch (err) {
      console.error("Failed to save profile:", err);
      alert("Failed to save profile");
    } finally {
      setSaving(false);
    }
  }

  function addInterest() {
    if (newInterest.trim() && !profile.interests?.includes(newInterest.trim())) {
      setProfile({
        ...profile,
        interests: [...(profile.interests || []), newInterest.trim()],
      });
      setNewInterest("");
    }
  }

  function removeInterest(interest: string) {
    setProfile({
      ...profile,
      interests: profile.interests?.filter((i) => i !== interest) || [],
    });
  }

  if (loading) {
    return (
      <ProtectedRoute>
        <main className="min-h-screen p-6" style={{ backgroundColor: '#FCFBF4' }}>
          <div className="max-w-4xl mx-auto">
            <div className="text-center py-12">
              <div className="text-gray-500">Loading profile...</div>
            </div>
          </div>
        </main>
      </ProtectedRoute>
    );
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
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-200">
              <h1 className="text-3xl font-bold" style={{ color: '#B22222' }}>Profile & Settings</h1>
              <p className="text-sm text-gray-700 mt-1">Manage your profile and preferences</p>
            </div>

          {/* Basic Information */}
          <section className="bg-white rounded-2xl shadow-sm p-6 border border-gray-200 space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-1 h-6 rounded-full" style={{ backgroundColor: '#B22222' }}></div>
              <h2 className="text-xl font-semibold text-gray-900">Basic Information</h2>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
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
                <label className="block text-sm font-medium mb-1.5 text-gray-700">Major/Field</label>
                <input
                  type="text"
                  placeholder="Your major or field of study"
                  value={profile.major}
                  onChange={(e) => setProfile({ ...profile, major: e.target.value })}
                  className="border border-gray-300 p-3 rounded-lg w-full focus:outline-none focus:ring-2 focus:border-transparent transition-all text-gray-900"
                  style={{ '--tw-ring-color': '#B22222' } as React.CSSProperties}
                />
              </div>
              <div className="md:col-span-2">
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
            </div>
          </section>

          {/* Roommate Preferences */}
          <section className="bg-white rounded-2xl shadow-sm p-6 border border-gray-200 space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-1 h-6 rounded-full" style={{ backgroundColor: '#B22222' }}></div>
              <h2 className="text-xl font-semibold text-gray-900">Roommate Preferences</h2>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
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
              <div>
                <label className="block text-sm font-medium mb-1.5 text-gray-700">Guest Frequency</label>
                <select
                  value={profile.guests}
                  onChange={(e) => setProfile({ ...profile, guests: e.target.value as any })}
                  className="border border-gray-300 p-3 rounded-lg w-full focus:outline-none focus:ring-2 focus:border-transparent transition-all text-gray-900"
                  style={{ '--tw-ring-color': '#B22222' } as React.CSSProperties}
                >
                  <option value="rare">Rare</option>
                  <option value="sometimes">Sometimes</option>
                  <option value="often">Often</option>
                </select>
              </div>
            </div>
          </section>

          {/* Budget Preferences */}
          <section className="bg-white rounded-2xl shadow-sm p-6 border border-gray-200 space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-1 h-6 rounded-full" style={{ backgroundColor: '#B22222' }}></div>
              <h2 className="text-xl font-semibold text-gray-900">Budget Preferences</h2>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1.5 text-gray-700">Minimum Budget ($)</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={profile.budget_min || ""}
                  onChange={(e) => setProfile({ ...profile, budget_min: e.target.value ? parseFloat(e.target.value) : undefined })}
                  className="border border-gray-300 p-3 rounded-lg w-full focus:outline-none focus:ring-2 focus:border-transparent transition-all text-gray-900"
                  style={{ '--tw-ring-color': '#B22222' } as React.CSSProperties}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5 text-gray-700">Maximum Budget ($)</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={profile.budget_max || ""}
                  onChange={(e) => setProfile({ ...profile, budget_max: e.target.value ? parseFloat(e.target.value) : undefined })}
                  className="border border-gray-300 p-3 rounded-lg w-full focus:outline-none focus:ring-2 focus:border-transparent transition-all text-gray-900"
                  style={{ '--tw-ring-color': '#B22222' } as React.CSSProperties}
                />
              </div>
            </div>
          </section>

          {/* Interests */}
          <section className="bg-white rounded-2xl shadow-sm p-6 border border-gray-200 space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-1 h-6 rounded-full" style={{ backgroundColor: '#B22222' }}></div>
              <h2 className="text-xl font-semibold text-gray-900">Interests</h2>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Add an interest..."
                value={newInterest}
                onChange={(e) => setNewInterest(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addInterest()}
                className="border border-gray-300 p-3 rounded-lg flex-1 focus:outline-none focus:ring-2 focus:border-transparent transition-all text-gray-900"
                style={{ '--tw-ring-color': '#B22222' } as React.CSSProperties}
              />
              <button
                onClick={addInterest}
                className="px-4 py-2 rounded-lg text-white text-sm font-medium transition-all"
                style={{ backgroundColor: '#B22222' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#991919'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#B22222'}
              >
                Add
              </button>
            </div>
            {profile.interests && profile.interests.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {profile.interests.map((interest, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 px-3 py-1 rounded-lg border border-gray-300"
                    style={{ backgroundColor: '#FCFBF4' }}
                  >
                    <span className="text-sm text-gray-700">{interest}</span>
                    <button
                      onClick={() => removeInterest(interest)}
                      className="text-gray-400 hover:text-gray-600 text-lg leading-none"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Notification Settings */}
          <section className="bg-white rounded-2xl shadow-sm p-6 border border-gray-200 space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-1 h-6 rounded-full" style={{ backgroundColor: '#B22222' }}></div>
              <h2 className="text-xl font-semibold text-gray-900">Notification Settings</h2>
            </div>
            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={profile.notifications_enabled || false}
                  onChange={(e) => setProfile({ ...profile, notifications_enabled: e.target.checked })}
                  className="w-5 h-5 rounded border-gray-300 text-red-600 focus:ring-2 focus:ring-red-500"
                  style={{ accentColor: '#B22222' }}
                />
                <span className="text-sm text-gray-700">Enable notifications</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={profile.email_notifications || false}
                  onChange={(e) => setProfile({ ...profile, email_notifications: e.target.checked })}
                  className="w-5 h-5 rounded border-gray-300 text-red-600 focus:ring-2 focus:ring-red-500"
                  style={{ accentColor: '#B22222' }}
                  disabled={!profile.notifications_enabled}
                />
                <span className="text-sm text-gray-700">Email notifications</span>
              </label>
            </div>
          </section>

          {/* Save Button */}
          <div className="flex justify-end gap-3">
            {saved && (
              <div className="flex items-center gap-2 text-green-600 text-sm">
                <span>✓</span>
                <span>Profile saved!</span>
              </div>
            )}
            <button
              onClick={saveProfile}
              disabled={saving}
              className="px-6 py-3 rounded-lg text-white font-medium transition-all shadow-md hover:shadow-lg disabled:opacity-50"
              style={{ backgroundColor: '#B22222' }}
              onMouseEnter={(e) => !e.currentTarget.disabled && (e.currentTarget.style.backgroundColor = '#991919')}
              onMouseLeave={(e) => !e.currentTarget.disabled && (e.currentTarget.style.backgroundColor = '#B22222')}
            >
              {saving ? "Saving..." : "Save Profile"}
            </button>
          </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}

