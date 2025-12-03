"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

type ChecklistItem = {
  id: string;
  dayIndex: number;
  completed: boolean;
};

type Todo = {
  id: string;
  title: string;
  planId?: string | null;
  items: ChecklistItem[];
};

export default function TodosPage() {
  const [todo, setTodo] = useState<Todo | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [planContent, setPlanContent] = useState<any>(null);
  const weekday = useMemo(
    () => ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    []
  );
  const [activeDay, setActiveDay] = useState<number>(1);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const todoRes = await fetch("/api/todos/latest", { cache: "no-store" });
      const todoData = await todoRes.json();
      const nextTodo: Todo | null = todoData.todo || null;
      setTodo(nextTodo);

      if (nextTodo?.planId) {
        const planRes = await fetch(`/api/plan/${nextTodo.planId}`, { cache: "no-store" });
        const planData = await planRes.json();
        setPlanContent(planData?.content || null);
      }
      setLoading(false);
    }
    load();
  }, []);

  async function toggle(itemId: string, completed: boolean) {
    if (!todo) return;
    setSaving(itemId);
    try {
      await fetch(`/api/todos/${todo.id}/${itemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed }),
      });
      setTodo({
        ...todo,
        items: todo.items.map((it) => (it.id === itemId ? { ...it, completed } : it)),
      });
    } finally {
      setSaving(null);
    }
  }

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <h1 className="text-xl font-semibold">Todos</h1>
        <p className="text-sm text-gray-500 mt-2">Loading…</p>
      </div>
    );
  }

  if (!todo) {
    return (
      <div className="max-w-4xl mx-auto p-6 space-y-4">
        <Link href="/" className="text-sm text-purple-600 hover:underline">← Back to Home</Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-extrabold text-purple-700">Weekly Plan</h1>
            <p className="text-sm text-gray-600">Generate your weekly checklist from the latest plan.</p>
          </div>
          <button
            onClick={async () => {
              setLoading(true);
              await fetch('/api/todos/create', { method: 'POST' })
              // reload items/text
              try {
                const todoRes = await fetch('/api/todos/latest', { cache: 'no-store' })
                const todoData = await todoRes.json()
                setTodo(todoData.todo || null)
                if (todoData.todo?.planId) {
                  const planRes = await fetch(`/api/plan/${todoData.todo.planId}`, { cache: 'no-store' })
                  const planData = await planRes.json()
                  setPlanContent(planData?.content || null)
                }
              } finally {
                setLoading(false)
              }
            }}
            className="px-4 py-2 rounded-xl text-white bg-gradient-to-r from-purple-500 to-pink-500 hover:opacity-90"
          >
            Generate Todo
          </button>
        </div>
        <div className="rounded-2xl border p-6 bg-white text-gray-600">
          No todo yet. Click “Generate Todo” to import from your latest Plan.
        </div>
      </div>
    );
  }

  const total = todo.items.length || 7;
  const done = todo.items.filter((i) => i.completed).length;
  const pct = Math.round((done / Math.max(1, total)) * 100);

  

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div>
        <Link href="/" className="text-sm text-purple-600 hover:underline">← Back to Home</Link>
      </div>
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-purple-700">Weekly Plan</h1>
          <p className="text-sm text-gray-600">Weekly checklist · Monday → Sunday</p>
        </div>
        <div className="flex items-center gap-3">
          <Link 
            href="/todos/history"
            className="text-sm text-purple-600 hover:underline"
          >
            History
          </Link>
          <button
            onClick={async () => {
              setLoading(true);
              try {
                await fetch('/api/todos/create', { method: 'POST' })
                // reload items/text
                const todoRes = await fetch('/api/todos/latest', { cache: 'no-store' })
                const todoData = await todoRes.json()
                setTodo(todoData.todo || null)
                if (todoData.todo?.planId) {
                  const planRes = await fetch(`/api/plan/${todoData.todo.planId}`, { cache: 'no-store' })
                  const planData = await planRes.json()
                  setPlanContent(planData?.content || null)
                }
              } finally {
                setLoading(false)
              }
            }}
            disabled={loading}
            className="px-4 py-2 rounded-xl text-white bg-gradient-to-r from-purple-500 to-pink-500 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
          >
            Generate New Todo
          </button>
          <button
            onClick={async () => {
              if (!todo) return;
              setLoading(true);
              try {
                const completeRes = await fetch(`/api/todos/${todo.id}/complete`, { 
                  method: 'POST' 
                });
                if (completeRes.ok) {
                  const completeData = await completeRes.json();
                  // refresh the state
                  if (completeData.newTodo) {
                    setTodo(completeData.newTodo);
                    if (completeData.newTodo.planId) {
                      const planRes = await fetch(`/api/plan/${completeData.newTodo.planId}`, { 
                        cache: 'no-store' 
                      });
                      if (planRes.ok) {
                        const planData = await planRes.json();
                        setPlanContent(planData?.content || null);
                      }
                    }
                  } else {
                    // refresh if no new todo
                    const todoRes = await fetch('/api/todos/latest', { cache: 'no-store' });
                    const todoData = await todoRes.json();
                    setTodo(todoData.todo || null);
                    if (todoData.todo?.planId) {
                      const planRes = await fetch(`/api/plan/${todoData.todo.planId}`, { 
                        cache: 'no-store' 
                      });
                      if (planRes.ok) {
                        const planData = await planRes.json();
                        setPlanContent(planData?.content || null);
                      }
                    }
                  }
                }
              } finally {
                setLoading(false);
              }
            }}
            disabled={!todo || loading}
            className="px-4 py-2 rounded-xl text-white bg-gradient-to-r from-emerald-500 to-green-500 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
          >
            Complete & Generate New
          </button>
          <div className="min-w-[220px]">
            <div className="flex items-center justify-between text-xs text-gray-600">
              <span>Progress</span>
              <span>{done}/{total} ({pct}%)</span>
            </div>
            <div className="mt-1 h-2 w-full bg-gray-200 rounded">
              <div className="h-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded" style={{ width: `${pct}%` }} />
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 bg-white/70 p-2 rounded-2xl border">
        {weekday.map((w, i) => {
          const idx = i + 1
          const isActive = activeDay === idx
          return (
            <button
              key={w}
              onClick={() => {
                setActiveDay(idx)
                const el = cardRefs.current[idx - 1]
                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'start' })
              }}
              className={`${isActive ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white' : 'bg-white text-gray-700'} px-3 py-1.5 rounded-full text-sm border`}
            >
              {w}
            </button>
          )
        })}
      </div>

      {(() => {
        const dayItems = todo.items.filter((it) => it.dayIndex === activeDay)
        const orderKeys = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday']
        const key = orderKeys[activeDay - 1]
        
        // From Plan Read Diet/Exercise
        let dietData: string[] = []
        let exerciseList: string[] = []
        if (planContent?.diet?.[key]) {
          const meals = planContent.diet[key]
          if (meals.breakfast?.length) dietData.push(`Breakfast: ${meals.breakfast.join(', ')}`)
          if (meals.lunch?.length) dietData.push(`Lunch: ${meals.lunch.join(', ')}`)
          if (meals.dinner?.length) dietData.push(`Dinner: ${meals.dinner.join(', ')}`)
        }
        if (planContent?.exercise?.[key]) {
          exerciseList = Array.isArray(planContent.exercise[key]) ? planContent.exercise[key] : []
        }
        
        // Diet: first item
        const dietItem = dayItems[0]
        // Exercise: other items
        const exerciseItems = dayItems.slice(1)
        
        return (
          <div className="grid grid-cols-1 gap-5">
            <div className="rounded-2xl border p-5 bg-white">
              <div className="flex items-center justify-between">
                <div className="text-base font-semibold">Diet</div>
                {dietItem && (
                  <input
                    id={dietItem.id}
                    type="checkbox"
                    className="h-5 w-5"
                    checked={dietItem.completed}
                    onChange={(e) => toggle(dietItem.id, e.target.checked)}
                    disabled={!!saving}
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
                ) : '—'}
              </div>
              {dietItem && dietItem.completed && (
                <div className="mt-2 text-xs text-emerald-700 bg-emerald-50 inline-flex rounded-full px-2 py-1">✓ +10 points</div>
              )}
            </div>

            <div className="rounded-2xl border p-5 bg-white">
              <div className="text-base font-semibold">Exercise</div>
              <div className="mt-3 space-y-2">
                {exerciseItems.length > 0 && exerciseList.length > 0 ? exerciseItems.map((ex, idx) => (
                  <div key={ex.id} className={`flex items-start justify-between gap-3 rounded-lg border p-3 ${ex.completed ? 'bg-emerald-50 border-emerald-200' : 'bg-white'}`}>
                    <div className="text-sm text-gray-800 flex-1">{exerciseList[idx] || '—'}</div>
                    <input
                      id={ex.id}
                      type="checkbox"
                      className="h-5 w-5 mt-1"
                      checked={ex.completed}
                      onChange={(e) => toggle(ex.id, e.target.checked)}
                      disabled={!!saving}
                    />
                  </div>
                )) : <div className="text-sm text-gray-500">—</div>}
              </div>
            </div>
          </div>
        )
      })()}
    </div>
  );
}


