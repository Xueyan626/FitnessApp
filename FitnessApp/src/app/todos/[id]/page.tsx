"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type ChecklistItem = {
  id: string;
  dayIndex: number;
  completed: boolean;
};

type Todo = {
  id: string;
  title: string;
  planId?: string | null;
  completed: boolean;
  createdAt: string;
  items: ChecklistItem[];
};

export default function TodoDetailPage() {
  const router = useRouter();
  const params = useParams();
  const todoId = params.id as string;

  const [todo, setTodo] = useState<Todo | null>(null);
  const [planContent, setPlanContent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const weekday = useMemo(() => ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"], []);
  const [activeDay, setActiveDay] = useState<number>(1);

  useEffect(() => {
    if (todoId) {
      fetchTodo();
    }
  }, [todoId]);

  const fetchTodo = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await fetch("/api/todos", { cache: "no-store" });
      const data = await res.json();

      if (res.ok) {
        const foundTodo = data.todos?.find((t: Todo) => t.id === todoId);
        if (foundTodo) {
          setTodo(foundTodo);
          if (foundTodo.planId) {
            const planRes = await fetch(`/api/plan/${foundTodo.planId}`, { cache: "no-store" });
            const planData = await planRes.json();
            setPlanContent(planData?.content || null);
          }
        } else {
          setError("Todo not found");
        }
      } else {
        setError(data.error || "Failed to load todo");
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
          <p className="text-gray-600 mt-4">Loading todo...</p>
        </div>
      </div>
    );
  }

  if (error || !todo) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 p-6">
        <div className="max-w-4xl mx-auto">
          <Link href="/todos/history" className="text-purple-600 hover:text-purple-800 mb-4 flex items-center">
            ← Back to History
          </Link>
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error || "Todo not found"}
          </div>
        </div>
      </div>
    );
  }

  const completedCount = todo.items.filter((i) => i.completed).length;
  const totalCount = todo.items.length;
  const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <Link href="/todos/history" className="text-purple-600 hover:text-purple-800 mb-4 flex items-center">
          ← Back to History
        </Link>

        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-end justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-extrabold text-purple-700 mb-2">{todo.title}</h1>
              <p className="text-sm text-gray-600">
                Created: {new Date(todo.createdAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
            <div className="min-w-[220px]">
              <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                <span>Progress</span>
                <span>
                  {completedCount}/{totalCount} ({progress}%)
                </span>
              </div>
              <div className="h-2 w-full bg-gray-200 rounded">
                <div
                  className="h-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span
                className={`text-xs font-semibold mt-1 inline-block px-2 py-1 rounded ${
                  todo.completed ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                }`}
              >
                {todo.completed ? "Completed" : "In Progress"}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 bg-purple-50 p-2 rounded-2xl border border-purple-200">
            {weekday.map((w, i) => {
              const idx = i + 1;
              const isActive = activeDay === idx;
              const dayItems = todo.items.filter((it) => it.dayIndex === idx);
              const dayCompleted = dayItems.filter((it) => it.completed).length;
              return (
                <button
                  key={w}
                  onClick={() => setActiveDay(idx)}
                  className={`${
                    isActive
                      ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                      : "bg-white text-gray-700"
                  } px-3 py-1.5 rounded-full text-sm border transition-colors`}
                >
                  {w} ({dayCompleted}/{dayItems.length})
                </button>
              );
            })}
          </div>

          {(() => {
            const dayItems = todo.items.filter((it) => it.dayIndex === activeDay);
            const orderKeys = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
            const key = orderKeys[activeDay - 1];

            let dietData: string[] = [];
            let exerciseList: string[] = [];
            if (planContent?.diet?.[key]) {
              const meals = planContent.diet[key];
              if (meals.breakfast?.length) dietData.push(`Breakfast: ${meals.breakfast.join(", ")}`);
              if (meals.lunch?.length) dietData.push(`Lunch: ${meals.lunch.join(", ")}`);
              if (meals.dinner?.length) dietData.push(`Dinner: ${meals.dinner.join(", ")}`);
            }
            if (planContent?.exercise?.[key]) {
              exerciseList = Array.isArray(planContent.exercise[key]) ? planContent.exercise[key] : [];
            }

            const dietItem = dayItems[0];
            const exerciseItems = dayItems.slice(1);

            return (
              <div className="grid grid-cols-1 gap-5 mt-6">
                <div className="rounded-2xl border p-5 bg-white">
                  <div className="flex items-center justify-between">
                    <div className="text-base font-semibold">Diet</div>
                    {dietItem && (
                      <input
                        type="checkbox"
                        className="h-5 w-5"
                        checked={dietItem.completed}
                        disabled
                      />
                    )}
                  </div>
                  <div className="mt-3 text-sm text-gray-700 leading-6">
                    {dietData.length > 0 ? (
                      <ul className="list-disc pl-5 space-y-1">
                        {dietData.map((line, i) => (
                          <li key={i}>{line}</li>
                        ))}
                      </ul>
                    ) : (
                      "—"
                    )}
                  </div>
                </div>

                <div className="rounded-2xl border p-5 bg-white">
                  <div className="text-base font-semibold mb-3">Exercise</div>
                  <div className="space-y-2">
                    {exerciseItems.length > 0 && exerciseList.length > 0 ? (
                      exerciseItems.map((ex, idx) => (
                        <div
                          key={ex.id}
                          className={`flex items-start justify-between gap-3 rounded-lg border p-3 ${
                            ex.completed ? "bg-emerald-50 border-emerald-200" : "bg-white"
                          }`}
                        >
                          <div className="text-sm text-gray-800 flex-1">{exerciseList[idx] || "—"}</div>
                          <input type="checkbox" className="h-5 w-5 mt-1" checked={ex.completed} disabled />
                        </div>
                      ))
                    ) : (
                      <div className="text-sm text-gray-500">—</div>
                    )}
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
}

