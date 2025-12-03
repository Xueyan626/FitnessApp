"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Login failed");
      } else {
        // ✅ Use router.replace for immediate navigation (no delay)
        router.replace("/");
      }
    } catch (err) {
      setError("Network error");
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
          <p className="mt-2 text-gray-600">Sign in to continue your health journey</p>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              className="w-full p-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-400 bg-white"
              placeholder="demo@user.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              className="w-full p-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-400 bg-white"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && (
            <div className="text-red-500 text-sm text-center">{error}</div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold shadow-md hover:shadow-xl hover:scale-[1.02] transition-all disabled:opacity-50"
          >
            {loading ? "Signing in…" : "Sign In"}
          </button>
        </form>

        {/* Footer */}
        <div className="mt-6 text-center text-sm text-gray-500">
          Don’t have an account?
          <button
            onClick={() => router.push("/register")}
            className="ml-1 font-semibold text-purple-600 hover:underline"
          >
            Create one
          </button>
        </div>
      </div>
    </main>
  );
}