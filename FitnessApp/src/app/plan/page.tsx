"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

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
  assessment?: { constitution: string };
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

export default function PlanPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [currentPlan, setCurrentPlan] = useState<Plan | null>(null);
  const [chatMessage, setChatMessage] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [error, setError] = useState("");
  const [selectedDay, setSelectedDay] = useState("monday");
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [forceUpdate, setForceUpdate] = useState(0); // Force re-render trigger
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchCurrentPlan();
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory]);

  const fetchCurrentPlan = async () => {
    try {
      setLoading(true);
      setError("");
      
      console.log("📥 Fetching current plan...");
      const res = await fetch("/api/plan/userplan");
      const data = await res.json();

      console.log("📊 Plans found:", data.plans?.length);

      if (res.ok && data.plans && data.plans.length > 0) {
        setCurrentPlan(data.plans[0]);
        console.log("✅ Plan loaded:", data.plans[0].id);
      } else if (!res.ok) {
        setError(data.error || "Failed to load plans");
      }
    } catch (err: any) {
      console.error("❌ Fetch error:", err);
      setError(err.message || "Network error while loading plans");
    } finally {
      setLoading(false);
    }
  };

  const handleGeneratePlan = async () => {
    try {
      setGenerating(true);
      setError("");

      const res = await fetch("/api/plan/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const data = await res.json();

      if (res.ok) {
        setCurrentPlan({
          id: data.id,
          content: data.content,
          createdAt: data.createdAt,
        });
        setChatHistory([]);
      } else {
        setError(data.error || "Failed to generate plan");
      }
    } catch (err) {
      setError("Network error while generating plan");
    } finally {
      setGenerating(false);
    }
  };

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage.trim() || !currentPlan) return;

    const userMessage = chatMessage.trim();
    
    console.log("💬 Sending chat message:", userMessage);
    console.log("📋 Plan ID:", currentPlan.id);
    console.log("📊 Before - Monday breakfast:", currentPlan.content?.diet?.monday?.breakfast);
    
    setChatHistory((prev) => [
      ...prev,
      { role: "user", content: userMessage, timestamp: new Date() },
    ]);
    
    setChatMessage("");
    setChatLoading(true);

    try {
      // 1. Send chat request
      const res = await fetch("/api/plan/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId: currentPlan.id,
          message: userMessage,
        }),
      });

      const data = await res.json();

      console.log("📥 Chat response received");

      if (res.ok) {
        console.log("✅ Chat succeeded, refreshing plan from database...");
        
        // 2. Fetch fresh data from database
        const refreshRes = await fetch(`/api/plan/${currentPlan.id}`);
        const refreshData = await refreshRes.json();
        
        if (refreshRes.ok) {
          console.log("✅ Plan refreshed from database");
          console.log("📊 After - Monday breakfast:", refreshData.content?.diet?.monday?.breakfast);
          
          // 3. Update state with fresh data
          setCurrentPlan({
            id: refreshData.id,
            content: refreshData.content,
            createdAt: refreshData.createdAt,
            assessment: refreshData.assessment,
          });
          
          // 4. Force re-render
          setForceUpdate((prev) => prev + 1);
          
          console.log("✅ UI should update now");
        } else {
          console.warn("⚠️ Could not refresh plan, using API response");
          // Fallback to API response
          setCurrentPlan({
            id: currentPlan.id,
            content: data.content,
            createdAt: currentPlan.createdAt,
            assessment: currentPlan.assessment,
          });
          setForceUpdate((prev) => prev + 1);
        }
        
        setChatHistory((prev) => [
          ...prev,
          {
            role: "assistant",
            content: data.message + " ✅",
            timestamp: new Date(),
          },
        ]);
        
      } else {
        console.error("❌ Chat failed:", data.error);
        setChatHistory((prev) => [
          ...prev,
          {
            role: "assistant",
            content: `❌ ${data.error || "Failed to update plan"}`,
            timestamp: new Date(),
          },
        ]);
      }
    } catch (err: any) {
      console.error("❌ Chat error:", err);
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
          <li key={`${title}-${idx}-${forceUpdate}`} className="text-gray-700">{item}</li>
        ))}
      </ul>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <button
              onClick={() => router.push("/profile")}
              className="text-purple-600 hover:text-purple-800 mb-2 flex items-center"
            >
              ← Back to Profile
            </button>
            <h1 className="text-4xl font-bold text-purple-800">Your Weekly Health Plan</h1>
            <p className="text-gray-600 mt-2">Personalized diet and exercise plan</p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => router.push("/plan/history")}
              className="bg-white text-purple-600 px-6 py-3 rounded-lg hover:bg-purple-50 font-semibold shadow-lg border border-purple-300"
            >
              📜 Plan History
            </button>
            <button
              onClick={handleGeneratePlan}
              disabled={generating}
              className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-lg hover:opacity-90 disabled:opacity-50 font-semibold shadow-lg"
            >
              {generating ? "Generating..." : "🎯 Generate New Plan"}
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {loading && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
            <p className="text-gray-600 mt-4">Loading your plan...</p>
          </div>
        )}

        {!loading && !currentPlan && (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <div className="text-6xl mb-4">📋</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">No Plan Yet</h2>
            <p className="text-gray-600 mb-6">Generate your first personalized health plan!</p>
            <button
              onClick={handleGeneratePlan}
              disabled={generating}
              className="bg-purple-600 text-white px-8 py-3 rounded-lg hover:bg-purple-700 disabled:opacity-50 font-semibold"
            >
              {generating ? "Generating..." : "Generate Plan Now"}
            </button>
          </div>
        )}

        {currentPlan && (
          <>
            {/* Day Selector */}
            <div className="bg-white rounded-xl shadow-lg p-4 mb-6" key={`day-selector-${forceUpdate}`}>
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
              {/* Diet Plan - Now shows selected day's meals */}
              <div className="bg-white rounded-xl shadow-lg p-6" key={`diet-${selectedDay}-${forceUpdate}`}>
                <div className="flex items-center mb-4">
                  <span className="text-3xl mr-3">🥗</span>
                  <h2 className="text-2xl font-bold text-purple-800">
                    {DAY_NAMES[selectedDay]} Diet Plan
                  </h2>
                </div>
                {currentPlan.content.diet && currentPlan.content.diet[selectedDay as keyof DietPlan] && (
                  <>
                    {renderMealItems(
                      (currentPlan.content.diet[selectedDay as keyof DietPlan] as DailyMeals).breakfast || [],
                      "Breakfast"
                    )}
                    {renderMealItems(
                      (currentPlan.content.diet[selectedDay as keyof DietPlan] as DailyMeals).lunch || [],
                      "Lunch"
                    )}
                    {renderMealItems(
                      (currentPlan.content.diet[selectedDay as keyof DietPlan] as DailyMeals).dinner || [],
                      "Dinner"
                    )}
                    {renderMealItems(
                      (currentPlan.content.diet[selectedDay as keyof DietPlan] as DailyMeals).snacks || [],
                      "Snacks"
                    )}
                    {currentPlan.content.diet.tips && (
                      <div className="mt-4 p-3 bg-yellow-50 rounded border border-yellow-200">
                        <h4 className="font-semibold text-yellow-800 mb-2">💡 Diet Tips</h4>
                        <ul className="list-disc list-inside space-y-1">
                          {currentPlan.content.diet.tips.map((tip, idx) => (
                            <li key={idx} className="text-gray-700 text-sm">{tip}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Exercise Plan */}
              <div className="bg-white rounded-xl shadow-lg p-6" key={`exercise-${selectedDay}-${forceUpdate}`}>
                <div className="flex items-center mb-4">
                  <span className="text-3xl mr-3">💪</span>
                  <h2 className="text-2xl font-bold text-purple-800">
                    {DAY_NAMES[selectedDay]} Exercise
                  </h2>
                </div>
                {currentPlan.content.exercise && (
                  <>
                    <div className="mb-4 p-4 bg-purple-50 rounded">
                      <ul className="list-disc list-inside space-y-2">
                        {currentPlan.content.exercise[selectedDay as keyof ExercisePlan]?.map(
                          (ex: string, idx: number) => (
                            <li key={`ex-${idx}-${forceUpdate}`} className="text-gray-700">{ex}</li>
                          )
                        )}
                      </ul>
                    </div>
                    {currentPlan.content.exercise.tips && (
                      <div className="mt-4 p-3 bg-blue-50 rounded border border-blue-200">
                        <h4 className="font-semibold text-blue-800 mb-2">💡 Exercise Tips</h4>
                        <ul className="list-disc list-inside space-y-1">
                          {currentPlan.content.exercise.tips.map((tip, idx) => (
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
            {currentPlan.content.summary && (
              <div className="bg-gradient-to-r from-purple-100 to-pink-100 rounded-xl shadow-lg p-6 mb-6">
                <h3 className="text-xl font-bold text-purple-800 mb-3">📊 Plan Summary</h3>
                <p className="text-gray-700 leading-relaxed">{currentPlan.content.summary}</p>
              </div>
            )}

            {/* AI Chat Interface */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <button
                onClick={() => setShowChat(!showChat)}
                className="flex items-center text-purple-700 font-semibold mb-4 hover:text-purple-900"
              >
                <span className="text-2xl mr-2">💬</span>
                {showChat ? "Hide Chat" : "Chat with AI to Modify Plan"}
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
                      placeholder="Tell AI how to modify your plan..."
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
          </>
        )}
      </div>
    </div>
  );
}