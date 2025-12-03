"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type User = {
  id: string;
  email: string;
  name?: string;
  role: string;
  createdAt: string;
  points: number;
  bronzeBadges: number;
  silverBadges: number;
  goldBadges: number;
};

type CoachApplication = {
  id: string;
  email: string;
  name?: string;
  coachStatus: "PENDING" | "APPROVED" | "REJECTED";
  createdAt: string;
};

export default function AdminDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [applications, setApplications] = useState<CoachApplication[]>([]);
  const [toast, setToast] = useState<{ type: "info" | "error" | "success"; msg: string } | null>(null);

  function showToast(type: "info" | "error" | "success", msg: string) {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3000);
  }

  async function loadUsers() {
    try {
      const res = await fetch("/api/admin/users", { cache: "no-store" });
      if (res.status === 401) {
        router.push("/login");
        return;
      }
      if (!res.ok) {
        showToast("error", "Failed to load users");
        return;
      }
      const data = await res.json();
      setUsers(data.users || []);
    } catch (e) {
      showToast("error", "Failed to load users");
    }
  }

  async function loadApplications() {
    try {
      const res = await fetch("/api/admin/applications", { cache: "no-store" });
      if (res.status === 401) {
        router.push("/login");
        return;
      }
      if (!res.ok) {
        showToast("error", "Failed to load applications");
        return;
      }
      const data = await res.json();
      setApplications(data.applications || []);
    } catch (e) {
      showToast("error", "Failed to load applications");
    }
  }

  async function approveApplication(userId: string) {
    try {
      const res = await fetch("/api/admin/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId })
      });

      if (!res.ok) {
        showToast("error", "Failed to approve application");
        return;
      }

      showToast("success", "Application approved successfully");
      await loadApplications();
    } catch (e) {
      showToast("error", "Failed to approve application");
    }
  }

  async function rejectApplication(userId: string) {
    try {
      const res = await fetch("/api/admin/reject", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId })
      });

      if (!res.ok) {
        showToast("error", "Failed to reject application");
        return;
      }

      showToast("success", "Application rejected");
      await loadApplications();
    } catch (e) {
      showToast("error", "Failed to reject application");
    }
  }

  useEffect(() => {
    loadUsers();
    loadApplications();
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-pink-50">
        <div className="text-lg text-gray-500 animate-pulse">Loading admin dashboard...</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 pb-20">
      {/* Header */}
      <div className="max-w-7xl mx-auto px-5 md:px-8 pt-8 flex items-center justify-between">
        <h1 className="text-3xl md:text-4xl font-extrabold bg-gradient-to-r from-purple-600 to-pink-500 text-transparent bg-clip-text">
          Admin Dashboard
        </h1>
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/")}
            className="px-4 py-2 rounded-xl border border-purple-300 bg-white/80 text-purple-700 hover:bg-purple-100 transition-colors"
          >
            ⬅ Home
          </button>
        </div>
      </div>

      {/* Coach Applications */}
      <div className="max-w-7xl mx-auto px-5 md:px-8 mt-8">
        <div className="bg-white shadow-xl rounded-3xl p-6 border border-purple-100 mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Coach Applications</h2>
          
          {applications.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <div className="text-4xl mb-4">📋</div>
              <p>No pending applications</p>
            </div>
          ) : (
            <div className="space-y-4">
              {applications.map((app) => (
                <div key={app.id} className="border border-gray-200 rounded-2xl p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-800">{app.name || app.email}</h3>
                      <p className="text-sm text-gray-500">{app.email}</p>
                      <p className="text-xs text-gray-400">
                        Applied: {new Date(app.createdAt).toLocaleString()}
                      </p>
                      <div className="mt-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          app.coachStatus === "APPROVED" ? "bg-green-100 text-green-800" :
                          app.coachStatus === "REJECTED" ? "bg-red-100 text-red-800" :
                          "bg-yellow-100 text-yellow-800"
                        }`}>
                          {app.coachStatus === "APPROVED" ? "✅ Approved" :
                           app.coachStatus === "REJECTED" ? "❌ Rejected" :
                           "⏳ Pending"}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {app.coachStatus === "PENDING" ? (
                        <>
                          <button
                            onClick={() => approveApplication(app.id)}
                            className="px-4 py-2 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 text-white text-sm hover:scale-[1.02] transition-all"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => rejectApplication(app.id)}
                            className="px-4 py-2 rounded-xl bg-gradient-to-r from-red-500 to-pink-500 text-white text-sm hover:scale-[1.02] transition-all"
                          >
                            Reject
                          </button>
                        </>
                      ) : (
                        <div className="text-sm text-gray-500">
                          {app.coachStatus === "APPROVED" ? "Application approved" :
                           app.coachStatus === "REJECTED" ? "Application rejected" : ""}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Users List */}
        <div className="bg-white shadow-xl rounded-3xl p-6 border border-purple-100">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">All Users</h2>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Name</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Email</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Role</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Points</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Badges</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Joined</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b border-gray-100">
                    <td className="py-3 px-4">{user.name || "—"}</td>
                    <td className="py-3 px-4">{user.email}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        user.role === "ADMIN" ? "bg-red-100 text-red-800" :
                        user.role === "COACH" ? "bg-blue-100 text-blue-800" :
                        "bg-gray-100 text-gray-800"
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="py-3 px-4">{user.points}</td>
                    <td className="py-3 px-4">
                      <div className="flex gap-1">
                        {user.bronzeBadges > 0 && <span className="text-sm">🥉{user.bronzeBadges}</span>}
                        {user.silverBadges > 0 && <span className="text-sm">🥈{user.silverBadges}</span>}
                        {user.goldBadges > 0 && <span className="text-sm">🥇{user.goldBadges}</span>}
                        {user.bronzeBadges === 0 && user.silverBadges === 0 && user.goldBadges === 0 && (
                          <span className="text-gray-400 text-sm">—</span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-500">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-50">
          <div className={`px-4 py-3 rounded-xl shadow-lg ${
            toast.type === "error" ? "bg-red-100 text-red-800" :
            toast.type === "success" ? "bg-green-100 text-green-800" :
            "bg-blue-100 text-blue-800"
          }`}>
            {toast.msg}
          </div>
        </div>
      )}
    </main>
  );
}
