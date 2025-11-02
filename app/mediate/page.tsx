"use client";
import { useState, useEffect } from "react";
import { useAuth } from "../auth/context";
import { ProtectedRoute } from "../ProtectedRoute";
import Link from "next/link";

type ConflictType = "general" | "chores" | "noise" | "guests" | "bills" | "schedule" | "personal_space" | "cleanliness";
type EscalationLevel = "low" | "medium" | "high";

export default function MediatePage() {
  const { user, signOut } = useAuth();
  const [issue, setIssue] = useState("");
  const [tone, setTone] = useState<"empathetic" | "direct" | "polite-but-firm" | "humorous" | "solution-focused">("empathetic");
  const [conflictType, setConflictType] = useState<ConflictType>("general");
  const [escalationLevel, setEscalationLevel] = useState<EscalationLevel>("medium");
  const [mediation, setMediation] = useState<any>(null);
  const [mediating, setMediating] = useState(false);
  const [editedMessage, setEditedMessage] = useState("");
  const [copySuccess, setCopySuccess] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showTips, setShowTips] = useState(false);

  useEffect(() => {
    // Load history from localStorage
    const savedHistory = localStorage.getItem("mediationHistory");
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error("Failed to load history:", e);
      }
    }
  }, []);

  const conflictTemplates = {
    chores: "My roommate hasn't been doing their share of household chores. I've been cleaning up after them and it's getting frustrating.",
    noise: "My roommate plays loud music/entertains guests late at night, which disturbs my sleep and study time.",
    guests: "My roommate frequently has guests over without giving me notice, which makes me feel uncomfortable in my own space.",
    bills: "My roommate hasn't been paying their share of utilities/bills on time, and it's causing financial stress.",
    schedule: "My roommate and I have conflicting schedules that are causing tension about quiet hours and shared space usage.",
    personal_space: "My roommate uses my belongings without asking, and it feels like my personal space and privacy aren't being respected.",
    cleanliness: "My roommate leaves a mess in common areas, and I feel like I'm constantly cleaning up after them.",
    general: ""
  };

  function applyTemplate(type: ConflictType) {
    setIssue(conflictTemplates[type]);
    setConflictType(type);
    setShowTemplates(false);
  }

  async function handleMediate() {
    if (!issue.trim()) return;
    setMediating(true);
    try {
      const res = await fetch("/api/mediate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ issue, tone, conflictType, escalationLevel }),
      });
      const data = await res.json();
      if (data.error) {
        alert(data.error);
        return;
      }
      const mediationData = {
        ...data,
        issue,
        tone,
        conflictType,
        escalationLevel,
        timestamp: new Date().toISOString(),
        id: Date.now().toString()
      };
      setMediation(mediationData);
      setEditedMessage(data.message || "");
      
      // Save to history
      const newHistory = [mediationData, ...history.slice(0, 9)]; // Keep last 10
      setHistory(newHistory);
      localStorage.setItem("mediationHistory", JSON.stringify(newHistory));
    } catch (err) {
      console.error("Mediate error:", err);
      alert("Failed to mediate. Please try again.");
    } finally {
      setMediating(false);
    }
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text).then(() => {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    });
  }

  function loadFromHistory(item: any) {
    setIssue(item.issue);
    setTone(item.tone);
    setConflictType(item.conflictType || "general");
    setEscalationLevel(item.escalationLevel || "medium");
    setMediation(item);
    setEditedMessage(item.message || "");
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
              <h1 className="text-3xl font-bold" style={{ color: '#B22222' }}>Conflict Mediator</h1>
              <p className="text-sm text-gray-700 mt-1">Get help resolving roommate conflicts with AI</p>
            </div>

          {/* Conflict Mediator Form */}
          <section className="bg-white rounded-2xl shadow-sm p-6 border border-gray-200 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-1 h-6 rounded-full" style={{ backgroundColor: '#B22222' }}></div>
                <h2 className="text-xl font-semibold text-gray-900">Describe the Issue</h2>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowTemplates(!showTemplates)}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
                >
                  {showTemplates ? "Hide" : "Show"} Templates
                </button>
                <button
                  onClick={() => setShowTips(!showTips)}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
                >
                  {showTips ? "Hide" : "Show"} Tips
                </button>
              </div>
            </div>

            {/* Conflict Templates */}
            {showTemplates && (
              <div className="border border-gray-200 rounded-lg p-4" style={{ backgroundColor: '#FCFBF4' }}>
                <div className="text-xs font-medium text-gray-700 mb-3">Quick Start Templates:</div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {(["chores", "noise", "guests", "bills", "schedule", "personal_space", "cleanliness"] as ConflictType[]).map((type) => (
                    <button
                      key={type}
                      onClick={() => applyTemplate(type)}
                      className="px-3 py-2 text-xs font-medium rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all text-left capitalize"
                      style={{ backgroundColor: 'white' }}
                    >
                      {type.replace("_", " ")}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Conflict Resolution Tips */}
            {showTips && (
              <div className="border border-gray-200 rounded-lg p-4" style={{ backgroundColor: '#FCFBF4' }}>
                <div className="text-xs font-semibold text-gray-900 mb-3">💡 Conflict Resolution Tips:</div>
                <ul className="text-xs text-gray-700 space-y-1.5 list-disc list-inside">
                  <li>Use "I" statements instead of "You" statements to express your feelings</li>
                  <li>Focus on specific behaviors, not personality traits</li>
                  <li>Propose concrete solutions and be open to compromise</li>
                  <li>Choose the right time - approach when both parties are calm</li>
                  <li>Listen actively and acknowledge the other person's perspective</li>
                  <li>Document agreements in writing if needed</li>
                </ul>
              </div>
            )}

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5 text-gray-700">Conflict Type</label>
                  <select
                    value={conflictType}
                    onChange={(e) => setConflictType(e.target.value as ConflictType)}
                    className="border border-gray-300 p-3 rounded-lg w-full focus:outline-none focus:ring-2 focus:border-transparent transition-all text-gray-900"
                    style={{ '--tw-ring-color': '#B22222' } as React.CSSProperties}
                  >
                    <option value="general">General</option>
                    <option value="chores">Chores</option>
                    <option value="noise">Noise</option>
                    <option value="guests">Guests</option>
                    <option value="bills">Bills</option>
                    <option value="schedule">Schedule</option>
                    <option value="personal_space">Personal Space</option>
                    <option value="cleanliness">Cleanliness</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5 text-gray-700">Escalation Level</label>
                  <select
                    value={escalationLevel}
                    onChange={(e) => setEscalationLevel(e.target.value as EscalationLevel)}
                    className="border border-gray-300 p-3 rounded-lg w-full focus:outline-none focus:ring-2 focus:border-transparent transition-all text-gray-900"
                    style={{ '--tw-ring-color': '#B22222' } as React.CSSProperties}
                  >
                    <option value="low">Low - Minor Issue</option>
                    <option value="medium">Medium - Needs Discussion</option>
                    <option value="high">High - Urgent/Serious</option>
                  </select>
                </div>
              </div>

              <textarea
                placeholder="Describe the conflict or issue you're having with your roommate..."
                value={issue}
                onChange={(e) => setIssue(e.target.value)}
                className="border border-gray-300 p-3 rounded-lg w-full focus:outline-none focus:ring-2 focus:border-transparent transition-all text-gray-900"
                style={{ '--tw-ring-color': '#B22222' } as React.CSSProperties}
                rows={5}
              />
              <div>
                <label className="block text-sm font-medium mb-1.5 text-gray-700">Tone</label>
                <select
                  value={tone}
                  onChange={(e) => setTone(e.target.value as any)}
                  className="border border-gray-300 p-3 rounded-lg w-full focus:outline-none focus:ring-2 focus:border-transparent transition-all text-gray-900"
                  style={{ '--tw-ring-color': '#B22222' } as React.CSSProperties}
                >
                  <option value="empathetic">Empathetic</option>
                  <option value="direct">Direct</option>
                  <option value="polite-but-firm">Polite but Firm</option>
                  <option value="humorous">Humorous/Light</option>
                  <option value="solution-focused">Solution-Focused</option>
                </select>
              </div>
              <button
                onClick={handleMediate}
                disabled={mediating || !issue.trim()}
                className="w-full px-6 py-3 rounded-lg text-white font-medium transition-all shadow-md hover:shadow-lg disabled:opacity-50"
                style={{ backgroundColor: '#B22222' }}
                onMouseEnter={(e) => !e.currentTarget.disabled && (e.currentTarget.style.backgroundColor = '#991919')}
                onMouseLeave={(e) => !e.currentTarget.disabled && (e.currentTarget.style.backgroundColor = '#B22222')}
              >
                {mediating ? "Processing..." : "Let's Find a Solution!"}
              </button>
            </div>
          </section>

          {/* Mediation Result */}
          {mediation && (
            <section className="bg-white rounded-2xl shadow-sm p-6 border border-gray-200 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-1 h-6 rounded-full" style={{ backgroundColor: '#B22222' }}></div>
                  <h2 className="text-xl font-semibold text-gray-900">Suggested Message</h2>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 text-xs font-medium rounded ${
                    escalationLevel === "low" ? "bg-green-100 text-green-700" :
                    escalationLevel === "medium" ? "bg-yellow-100 text-yellow-700" :
                    "bg-red-100 text-red-700"
                  }`}>
                    {escalationLevel.toUpperCase()}
                  </span>
                  <span className="px-2 py-1 text-xs font-medium rounded bg-gray-100 text-gray-700 capitalize">
                    {conflictType.replace("_", " ")}
                  </span>
                </div>
              </div>
              
              <div className="border border-gray-200 rounded-lg p-4" style={{ backgroundColor: '#FCFBF4' }}>
                <div className="flex items-center justify-between mb-3">
                  <div className="text-xs font-medium text-gray-600">Edit Message (optional):</div>
                  <button
                    onClick={() => copyToClipboard(editedMessage || mediation.message)}
                    className="px-3 py-1 text-xs font-medium rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
                  >
                    {copySuccess ? "✓ Copied!" : "Copy"}
                  </button>
                </div>
                <textarea
                  value={editedMessage || mediation.message}
                  onChange={(e) => setEditedMessage(e.target.value)}
                  className="w-full p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:border-transparent text-sm text-gray-900 resize-none"
                  style={{ '--tw-ring-color': '#B22222' } as React.CSSProperties}
                  rows={6}
                />
              </div>

              {mediation.alt_openers && mediation.alt_openers.length > 0 && (
                <div>
                  <div className="text-xs font-medium text-gray-700 mb-2">Alternative Openers:</div>
                  <div className="space-y-2">
                    {mediation.alt_openers.map((opener: string, i: number) => (
                      <div 
                        key={i} 
                        className="flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:border-gray-300 transition-all"
                        style={{ backgroundColor: '#FCFBF4' }}
                      >
                        <span className="text-xs text-gray-700 flex-1">{opener}</span>
                        <button
                          onClick={() => copyToClipboard(opener)}
                          className="ml-2 px-2 py-1 text-xs font-medium rounded border border-gray-300 hover:bg-gray-50 transition-colors"
                        >
                          Copy
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Follow-up Suggestions */}
              <div>
                <div className="text-xs font-semibold text-gray-900 mb-2">📝 Next Steps:</div>
                <ul className="text-xs text-gray-700 space-y-1.5 list-disc list-inside ml-2">
                  <li>Choose a good time to have this conversation when you're both calm</li>
                  <li>Be prepared to listen to their perspective and find a compromise</li>
                  <li>Set clear expectations and boundaries together</li>
                  <li>Follow up in a few days to see if the situation has improved</li>
                </ul>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setMediation(null);
                    setIssue("");
                    setEditedMessage("");
                  }}
                  className="flex-1 px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium hover:bg-gray-50 transition-colors"
                >
                  Start New
                </button>
                <button
                  onClick={() => copyToClipboard(editedMessage || mediation.message)}
                  className="flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all"
                  style={{ backgroundColor: '#B22222', color: 'white' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#991919'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#B22222'}
                >
                  {copySuccess ? "✓ Copied!" : "Copy Message"}
                </button>
              </div>
            </section>
          )}

          {/* Mediation History */}
          {history.length > 0 && (
            <section className="bg-white rounded-2xl shadow-sm p-6 border border-gray-200 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-1 h-6 rounded-full" style={{ backgroundColor: '#B22222' }}></div>
                  <h2 className="text-xl font-semibold text-gray-900">Recent Mediations</h2>
                </div>
                <button
                  onClick={() => {
                    setHistory([]);
                    localStorage.removeItem("mediationHistory");
                  }}
                  className="text-xs text-gray-500 hover:text-gray-700"
                >
                  Clear
                </button>
              </div>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {history.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => loadFromHistory(item)}
                    className="p-3 rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all cursor-pointer"
                    style={{ backgroundColor: '#FCFBF4' }}
                  >
                    <div className="flex items-start justify-between mb-1">
                      <div className="text-sm font-medium text-gray-900 line-clamp-1">
                        {item.issue.substring(0, 60)}{item.issue.length > 60 ? "..." : ""}
                      </div>
                      <span className="text-xs text-gray-500 ml-2">
                        {new Date(item.timestamp).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="text-xs text-gray-600 line-clamp-1 mt-1">
                      {item.message?.substring(0, 80)}{item.message?.length > 80 ? "..." : ""}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}

