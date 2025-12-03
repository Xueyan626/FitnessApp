"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type UserProfile = {
  name?: string | null;
  email: string;
  heightCm?: number | null;
  weightKg?: number | null;
  sex?: string | null;
  birthDate?: string | null;
};

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/profile", { cache: "no-store" });
      if (!res.ok) {
        router.push("/login");
        return;
      }
      const { user } = await res.json();
      setUser({
        name: user.name ?? "",
        email: user.email,
        heightCm: user.heightCm ?? "",
        weightKg: user.weightKg ?? "",
        sex: user.sex ?? "",
        birthDate: user.birthDate
          ? new Date(user.birthDate).toISOString().slice(0, 10)
          : "",
      });
    })();
  }, [router]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    setError(null);

    try {
      const body = {
        name: user.name || null,
        heightCm: user.heightCm === "" ? null : Number(user.heightCm),
        weightKg: user.weightKg === "" ? null : Number(user.weightKg),
        sex: user.sex || null,
        birthDate: user.birthDate || null,
      };

      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error("Failed to update profile");
      router.push("/");
    } catch (err: any) {
      setError(err.message || "Save failed");
    } finally {
      setSaving(false);
    }
  }

  if (!user)
    return (
      <main className="min-h-screen flex items-center justify-center bg-[#f7f9fb] text-[#6b7280]">
        Loading profile...
      </main>
    );


  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 flex justify-center items-start py-16 px-4">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-sm border border-[#e3e9f2] p-8">
        <h1 className="text-3xl font-serif italic font-extrabold bg-gradient-to-r from-purple-600 to-pink-500 text-transparent bg-clip-text text-center mb-6">
          Edit Profile
        </h1>
        <p className="text-sm text-gray-500 text-center mb-8">
          Update your basic information below.
        </p>

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name
            </label>
            <input
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-400"
              value={user.name ?? ""}
              onChange={(e) => setUser({ ...user, name: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email (readonly)
            </label>
            <input
              className="w-full border border-gray-200 rounded-lg px-3 py-2 bg-gray-100"
              value={user.email}
              readOnly
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Height (cm)
              </label>
              <input
                type="number"
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                value={user.heightCm as any}
                onChange={(e) => setUser({ ...user, heightCm: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Weight (kg)
              </label>
              <input
                type="number"
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                value={user.weightKg as any}
                onChange={(e) => setUser({ ...user, weightKg: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sex
              </label>
              <input
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                value={user.sex as any}
                onChange={(e) => setUser({ ...user, sex: e.target.value })}
                placeholder="MALE / FEMALE"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Birth Date
              </label>
              <input
                type="date"
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                value={user.birthDate as any}
                onChange={(e) =>
                  setUser({ ...user, birthDate: e.target.value })
                }
              />
            </div>
          </div>

          {error && <p className="text-red-600 text-sm">{error}</p>}

          <div className="flex gap-3 justify-center mt-6">
            <button
              disabled={saving}
              className="rounded-lg bg-[#2563eb] text-white px-6 py-2 hover:bg-[#1e40af] disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save"}
            </button>
            <a
              href="/"
              className="rounded-lg border border-gray-300 bg-white px-6 py-2 hover:bg-gray-50"
            >
              Cancel
            </a>
          </div>
        </form>
      </div>
    </main>
  );
}