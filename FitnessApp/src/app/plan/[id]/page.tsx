"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";

// Updated type definitions for daily varied diet
type DailyMeals = {
  breakfast: string[];
  lunch: string[];
  dinner: string[];
  snacks: string[];
};

type DietPlan = {
  monday: DailyMeals;
  tuesday: DailyMeals;
  wednesday: DailyMeals;
  thursday: DailyMeals;
  friday: DailyMeals;
  saturday: DailyMeals;
  sunday: DailyMeals;
  tips: string[];
};

type ExercisePlan = {
  monday: string[];
  tuesday: string[];
  wednesday: string[];
  thursday: string[];
  friday: string[];
  saturday: string[];
  sunday: string[];
  tips: string[];
};

type PlanContent = {
  diet: DietPlan;
  exercise: ExercisePlan;
  summary: string;
};

type Plan = {
  id: string;
  content: PlanContent;
  createdAt: string;
  assessment?: {
    constitution: string;
  };
};

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
};

const DAYS_ORDER = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
const DAY_NAMES: Record<string, string> = {
  monday: "Monday",
  tuesday: "Tuesday",
  wednesday: "Wednesday",
  thursday: "Thursday",
  friday: "Friday",
  saturday: "Saturday",
  sunday: "Sunday",
};

export default function PlanDetailPage() {
  const router = useRouter();
  const params = useParams();
  const [plan, setPlan] = useState<Plan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedDay, setSelectedDay] = useState("monday");
  
  // AI Chat states
  const [chatMessage, setChatMessage] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (params?.id) {
      fetchPlan(params.id as string);
    }
  }, [params?.id]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory]);

  const fetchPlan = async (id: string) => {
    try {
      setLoading(true);
      setError("");
      
      console.log("Fetching plan:", id);
      
      const res = await fetch(`/api/plan/${id}`);
      const data = await res.json();

      console.log("Response:", data);

      if (res.ok) {
        setPlan(data);
      } else {
        setError(data.error || "Failed to load plan");
      }
    } catch (err) {
      console.error("Fetch error:", err);
      setError("Network error");
    } finally {
      setLoading(false);
    }
  };

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage.trim() || !plan) return;

    const userMessage = chatMessage.trim();
    
    setChatHistory((prev) => [
      ...prev,
      { role: "user", content: userMessage, timestamp: new Date() },
    ]);
    
    setChatMessage("");
    setChatLoading(true);

    try {
      const res = await fetch("/api/plan/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId: plan.id,
          message: userMessage,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setPlan({ ...plan, content: data.content });
        
        setChatHistory((prev) => [
          ...prev,
          {
            role: "assistant",
            content: data.message,
            timestamp: new Date(),
          },
        ]);
      } else {
        setChatHistory((prev) => [
          ...prev,
          {
            role: "assistant",
            content: `❌ ${data.error || "Failed to update plan"}`,
            timestamp: new Date(),
          },
        ]);
      }
    } catch (err) {
      console.error("Chat error:", err);
      setChatHistory((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "❌ Network error. Please try again.",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  const renderMealItems = (items: string[], title: string) => (
    <div className="mb-4">
      <h4 className="font-semibold text-purple-700 mb-2">{title}</h4>
      <ul className="list-disc list-inside space-y-1">
        {items?.map((item, idx) => (
          <li key={idx} className="text-gray-700">{item}</li>
        ))}
      </ul>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading plan...</p>
        </div>
      </div>
    );
  }

  if (error || !plan) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 p-6">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => router.push("/plan/history")}
            className="text-purple-600 hover:text-purple-800 mb-4 flex items-center"
          >
            ← Back to History
          </button>
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error || "Plan not found"}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 p-6">
      <div className="max-w-7xl mx-auto">
        <button
          onClick={() => router.push("/plan/history")}
          className="text-purple-600 hover:text-purple-800 mb-4 flex items-center"
        >
          ← Back to History
        </button>

        <h1 className="text-4xl font-bold text-purple-800 mb-2">Health Plan Details</h1>
        <p className="text-gray-600 mb-6">
          Created on {new Date(plan.createdAt).toLocaleString()}
          {plan.assessment?.constitution && (
            <span className="ml-3 px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm">
              {plan.assessment.constitution}
            </span>
          )}
        </p>

        {/* Day Selector */}
        <div className="bg-white rounded-xl shadow-lg p-4 mb-6">
          <div className="flex flex-wrap gap-2 justify-center">
            {DAYS_ORDER.map((day) => (
              <button
                key={day}
                onClick={() => setSelectedDay(day)}
                className={`px-6 py-2 rounded-lg font-semibold transition ${
                  selectedDay === day
                    ? "bg-purple-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {DAY_NAMES[day]}
              </button>
            ))}
          </div>
        </div>

        {/* Diet and Exercise */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Diet Plan */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center mb-4">
              <span className="text-3xl mr-3">🥗</span>
              <h2 className="text-2xl font-bold text-purple-800">
                {DAY_NAMES[selectedDay]} Diet Plan
              </h2>
            </div>
            {plan.content.diet && plan.content.diet[selectedDay as keyof DietPlan] && (
              <>
                {renderMealItems(
                  (plan.content.diet[selectedDay as keyof DietPlan] as DailyMeals).breakfast || [],
                  "Breakfast"
                )}
                {renderMealItems(
                  (plan.content.diet[selectedDay as keyof DietPlan] as DailyMeals).lunch || [],
                  "Lunch"
                )}
                {renderMealItems(
                  (plan.content.diet[selectedDay as keyof DietPlan] as DailyMeals).dinner || [],
                  "Dinner"
                )}
                {renderMealItems(
                  (plan.content.diet[selectedDay as keyof DietPlan] as DailyMeals).snacks || [],
                  "Snacks"
                )}
                {plan.content.diet.tips && (
                  <div className="mt-4 p-3 bg-yellow-50 rounded border border-yellow-200">
                    <h4 className="font-semibold text-yellow-800 mb-2">💡 Diet Tips</h4>
                    <ul className="list-disc list-inside space-y-1">
                      {plan.content.diet.tips.map((tip: string, idx: number) => (
                        <li key={idx} className="text-gray-700 text-sm">{tip}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Exercise Plan */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center mb-4">
              <span className="text-3xl mr-3">💪</span>
              <h2 className="text-2xl font-bold text-purple-800">
                {DAY_NAMES[selectedDay]} Exercise
              </h2>
            </div>
            {plan.content.exercise && plan.content.exercise[selectedDay as keyof ExercisePlan] && (
              <>
                <div className="p-4 bg-purple-50 rounded mb-4">
                  <ul className="list-disc list-inside space-y-2">
                    {plan.content.exercise[selectedDay as keyof ExercisePlan].map(
                      (ex: string, idx: number) => (
                        <li key={idx} className="text-gray-700">{ex}</li>
                      )
                    )}
                  </ul>
                </div>
                {plan.content.exercise.tips && (
                  <div className="p-3 bg-blue-50 rounded border border-blue-200">
                    <h4 className="font-semibold text-blue-800 mb-2">💡 Exercise Tips</h4>
                    <ul className="list-disc list-inside space-y-1">
                      {plan.content.exercise.tips.map((tip: string, idx: number) => (
                        <li key={idx} className="text-gray-700 text-sm">{tip}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Summary */}
        {plan.content.summary && (
          <div className="bg-gradient-to-r from-purple-100 to-pink-100 rounded-xl shadow-lg p-6 mb-6">
            <h3 className="text-xl font-bold text-purple-800 mb-3">📊 Plan Summary</h3>
            <p className="text-gray-700 leading-relaxed">{plan.content.summary}</p>
          </div>
        )}

        {/* AI Chat Interface */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <button
            onClick={() => setShowChat(!showChat)}
            className="flex items-center text-purple-700 font-semibold mb-4 hover:text-purple-900"
          >
            <span className="text-2xl mr-2">💬</span>
            {showChat ? "Hide Chat" : "Chat with AI to Modify This Plan"}
          </button>

          {showChat && (
            <div>
              {/* Chat History */}
              {chatHistory.length > 0 && (
                <div className="mb-4 max-h-96 overflow-y-auto bg-gray-50 rounded-lg p-4 space-y-3">
                  {chatHistory.map((msg, idx) => (
                    <div
                      key={idx}
                      className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg p-3 ${
                          msg.role === "user"
                            ? "bg-purple-600 text-white"
                            : "bg-gray-200 text-gray-800"
                        }`}
                      >
                        <p className="text-sm">{msg.content}</p>
                        <p className="text-xs mt-1 opacity-70">
                          {msg.timestamp.toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))}
                  <div ref={chatEndRef} />
                </div>
              )}

              {/* Examples */}
              <div className="bg-gray-50 rounded-lg p-4 mb-4 border border-gray-200">
                <p className="text-sm text-gray-600 mb-2">
                  <strong>Examples:</strong>
                </p>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• "Remove oatmeal from Monday breakfast"</li>
                  <li>• "Add more protein to Tuesday lunch"</li>
                  <li>• "Replace swimming with cycling on Wednesday"</li>
                  <li>• "Make Friday vegetarian"</li>
                </ul>
              </div>

              {/* Chat Input */}
              <form onSubmit={handleChatSubmit} className="flex gap-2">
                <input
                  type="text"
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  placeholder="Tell AI how to modify this plan..."
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  disabled={chatLoading}
                />
                <button
                  type="submit"
                  disabled={chatLoading || !chatMessage.trim()}
                  className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 disabled:opacity-50 font-semibold"
                >
                  {chatLoading ? "Sending..." : "Send"}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}