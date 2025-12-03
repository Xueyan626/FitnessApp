// src/app/rewards/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  getTier,
  getNextTier,
  getPointsToNextTier,
  getTierProgress,
} from "@/lib/reward";

type RewardPayload = {
  points: number;
  bronzeBadges: number;
  silverBadges: number;
  goldBadges: number;
};

export default function RewardsPage() {
  const router = useRouter();

  // --- State ---
  const [loading, setLoading] = useState(true);
  const [points, setPoints] = useState<number>(0);
  const [bronzeBadges, setBronzeBadges] = useState<number>(0);
  const [silverBadges, setSilverBadges] = useState<number>(0);
  const [goldBadges, setGoldBadges] = useState<number>(0);
  const [selectedKind, setSelectedKind] = useState<string>("");
  const [toast, setToast] = useState<{ type: "info" | "error" | "success"; msg: string } | null>(null);

  // --- Helpers ---
  function showToast(type: "info" | "error" | "success", msg: string) {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 2000);
  }

  async function loadRewardData() {
    try {
      const res = await fetch("/api/reward", { cache: "no-store" });
      if (res.status === 401) {
        router.push("/login");
        return;
      }
      if (!res.ok) {
        showToast("error", "Failed to load rewards");
        return;
      }
      const data: RewardPayload = await res.json();
      setPoints(data.points ?? 0);
      setBronzeBadges(data.bronzeBadges ?? 0);
      setSilverBadges(data.silverBadges ?? 0);
      setGoldBadges(data.goldBadges ?? 0);
    } catch (e) {
      showToast("error", "Failed to load rewards");
    }
  }

  async function loadAll() {
    setLoading(true);
    await loadRewardData();
    setLoading(false);
  }

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  // -------------------- CHANGED END ----------------------

  // --- Derived tier info based on badges ---
  const totalBadges = bronzeBadges + silverBadges + goldBadges;
  const tierInfo = useMemo(() => {
    if (goldBadges > 0) return { name: "Gold", emoji: "🥇", min: 0, max: null };
    if (silverBadges > 0) return { name: "Silver", emoji: "🥈", min: 0, max: null };
    if (bronzeBadges > 0) return { name: "Bronze", emoji: "🥉", min: 0, max: null };
    return { name: "None", emoji: "🏅", min: 0, max: null };
  }, [bronzeBadges, silverBadges, goldBadges]);

  type RedeemOption = { label: string; kind: string; cost: number; enabled: boolean };
  const redeemOptions: RedeemOption[] = useMemo(() => {
    return [
      { label: "Bronze Badge — 100 pts", kind: "Bronze Badge", cost: 100, enabled: points >= 100 },
      { label: "Silver Badge — 200 pts", kind: "Silver Badge", cost: 200, enabled: points >= 200 },
      { label: "Gold Badge — 500 pts",   kind: "Gold Badge",   cost: 500, enabled: points >= 500 },
    ];
  }, [points]);


  async function onRedeem() {
    if (!selectedKind) {
      showToast("error", "Please choose an item to redeem");
      return;
    }
    try {
      const res = await fetch("/api/reward", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind: selectedKind }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        showToast("error", data?.error || "Redeem failed");
        return;
      }
      showToast("success", "Redeemed successfully");
      setSelectedKind("");
      await loadAll(); // refresh points
    } catch {
      showToast("error", "Redeem failed");
    }
  }

  // --- Loading gate ---
  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-pink-50">
        <div className="text-lg text-gray-500 animate-pulse">Loading rewards…</div>
      </main>
    );
  }

  // --- UI ---
  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 pb-20">
      {/* Top bar */}
      <div className="max-w-7xl mx-auto px-5 md:px-8 pt-8 flex items-center justify-between">
        <h1 className="text-3xl md:text-4xl font-extrabold bg-gradient-to-r from-purple-600 to-pink-500 text-transparent bg-clip-text">
          Rewards
        </h1>
        <div className="flex items-center gap-3">
          <button
            onClick={loadAll}
            className="px-4 py-2 rounded-xl border border-purple-300 bg-white/80 text-purple-700 hover:bg-purple-100 transition-colors"
          >
            Refresh
          </button>
          <button
            onClick={() => router.push("/")}
            className="px-4 py-2 rounded-xl border border-purple-300 bg-white/80 text-purple-700 hover:bg-purple-100 transition-colors"
          >
            ⬅ Home
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="max-w-7xl mx-auto px-5 md:px-8 mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Current Points */}
        <div className="rounded-3xl p-6 bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-xl">
          <div className="text-sm opacity-90">Current Points</div>
          <div className="text-5xl font-extrabold mt-2">{points}</div>
          <div className="mt-3 text-white/90">
            Points are set by other modules (assessment, todo, reports). This page does not add points.
          </div>
        </div>

        {/* Badge Status */}
        <div className="rounded-3xl p-6 bg-white shadow-xl border border-purple-100">
          <div className="text-sm text-gray-500">Current Tier</div>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-3xl">{tierInfo.emoji}</span>
            <span className="text-3xl font-semibold">{tierInfo.name}</span>
          </div>

          <div className="mt-3 text-sm text-gray-600">
            {totalBadges > 0 ? (
              <>You have earned {totalBadges} badge{totalBadges > 1 ? 's' : ''} total</>
            ) : (
              <>No badges earned yet</>
            )}
          </div>
        </div>

        {/* Badge Counts */}
        <div className="rounded-3xl p-6 bg-white shadow-xl border border-purple-100">
          <div className="text-sm text-gray-500">Your Badges</div>
          <div className="mt-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-lg">🥉 Bronze</span>
              <span className="font-semibold text-lg">{bronzeBadges}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-lg">🥈 Silver</span>
              <span className="font-semibold text-lg">{silverBadges}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-lg">🥇 Gold</span>
              <span className="font-semibold text-lg">{goldBadges}</span>
            </div>
          </div>
          <div className="text-xs text-gray-500 mt-3">
            Total badges: {totalBadges}
          </div>
        </div>
      </div>

      {/* Redeem Section */}
      <div className="max-w-7xl mx-auto px-5 md:px-8 mt-10">
        <section className="max-w-2xl mx-auto bg-white shadow-xl rounded-3xl p-6 border border-purple-100">
          <h2 className="text-xl font-semibold text-gray-800 text-center">Redeem Points</h2>
          <p className="mt-2 text-sm text-gray-500 text-center">
            Spend your points for badges and rewards
          </p>

          <div className="mt-6 space-y-4">
            <select
              className="w-full rounded-xl border border-gray-200 p-3 text-sm"
              value={selectedKind}
              onChange={(e) => setSelectedKind(e.target.value)}
            >
              <option value="">Select an item to redeem</option>
              {redeemOptions.map((o) => (
                <option key={o.kind} value={o.kind} disabled={!o.enabled}>
                  {o.label} {o.enabled ? "" : "(insufficient points)"}
                </option>
              ))}
            </select>

            <button
              onClick={onRedeem}
              className="w-full rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold py-3 hover:scale-[1.02] hover:shadow-lg transition-all disabled:opacity-50"
              disabled={!selectedKind}
            >
              Redeem Now
            </button>
            {toast && (
              <div
                className={`text-sm mt-2 text-center ${
                  toast.type === "error" ? "text-red-600" : toast.type === "success" ? "text-green-600" : "text-gray-700"
                }`}
              >
                {toast.msg}
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

/* ----------------- UI atoms ----------------- */
function Badge({ active, label, icon }: { active: boolean; label: string; icon: string }) {
  return (
    <div
      className={`flex items-center gap-2 px-3 py-1.5 rounded-full border ${
        active ? "bg-purple-50 border-purple-200 text-purple-700" : "bg-gray-50 border-gray-200 text-gray-400"
      }`}
      title={label}
    >
      <span className="text-xl leading-none">{icon}</span>
      <span className="text-sm">{label}</span>
    </div>
  );
}