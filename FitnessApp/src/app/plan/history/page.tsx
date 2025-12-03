"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

type Plan = {
  id: string;
  content: {
    summary?: string;
  };
  createdAt: string;
};

export default function PlanHistoryPage() {
  const router = useRouter();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await fetch("/api/plan/userplan");
      const data = await res.json();

      if (res.ok) {
        setPlans(data.plans || []);
      } else {
        setError(data.error || "Failed to load plans");
      }
    } catch (err) {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading plans...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 p-6">
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => router.push("/plan")}
          className="text-purple-600 hover:text-purple-800 mb-4 flex items-center"
        >
          ← Back to Current Plan
        </button>

        <h1 className="text-4xl font-bold text-purple-800 mb-2">Plan History</h1>
        <p className="text-gray-600 mb-6">View your previous health plans</p>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {plans.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <div className="text-6xl mb-4">📋</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">No Plans Yet</h2>
            <p className="text-gray-600 mb-6">You haven't generated any plans yet.</p>
            <button
              onClick={() => router.push("/plan")}
              className="bg-purple-600 text-white px-8 py-3 rounded-lg hover:bg-purple-700 font-semibold"
            >
              Generate Your First Plan
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {plans.map((plan) => (
              <div
                key={plan.id}
                onClick={() => router.push(`/plan/${plan.id}`)}
                className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition cursor-pointer"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-2xl">📋</span>
                      <h3 className="text-xl font-bold text-purple-800">
                        Health Plan
                      </h3>
                    </div>
                    <p className="text-gray-600 mb-3">
                      Created on {new Date(plan.createdAt).toLocaleString()}
                    </p>
                    {plan.content.summary && (
                      <p className="text-gray-700 line-clamp-2">
                        {plan.content.summary}
                      </p>
                    )}
                  </div>
                  <button className="text-purple-600 hover:text-purple-800 font-semibold">
                    View Details →
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}