// ✅ src/app/page.tsx — Final stable version with full safety & smooth redirect

"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type U = {
  id: string;
  email: string;
  name?: string | null;
  role: string;
  heightCm?: number | null;
  weightKg?: number | null;
  sex?: string | null;
  birthDate?: string | null;
  points: number;
};

export default function Home() {
  const [user, setUser] = useState<U | null>(null);
  const [loading, setLoading] = useState(true);
  const [avatar, setAvatar] = useState<string | null>(null);
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement | null>(null);

  // ✅ Load user info
  useEffect(() => {
    async function loadUser() {
      try {
        const res = await fetch("/api/profile", { cache: "no-store" });
        if (!res.ok) {
          router.replace("/login");
          return;
        }

        const data = await res.json();
        if (!data.user) {
          router.replace("/login");
          return;
        }

        setUser(data.user);
        setLoading(false);

        const cached = localStorage.getItem(`ff_avatar_data_url_${data.user.id}`);
        if (cached) setAvatar(cached);
      } catch {
        router.replace("/login");
      }
    }

    loadUser();
  }, [router]);

  // ✅ Avatar handler
  function openFilePicker() {
    fileRef.current?.click();
  }

  function onChooseAvatar(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const url = String(reader.result);
      setAvatar(url);
      if (user?.id) {
        localStorage.setItem(`ff_avatar_data_url_${user.id}`, url);
      }
    };
    reader.readAsDataURL(file);
  }

  // ✅ Logout (fast client-side redirect)
  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/login");
  }

  // ✅ Show loading state
  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-pink-50">
        <div className="text-lg text-gray-500 animate-pulse">Loading FitFusion…</div>
      </main>
    );
  }

  // ✅ Defensive checks
  if (!user) {
    router.replace("/login");
    return null;
  }

  const birth = user.birthDate
    ? new Date(user.birthDate).toISOString().slice(0, 10)
    : "—";
  const safe = (v: any) =>
    v === null || v === undefined || v === "" ? "—" : String(v);

  return (
    <main className="relative min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50">
      {/* Logout button */}
      <button
        onClick={handleLogout}
        className="absolute top-4 right-6 px-4 py-2 rounded-xl border border-purple-400 text-purple-700 bg-white/90 backdrop-blur hover:bg-gradient-to-r hover:from-purple-500 hover:to-pink-500 hover:text-white hover:shadow-md hover:scale-105 transition-all flex items-center gap-2 z-20"
      >
        🔒 Logout
      </button>

      <div className="max-w-7xl mx-auto px-5 md:px-8 py-10 md:py-16">
        <div className="flex flex-col-reverse md:flex-row gap-8 md:gap-12 items-stretch">
          {/* Profile Card */}
          <section className="md:w-[350px] w-full rounded-3xl border border-purple-200 bg-gradient-to-b from-white/90 to-white/70 backdrop-blur-lg shadow-xl p-6 md:p-7">
            <div className="flex flex-col items-center">
              <div
                className="relative w-28 h-28 md:w-32 md:h-32 rounded-full shadow-md ring-4 ring-white/70 overflow-hidden cursor-pointer group"
                onClick={openFilePicker}
                title="Click to upload avatar"
              >
                {avatar ? (
                  <img
                    src={avatar}
                    alt="Avatar"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-purple-200 to-pink-200 flex items-center justify-center">
                    <span className="text-4xl">👩‍💻</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
              </div>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={onChooseAvatar}
              />
              <button
                onClick={openFilePicker}
                className="mt-3 text-xs px-3 py-1 rounded-full bg-purple-100 text-purple-700 hover:bg-purple-200 transition-colors"
              >
                Change Avatar
              </button>
            </div>

            <h3 className="mt-5 text-center text-xl font-extrabold text-purple-700">
              Your Profile
            </h3>

            <div className="mt-4 space-y-2 text-[14px]">
              <Row label="Name" value={safe(user.name)} />
              <Row label="Email" value={user.email} />
              <Row label="Role" value={user.role} />
              <Row label="Height (cm)" value={safe(user.heightCm)} />
              <Row label="Weight (kg)" value={safe(user.weightKg)} />
              <Row label="Sex" value={safe(user.sex)} />
              <Row label="Birth Date" value={birth} />
              <Row label="Points" value={safe(user.points)} />
            </div>

            <button
              onClick={() => router.push("/profile")}
              className="mt-5 w-full rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-semibold py-3 hover:scale-105 hover:shadow-lg transition-all"
            >
              ✏️ Edit Profile
            </button>
          </section>

          {/* Main Section */}
          <section className="flex-1 flex flex-col justify-center">
            <div className="text-center md:text-left">
              <h1 className="text-6xl md:text-7xl font-extrabold bg-gradient-to-r from-purple-600 to-pink-500 text-transparent bg-clip-text drop-shadow-sm">
                FitFusion
              </h1>
              <p className="mt-3 text-gray-600 text-lg">
                Welcome{user.name ? `, ${user.name}` : ""}! Start your health journey now.
              </p>
            </div>

            <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {user.role === "ADMIN" ? (
                <ActionCard
                  title="Admin Dashboard"
                  emoji="⚙️"
                  desc="Manage users and coach applications"
                  onClick={() => router.push("/admin")}
                  gradient="from-red-500 to-pink-500"
                />
              ) : user.role === "COACH" ? (
                <ActionCard
                  title="Coach Dashboard"
                  emoji="👨‍🏫"
                  desc="Upload and analyze student reports"
                  onClick={() => router.push("/coach")}
                  gradient="from-green-500 to-emerald-500"
                />
              ) : (
                <>
                  <ActionCard
                    title="Start Assessment"
                    emoji="🧪"
                    desc="Quick test of your constitution"
                    onClick={() => router.push("/assessment")}
                    gradient="from-blue-500 to-indigo-500"
                  />
                  <ActionCard
                    title="Start Posture Analysis"
                    emoji="🧍"
                    desc="AI-powered posture assessment"
                    onClick={() => router.push("/posture")}
                    gradient="from-indigo-500 to-purple-500"
                  />
                  <ActionCard
                    title="View Plan"
                    emoji="📋"
                    desc="Your weekly training & diet"
                    onClick={() => router.push("/plan")}
                    variant="outline"
                  />
                  <ActionCard
                    title="View Rewards"
                    emoji="🎁"
                    desc="Points, tiers & badges"
                    onClick={() => router.push("/rewards")}
                    gradient="from-purple-500 to-pink-500"
                  />
                  <ActionCard
                    title="Todos"
                    emoji="✅"
                    desc="Daily checklist"
                    onClick={() => router.push("/todos")}
                    gradient="from-cyan-500 to-teal-500"
                  />
                  <ActionCard
                    title="Weekly Report"
                    emoji="📊"
                    desc="See this week's progress"
                    onClick={() => router.push("/weekly-report")}
                    gradient="from-blue-500 to-cyan-500"
                  />
                </>
              )}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

/* ---------- UI Components ---------- */
function Row({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-center justify-between border-b border-gray-100 py-1.5">
      <span className="text-gray-500">{label}</span>
      <span className="text-gray-800 font-medium">{value}</span>
    </div>
  );
}

function ActionCard(props: {
  title: string;
  emoji: string;
  desc: string;
  onClick: () => void;
  gradient?: string;
  variant?: "solid" | "outline";
}) {
  const { title, emoji, desc, onClick, gradient, variant = "solid" } = props;
  if (variant === "outline") {
    return (
      <button
        onClick={onClick}
        className="w-full text-left p-5 rounded-2xl bg-white border border-gray-200 shadow-sm hover:shadow-md hover:scale-[1.02] transition-all"
      >
        <div className="text-2xl">{emoji}</div>
        <div className="mt-1 font-semibold text-gray-800">{title}</div>
        <div className="text-sm text-gray-500">{desc}</div>
      </button>
    );
  }
  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-5 rounded-2xl text-white shadow-md hover:shadow-xl hover:scale-[1.02] transition-all bg-gradient-to-r ${gradient}`}
    >
      <div className="text-2xl">{emoji}</div>
      <div className="mt-1 font-semibold">{title}</div>
      <div className="text-sm opacity-90">{desc}</div>
    </button>
  );
}