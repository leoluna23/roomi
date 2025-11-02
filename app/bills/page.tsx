"use client";
import { useEffect, useState } from "react";
import { useAuth } from "../auth/context";
import { ProtectedRoute } from "../ProtectedRoute";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";

type Group = { id: string; name: string; join_token: string };
type Member = { id: string; user_name: string };
type Bill = {
  id: string;
  title: string;
  amount: number;
  category: "groceries" | "utilities" | "rent" | "other";
  paid_by: string;
  paid_by_member?: Member;
  bill_date: string;
  notes?: string | null;
  splits?: BillSplit[];
};
type BillSplit = {
  id: string;
  amount: number;
  paid_at?: string | null;
  member?: Member;
};

export default function BillsPage() {
  const { user, signOut } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(searchParams.get("group") || null);
  const [members, setMembers] = useState<Member[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(false);
  const [addingBill, setAddingBill] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState<string>(
    new Date().toISOString().slice(0, 7) // YYYY-MM
  );

  const [newBill, setNewBill] = useState({
    title: "",
    amount: "",
    category: "groceries" as Bill["category"],
    paid_by: "",
    bill_date: new Date().toISOString().split("T")[0],
    notes: "",
    split_type: "equal" as "equal" | "custom",
    custom_splits: [] as { member_id: string; amount: string }[],
  });

  useEffect(() => {
    loadGroups();
  }, []);

  useEffect(() => {
    if (selectedGroupId) {
      loadMembers();
      loadBills();
    }
  }, [selectedGroupId, selectedMonth]);

  // Also reload bills when bills are updated (e.g., after creation)
  useEffect(() => {
    const handleStorageChange = () => {
      const billUpdated = localStorage.getItem("billUpdated");
      if (billUpdated && selectedGroupId) {
        loadBills();
        localStorage.removeItem("billUpdated");
      }
    };
    
    // Check on mount and listen for storage events
    handleStorageChange();
    window.addEventListener("storage", handleStorageChange);
    
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [selectedGroupId]);

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

  async function loadMembers() {
    if (!selectedGroupId) return;
    try {
      const res = await fetch(`/api/groups/${selectedGroupId}/members`);
      if (!res.ok) return;
      const data = await res.json();
      setMembers(data.members || []);
      // Set default paid_by if empty
      if (!newBill.paid_by && data.members?.length > 0) {
        setNewBill((prev) => ({ ...prev, paid_by: data.members[0].id }));
      }
    } catch (err) {
      console.error("Failed to load members:", err);
    }
  }

  async function loadBills() {
    if (!selectedGroupId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/groups/${selectedGroupId}/bills?month=${selectedMonth}`);
      if (!res.ok) {
        console.error("Failed to load bills:", res.status, res.statusText);
        const errorText = await res.text();
        console.error("Error response:", errorText);
        return;
      }
      const text = await res.text();
      let data;
      try {
        data = text ? JSON.parse(text) : { bills: [] };
      } catch (parseError) {
        console.error("Failed to parse response:", text);
        throw new Error("Invalid JSON response from server");
      }
      
      // Ensure bills array and that splits are properly loaded
      const billsData = data.bills || [];
      console.log("Loaded bills:", billsData.length, "bills for month", selectedMonth);
      console.log("Bills data:", billsData);
      
      // Verify each bill has splits loaded
      billsData.forEach((bill: any, index: number) => {
        if (!bill.splits || bill.splits.length === 0) {
          console.warn(`Bill ${index} (${bill.title}) has no splits`);
        }
      });
      
      setBills(billsData);
    } catch (err) {
      console.error("Failed to load bills:", err);
    } finally {
      setLoading(false);
    }
  }

  async function createBill() {
    if (!selectedGroupId || !newBill.title.trim() || !newBill.amount || !newBill.paid_by || !newBill.bill_date) {
      alert("Please fill in all required fields");
      return;
    }

    setAddingBill(true);
    try {
      const res = await fetch(`/api/groups/${selectedGroupId}/bills`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newBill.title,
          amount: parseFloat(newBill.amount),
          category: newBill.category,
          paid_by: newBill.paid_by,
          bill_date: newBill.bill_date,
          notes: newBill.notes || null,
          split_type: newBill.split_type,
          custom_splits: newBill.split_type === "custom" ? newBill.custom_splits : [],
        }),
      });

      const data = await res.json();
      if (res.ok && data.bill) {
        // Show success message
        alert(`Bill "${newBill.title}" added successfully!`);
        
        // Store a flag in localStorage to notify dashboard of bill update
        localStorage.setItem("billUpdated", Date.now().toString());
        
        // Also ensure the month filter matches the new bill's date
        const billMonth = newBill.bill_date.slice(0, 7); // YYYY-MM
        if (billMonth !== selectedMonth) {
          setSelectedMonth(billMonth);
          // Wait a moment for the month state to update, then reload
          setTimeout(() => {
            loadBills();
          }, 100);
        } else {
          // Reload bills immediately to show the new bill
          await loadBills();
        }
        
        setNewBill({
          title: "",
          amount: "",
          category: "groceries",
          paid_by: members[0]?.id || "",
          bill_date: new Date().toISOString().split("T")[0],
          notes: "",
          split_type: "equal",
          custom_splits: [],
        });
      } else {
        alert(`Failed to add bill: ${data.error || "Unknown error"}`);
      }
    } catch (err) {
      console.error("Failed to create bill:", err);
      alert("Failed to create bill");
    } finally {
      setAddingBill(false);
    }
  }

  async function deleteBill(billId: string) {
    if (!selectedGroupId) return;
    if (!confirm("Delete this bill?")) return;
    try {
      const res = await fetch(`/api/groups/${selectedGroupId}/bills?id=${billId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        loadBills();
      }
    } catch (err) {
      console.error("Failed to delete bill:", err);
    }
  }

  async function toggleSplitPaid(billId: string, splitId: string, currentlyPaid: boolean) {
    if (!selectedGroupId) return;
    try {
      const res = await fetch(`/api/groups/${selectedGroupId}/bills/${billId}/splits`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ split_id: splitId, paid: !currentlyPaid }),
      });
      if (res.ok) {
        loadBills();
      }
    } catch (err) {
      console.error("Failed to update split:", err);
    }
  }

  const totalBills = bills.reduce((sum, bill) => sum + bill.amount, 0);
  const totalPaid = bills.reduce((sum, bill) => {
    const paidSplits = (bill.splits || []).filter((s) => s.paid_at).reduce((s, split) => s + split.amount, 0);
    return sum + paidSplits;
  }, 0);

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
              <h1 className="text-3xl font-bold" style={{ color: '#B22222' }}>Split Bills</h1>
              <p className="text-sm text-gray-700 mt-1">Manage and split expenses with your roommates</p>
            </div>

          {/* Group Selector & Month Filter */}
          <div className="grid md:grid-cols-2 gap-4">
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

            <section className="bg-white rounded-2xl shadow-sm p-6 border border-gray-200">
              <label className="block text-sm font-medium mb-2 text-gray-700">Filter by Month</label>
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="border border-gray-300 p-3 rounded-lg w-full focus:outline-none focus:ring-2 focus:border-transparent transition-all text-gray-900"
                style={{ '--tw-ring-color': '#B22222' } as React.CSSProperties}
              />
            </section>
          </div>

          {selectedGroupId && (
            <>
              {/* Summary Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-200">
                  <div className="text-sm text-gray-600 mb-1">Total Bills</div>
                  <div className="text-2xl font-bold text-gray-900">${totalBills.toFixed(2)}</div>
                </div>
                <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-200">
                  <div className="text-sm text-gray-600 mb-1">Total Paid</div>
                  <div className="text-2xl font-bold text-green-600">${totalPaid.toFixed(2)}</div>
                </div>
                <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-200">
                  <div className="text-sm text-gray-600 mb-1">Outstanding</div>
                  <div className="text-2xl font-bold" style={{ color: '#B22222' }}>${(totalBills - totalPaid).toFixed(2)}</div>
                </div>
              </div>

              {/* Add Bill Form */}
              <section className="bg-white rounded-2xl shadow-sm p-6 border border-gray-200 space-y-4">
                <h2 className="text-xl font-semibold" style={{ color: '#B22222' }}>Add New Bill</h2>
                <div className="grid md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium mb-1.5 text-gray-700">Title</label>
                    <input
                      type="text"
                      placeholder="e.g., Groceries, Electric Bill"
                      value={newBill.title}
                      onChange={(e) => setNewBill({ ...newBill, title: e.target.value })}
                      className="border border-gray-300 p-3 rounded-lg w-full focus:outline-none focus:ring-2 focus:border-transparent transition-all text-gray-900"
                      style={{ '--tw-ring-color': '#B22222' } as React.CSSProperties}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5 text-gray-700">Amount ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={newBill.amount}
                      onChange={(e) => setNewBill({ ...newBill, amount: e.target.value })}
                      className="border border-gray-300 p-3 rounded-lg w-full focus:outline-none focus:ring-2 focus:border-transparent transition-all text-gray-900"
                      style={{ '--tw-ring-color': '#B22222' } as React.CSSProperties}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5 text-gray-700">Category</label>
                    <select
                      value={newBill.category}
                      onChange={(e) => setNewBill({ ...newBill, category: e.target.value as Bill["category"] })}
                      className="border border-gray-300 p-3 rounded-lg w-full focus:outline-none focus:ring-2 focus:border-transparent transition-all text-gray-900"
                      style={{ '--tw-ring-color': '#B22222' } as React.CSSProperties}
                    >
                      <option value="groceries">Groceries</option>
                      <option value="utilities">Utilities</option>
                      <option value="rent">Rent</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5 text-gray-700">Paid By</label>
                    <select
                      value={newBill.paid_by}
                      onChange={(e) => setNewBill({ ...newBill, paid_by: e.target.value })}
                      className="border border-gray-300 p-3 rounded-lg w-full focus:outline-none focus:ring-2 focus:border-transparent transition-all text-gray-900"
                      style={{ '--tw-ring-color': '#B22222' } as React.CSSProperties}
                    >
                      {members.map((member) => (
                        <option key={member.id} value={member.id}>
                          {member.user_name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5 text-gray-700">Date</label>
                    <input
                      type="date"
                      value={newBill.bill_date}
                      onChange={(e) => setNewBill({ ...newBill, bill_date: e.target.value })}
                      className="border border-gray-300 p-3 rounded-lg w-full focus:outline-none focus:ring-2 focus:border-transparent transition-all text-gray-900"
                      style={{ '--tw-ring-color': '#B22222' } as React.CSSProperties}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5 text-gray-700">Split Type</label>
                    <select
                      value={newBill.split_type}
                      onChange={(e) => setNewBill({ ...newBill, split_type: e.target.value as "equal" | "custom" })}
                      className="border border-gray-300 p-3 rounded-lg w-full focus:outline-none focus:ring-2 focus:border-transparent transition-all text-gray-900"
                      style={{ '--tw-ring-color': '#B22222' } as React.CSSProperties}
                    >
                      <option value="equal">Equal Split</option>
                      <option value="custom">Custom Split</option>
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-1.5 text-gray-700">Notes (optional)</label>
                    <textarea
                      placeholder="Any additional notes..."
                      value={newBill.notes}
                      onChange={(e) => setNewBill({ ...newBill, notes: e.target.value })}
                      className="border border-gray-300 p-3 rounded-lg w-full focus:outline-none focus:ring-2 focus:border-transparent transition-all text-gray-900"
                      style={{ '--tw-ring-color': '#B22222' } as React.CSSProperties}
                      rows={2}
                    />
                  </div>
                </div>

                {newBill.split_type === "custom" && (
                  <div className="border border-gray-200 rounded-lg p-4 space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Custom Split Amounts</label>
                    {members.map((member) => (
                      <div key={member.id} className="flex items-center gap-2">
                        <label className="text-sm text-gray-600 w-32">{member.user_name}:</label>
                        <input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          value={newBill.custom_splits.find((s) => s.member_id === member.id)?.amount || ""}
                          onChange={(e) => {
                            const value = e.target.value;
                            setNewBill({
                              ...newBill,
                              custom_splits: [
                                ...newBill.custom_splits.filter((s) => s.member_id !== member.id),
                                ...(value ? [{ member_id: member.id, amount: value }] : []),
                              ],
                            });
                          }}
                          className="border border-gray-300 px-3 py-2 rounded-lg flex-1 focus:outline-none focus:ring-2 focus:border-transparent transition-all text-gray-900"
                          style={{ '--tw-ring-color': '#B22222' } as React.CSSProperties}
                        />
                      </div>
                    ))}
                  </div>
                )}

                <button
                  onClick={createBill}
                  disabled={addingBill || !newBill.title.trim() || !newBill.amount || !newBill.paid_by}
                  className="w-full px-6 py-3 rounded-lg text-white font-medium transition-all shadow-md hover:shadow-lg disabled:opacity-50"
                  style={{ backgroundColor: '#B22222' }}
                  onMouseEnter={(e) => !e.currentTarget.disabled && (e.currentTarget.style.backgroundColor = '#991919')}
                  onMouseLeave={(e) => !e.currentTarget.disabled && (e.currentTarget.style.backgroundColor = '#B22222')}
                >
                  {addingBill ? "Adding..." : "Add Bill"}
                </button>
              </section>

              {/* Bills List */}
              <section className="bg-white rounded-2xl shadow-sm p-6 border border-gray-200 space-y-4">
                <h2 className="text-xl font-semibold" style={{ color: '#B22222' }}>Bills</h2>
                {loading ? (
                  <div className="text-center py-8 text-gray-500">Loading...</div>
                ) : bills.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">No bills yet. Add one above!</div>
                ) : (
                  <div className="space-y-4">
                    {bills.map((bill) => (
                      <div key={bill.id} className="border border-gray-200 rounded-lg p-4" style={{ backgroundColor: '#FCFBF4' }}>
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <div className="font-semibold text-gray-900">{bill.title}</div>
                            <div className="text-sm text-gray-600">
                              ${bill.amount.toFixed(2)} • {bill.category} • Paid by {bill.paid_by_member?.user_name || "Unknown"}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              {new Date(bill.bill_date).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
                            </div>
                            {bill.notes && <div className="text-xs text-gray-500 mt-1">{bill.notes}</div>}
                          </div>
                          <button
                            onClick={() => deleteBill(bill.id)}
                            className="px-3 py-1 rounded-lg bg-red-500 text-white text-sm hover:bg-red-600"
                          >
                            Delete
                          </button>
                        </div>

                        <div className="border-t border-gray-200 pt-3 mt-3 space-y-2">
                          <div className="text-xs font-medium text-gray-700 mb-2">Split Details:</div>
                          {bill.splits?.map((split) => (
                            <div key={split.id} className="flex items-center justify-between text-sm">
                              <span className="text-gray-700">
                                {split.member?.user_name || "Unknown"}: ${split.amount.toFixed(2)}
                              </span>
                              <button
                                onClick={() => toggleSplitPaid(bill.id, split.id, !!split.paid_at)}
                                className={`px-3 py-1 rounded text-xs font-medium ${
                                  split.paid_at
                                    ? "bg-green-500 text-white hover:bg-green-600"
                                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                                }`}
                              >
                                {split.paid_at ? "✓ Paid" : "Mark Paid"}
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
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

