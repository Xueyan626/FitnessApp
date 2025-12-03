// src/app/register/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();

  // form state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pwd, setPwd] = useState("");
  const [pwd2, setPwd2] = useState("");
  const [role, setRole] = useState<"USER" | "COACH">("USER");

  // ui state
  const [showPwd, setShowPwd] = useState(false);
  const [showPwd2, setShowPwd2] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // basic client-side validation
  function validate(): string | null {
    if (!email.trim()) return "Email is required";
    if (!pwd) return "Password is required";
    if (pwd.length < 6) return "Password must be at least 6 characters";
    if (pwd !== pwd2) return "Passwords do not match";
    return null;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);

    const v = validate();
    if (v) {
      setErr(v);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password: pwd, name, role }),
      });

      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || "Registration failed");
      }

      const data = await res.json();
      
      // Check if it's a coach application
      if (role === "COACH" && data.message) {
        setErr(data.message);
        return;
      }

      // ✅ Redirect to login after successful registration
      router.replace("/login");
    } catch (e: any) {
      setErr(e?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-pink-50 px-4">
      <div className="w-full max-w-md rounded-3xl border border-purple-200 bg-white/80 backdrop-blur-xl shadow-2xl p-8">
        {/* Brand */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-extrabold bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent">
            FitFusion
          </h1>
          <p className="mt-2 text-gray-600">Create your account</p>
        </div>

        {/* Form */}
        <form onSubmit={onSubmit} className="space-y-5">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name (optional)
            </label>
            <input
              className="w-full p-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-400 bg-white"
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              required
              className="w-full p-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-400 bg-white"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </div>

          {/* Role Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Account Type
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setRole("USER")}
                className={`p-3 rounded-xl border-2 transition-all ${
                  role === "USER"
                    ? "border-purple-500 bg-purple-50 text-purple-700"
                    : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
                }`}
              >
                <div className="text-center">
                  <div className="text-2xl mb-1">👤</div>
                  <div className="font-medium">User</div>
                  <div className="text-xs text-gray-500">Health tracking</div>
                </div>
              </button>
              <button
                type="button"
                onClick={() => setRole("COACH")}
                className={`p-3 rounded-xl border-2 transition-all ${
                  role === "COACH"
                    ? "border-purple-500 bg-purple-50 text-purple-700"
                    : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
                }`}
              >
                <div className="text-center">
                  <div className="text-2xl mb-1">👨‍🏫</div>
                  <div className="font-medium">Coach</div>
                  <div className="text-xs text-gray-500">AI analysis</div>
                </div>
              </button>
            </div>
            {role === "COACH" && (
              <p className="mt-2 text-xs text-amber-600">
                ⚠️ Coach accounts require admin approval
              </p>
            )}
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <div className="flex gap-2">
              <input
                type={showPwd ? "text" : "password"}
                required
                minLength={6}
                className="flex-1 p-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-400 bg-white"
                placeholder="At least 6 characters"
                value={pwd}
                onChange={(e) => setPwd(e.target.value)}
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPwd((v) => !v)}
                className="px-3 rounded-xl border border-gray-200 bg-white text-sm hover:bg-gray-50"
              >
                {showPwd ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Confirm Password
            </label>
            <div className="flex gap-2">
              <input
                type={showPwd2 ? "text" : "password"}
                required
                minLength={6}
                className="flex-1 p-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-400 bg-white"
                placeholder="Re-enter your password"
                value={pwd2}
                onChange={(e) => setPwd2(e.target.value)}
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPwd2((v) => !v)}
                className="px-3 rounded-xl border border-gray-200 bg-white text-sm hover:bg-gray-50"
              >
                {showPwd2 ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          {/* Error */}
          {err && (
            <div className="text-center text-sm text-red-600">{err}</div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold shadow-md hover:shadow-xl hover:scale-[1.02] transition-all disabled:opacity-50"
          >
            {loading ? "Creating…" : "Create Account"}
          </button>
        </form>

        {/* Footer */}
        <div className="mt-6 text-center text-sm text-gray-500">
          Already have an account?
          <button
            onClick={() => router.push("/login")}
            className="ml-1 font-semibold text-purple-600 hover:underline"
          >
            Sign in
          </button>
        </div>
      </div>
    </main>
  );
}