"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type CoachReport = {
  id: string;
  title: string;
  description?: string;
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
  createdAt: string;
  student?: {
    id: string;
    name?: string;
    email: string;
  };
  gptAnalysis?: string;
  riskAnalysis?: string;
  recommendations?: string;
  knowledgeLinks?: Array<{
    title: string;
    url: string;
    description: string;
  }>;
};

export default function CoachDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState<CoachReport[]>([]);
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: "info" | "error" | "success"; msg: string } | null>(null);
  const [selectedReport, setSelectedReport] = useState<CoachReport | null>(null);
  const [chatMessages, setChatMessages] = useState<Array<{role: "user" | "assistant", content: string}>>([]);
  const [chatInput, setChatInput] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);

  // Upload form state
  const [uploadForm, setUploadForm] = useState({
    title: "",
    description: "",
    studentData: "",
    studentId: ""
  });

  function showToast(type: "info" | "error" | "success", msg: string) {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3000);
  }

  // Handle file upload
  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/json") {
      showToast("error", "Please upload a JSON file");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const jsonData = JSON.parse(content);
        setUploadForm({ ...uploadForm, studentData: JSON.stringify(jsonData, null, 2) });
        showToast("success", "JSON file loaded successfully");
      } catch (error) {
        showToast("error", "Invalid JSON file");
      }
    };
    reader.readAsText(file);
  }

  async function loadReports() {
    try {
      const res = await fetch("/api/coach/reports", { cache: "no-store" });
      if (res.status === 401) {
        router.push("/login");
        return;
      }
      if (!res.ok) {
        showToast("error", "Failed to load reports");
        return;
      }
      const data = await res.json();
      setReports(data.reports || []);
    } catch (e) {
      showToast("error", "Failed to load reports");
    }
  }

  async function handleUpload() {
    if (!uploadForm.title || !uploadForm.studentData) {
      showToast("error", "Title and student data are required");
      return;
    }

    setUploading(true);
    try {
      const res = await fetch("/api/coach/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: uploadForm.title,
          description: uploadForm.description,
          studentData: JSON.parse(uploadForm.studentData),
          studentId: uploadForm.studentId || null
        })
      });

      const data = await res.json();
      if (!res.ok) {
        showToast("error", data?.error || "Upload failed");
        return;
      }

      showToast("success", "Report uploaded successfully");
      setUploadForm({ title: "", description: "", studentData: "", studentId: "" });
      await loadReports();
    } catch (e) {
      showToast("error", "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function analyzeReport(reportId: string) {
    setAnalyzing(reportId);
    try {
      const res = await fetch("/api/coach/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reportId })
      });

      const data = await res.json();
      if (!res.ok) {
        showToast("error", data?.error || "Analysis failed");
        return;
      }

      showToast("success", "Analysis completed successfully");
      await loadReports();
    } catch (e) {
      showToast("error", "Analysis failed");
    } finally {
      setAnalyzing(null);
    }
  }

  // Start chat with AI agent
  function startChat(report: CoachReport) {
    setSelectedReport(report);
    setChatMessages([{
      role: "assistant",
      content: `I've analyzed the student report "${report.title}". I can help you understand the findings, provide recommendations, or answer any questions about the analysis. What would you like to know?`
    }]);
  }

  // Send message to AI agent
  async function sendMessage() {
    if (!chatInput.trim() || !selectedReport || sendingMessage) return;

    const userMessage = chatInput.trim();
    setChatInput("");
    setSendingMessage(true);

    // Add user message to chat
    setChatMessages(prev => [...prev, { role: "user", content: userMessage }]);

    try {
      const res = await fetch("/api/coach/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reportId: selectedReport.id,
          message: userMessage,
          chatHistory: chatMessages
        })
      });

      const data = await res.json();
      if (!res.ok) {
        showToast("error", data?.error || "Failed to get AI response");
        return;
      }

      // Add AI response to chat
      setChatMessages(prev => [...prev, { role: "assistant", content: data.response }]);
    } catch (e) {
      showToast("error", "Failed to send message");
    } finally {
      setSendingMessage(false);
    }
  }

  useEffect(() => {
    loadReports();
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <div className="text-lg text-gray-500 animate-pulse">Loading coach dashboard...</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 pb-20">
      {/* Header */}
      <div className="max-w-7xl mx-auto px-5 md:px-8 pt-8 flex items-center justify-between">
        <h1 className="text-3xl md:text-4xl font-extrabold bg-gradient-to-r from-purple-600 to-pink-500 text-transparent bg-clip-text">
          Coach Dashboard
        </h1>
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/")}
            className="px-4 py-2 rounded-xl border border-purple-300 bg-white/80 text-purple-700 hover:bg-purple-100 transition-colors"
          >
            ⬅ Home
          </button>
        </div>
      </div>

      {/* Coach Profile */}
      <div className="max-w-7xl mx-auto px-5 md:px-8 mt-8">
        <div className="bg-white shadow-xl rounded-3xl p-6 border border-purple-100 mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Coach Profile</h2>
          <p className="text-gray-600">
            Welcome to your coach dashboard. Upload student JSON reports for AI analysis.
          </p>
        </div>

        {/* Upload Report Section */}
        <div className="bg-white shadow-xl rounded-3xl p-6 border border-purple-100 mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Upload Student Report</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Report Title *
              </label>
              <input
                type="text"
                value={uploadForm.title}
                onChange={(e) => setUploadForm({ ...uploadForm, title: e.target.value })}
                className="w-full rounded-xl border border-gray-300 p-3"
                placeholder="e.g., John's Health Assessment"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload JSON File or Paste Data *
              </label>
              <div className="space-y-2">
                <input
                  type="file"
                  accept=".json"
                  onChange={handleFileUpload}
                  className="w-full rounded-xl border border-gray-300 p-3"
                />
                <div className="text-center text-gray-500 text-sm">OR</div>
                <textarea
                  value={uploadForm.studentData}
                  onChange={(e) => setUploadForm({ ...uploadForm, studentData: e.target.value })}
                  className="w-full rounded-xl border border-gray-300 p-3 h-32 font-mono text-sm"
                  placeholder='{"assessment": {...}, "posture": {...}}'
                />
              </div>
            </div>
            
            <button
              onClick={handleUpload}
              disabled={uploading}
              className="w-full px-4 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:scale-[1.02] transition-all disabled:opacity-50"
            >
              {uploading ? "Uploading..." : "Upload Report"}
            </button>
          </div>
        </div>

        {/* Reports List */}
        <div className="bg-white shadow-xl rounded-3xl p-6 border border-purple-100">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">Analysis Reports</h2>
          
          {reports.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <div className="text-4xl mb-4">📊</div>
              <p>No reports uploaded yet</p>
              <p className="text-sm">Upload your first student report to get started</p>
            </div>
          ) : (
            <div className="space-y-4">
              {reports.map((report) => (
                <div key={report.id} className="border border-gray-200 rounded-2xl p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-800">{report.title}</h3>
                        <StatusBadge status={report.status} />
                      </div>
                      
                      {report.description && (
                        <p className="text-gray-600 mb-3">{report.description}</p>
                      )}
                      
                      {report.student && (
                        <p className="text-sm text-gray-500 mb-3">
                          Student: {report.student.name || report.student.email}
                        </p>
                      )}
                      
                      <p className="text-xs text-gray-400">
                        Created: {new Date(report.createdAt).toLocaleString()}
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-2 ml-4">
                      {report.status === "PENDING" && (
                        <button
                          onClick={() => analyzeReport(report.id)}
                          disabled={analyzing === report.id}
                          className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm hover:scale-[1.02] transition-all disabled:opacity-50"
                        >
                          {analyzing === report.id ? "Analyzing..." : "Analyze with GPT"}
                        </button>
                      )}
                      
                      {report.status === "COMPLETED" && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => router.push(`/coach/reports/${report.id}`)}
                            className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm hover:scale-[1.02] transition-all"
                          >
                            View Analysis
                          </button>
                          <button
                            onClick={() => startChat(report)}
                            className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm hover:scale-[1.02] transition-all"
                          >
                            Chat with AI
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>


      {/* AI Chat Modal */}
      {selectedReport && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl w-full max-w-4xl h-[80vh] flex flex-col">
            {/* Chat Header */}
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">AI Assistant - {selectedReport.title}</h3>
                <p className="text-sm text-gray-500">Ask questions about the analysis</p>
              </div>
              <button
                onClick={() => {
                  setSelectedReport(null);
                  setChatMessages([]);
                }}
                className="px-3 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                ✕ Close
              </button>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {chatMessages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] p-3 rounded-2xl ${
                      message.role === "user"
                        ? "bg-blue-500 text-white"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    <div className="whitespace-pre-wrap">{message.content}</div>
                  </div>
                </div>
              ))}
              {sendingMessage && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 p-3 rounded-2xl">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Chat Input */}
            <div className="p-4 border-t border-gray-200">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                  placeholder="Ask a question about the analysis..."
                  className="flex-1 rounded-xl border border-gray-300 p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={sendingMessage}
                />
                <button
                  onClick={sendMessage}
                  disabled={!chatInput.trim() || sendingMessage}
                  className="px-4 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:scale-[1.02] transition-all disabled:opacity-50"
                >
                  Send
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-50">
          <div className={`px-4 py-3 rounded-xl shadow-lg ${
            toast.type === "error" ? "bg-red-100 text-red-800" :
            toast.type === "success" ? "bg-green-100 text-green-800" :
            "bg-blue-100 text-blue-800"
          }`}>
            {toast.msg}
          </div>
        </div>
      )}
    </main>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles = {
    PENDING: "bg-yellow-100 text-yellow-800",
    PROCESSING: "bg-blue-100 text-blue-800",
    COMPLETED: "bg-green-100 text-green-800",
    FAILED: "bg-red-100 text-red-800"
  };

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status as keyof typeof styles]}`}>
      {status}
    </span>
  );
}
