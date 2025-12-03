"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type Todo = {
  id: string;
  title: string;
  completed: boolean;
  createdAt: string;
  items: Array<{ id: string; completed: boolean }>;
};

export default function TodosHistoryPage() {
  const router = useRouter();
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchTodos();
  }, []);

  const fetchTodos = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await fetch("/api/todos", { cache: "no-store" });
      const data = await res.json();

      if (res.ok) {
        setTodos(data.todos || []);
      } else {
        setError(data.error || "Failed to load todos");
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
          <p className="text-gray-600 mt-4">Loading todos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 p-6">
      <div className="max-w-4xl mx-auto">
        <Link
          href="/todos"
          className="text-purple-600 hover:text-purple-800 mb-4 flex items-center"
        >
          ← Back to Current Todo
        </Link>

        <h1 className="text-4xl font-bold text-purple-800 mb-2">Todo History</h1>
        <p className="text-gray-600 mb-6">View your previous weekly todos</p>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {todos.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <div className="text-6xl mb-4">✅</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">No Todos Yet</h2>
            <p className="text-gray-600 mb-6">You haven't generated any todos yet.</p>
            <button
              onClick={() => router.push("/todos")}
              className="bg-purple-600 text-white px-8 py-3 rounded-lg hover:bg-purple-700 font-semibold"
            >
              Generate Your First Todo
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {todos.map((todo) => {
              const completedCount = todo.items.filter((i) => i.completed).length;
              const totalCount = todo.items.length;
              const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

              return (
                <Link
                  key={todo.id}
                  href={`/todos/${todo.id}`}
                  className="block bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-800 mb-2">{todo.title}</h3>
                      <p className="text-sm text-gray-600 mb-3">
                        {new Date(todo.createdAt).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </p>
                      <div className="flex items-center gap-4">
                        <span
                          className={`text-sm font-semibold px-3 py-1 rounded-full ${
                            todo.completed
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {todo.completed ? "Completed" : "In Progress"}
                        </span>
                        <span className="text-sm text-gray-600">
                          {completedCount}/{totalCount} items
                        </span>
                      </div>
                      <div className="mt-3 h-2 w-full bg-gray-200 rounded">
                        <div
                          className="h-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                    <div className="ml-4 text-purple-600 font-semibold">→</div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

