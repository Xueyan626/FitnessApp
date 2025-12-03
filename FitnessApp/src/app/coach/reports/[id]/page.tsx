"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";

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
  studentData: any;
  gptAnalysis?: string;
  riskAnalysis?: string;
  recommendations?: string;
  knowledgeLinks?: Array<{
    title: string;
    url: string;
    description: string;
  }>;
};

export default function ReportDetailPage() {
  const router = useRouter();
  const params = useParams();
  const reportId = params.id as string;
  
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState<CoachReport | null>(null);
  const [toast, setToast] = useState<{ type: "info" | "error" | "success"; msg: string } | null>(null);

  function showToast(type: "info" | "error" | "success", msg: string) {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3000);
  }

  async function loadReport() {
    try {
      const res = await fetch("/api/coach/reports", { cache: "no-store" });
      if (res.status === 401) {
        router.push("/login");
        return;
      }
      if (!res.ok) {
        showToast("error", "Failed to load report");
        return;
      }
      const data = await res.json();
      const report = data.reports?.find((r: CoachReport) => r.id === reportId);
      
      if (!report) {
        showToast("error", "Report not found");
        router.push("/coach");
        return;
      }
      
      setReport(report);
    } catch (e) {
      showToast("error", "Failed to load report");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadReport();
  }, [reportId]);

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <div className="text-lg text-gray-500 animate-pulse">Loading report...</div>
      </main>
    );
  }

  if (!report) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-pink-50">
        <div className="text-center">
          <div className="text-4xl mb-4">❌</div>
          <p className="text-lg text-gray-500">Report not found</p>
          <button
            onClick={() => router.push("/coach")}
            className="mt-4 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:scale-[1.02] transition-all"
          >
            Back to Dashboard
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 pb-20">
      {/* Header */}
      <div className="max-w-7xl mx-auto px-5 md:px-8 pt-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold bg-gradient-to-r from-purple-600 to-pink-500 text-transparent bg-clip-text">
            {report.title}
          </h1>
          <p className="text-gray-600 mt-2">
            Created: {new Date(report.createdAt).toLocaleString()}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge status={report.status} />
          <button
            onClick={() => router.push("/coach")}
            className="px-4 py-2 rounded-xl border border-purple-300 bg-white/80 text-purple-700 hover:bg-purple-100 transition-colors"
          >
            ⬅ Back to Dashboard
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-5 md:px-8 mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Student Data */}
          <div className="bg-white shadow-xl rounded-3xl p-6 border border-purple-100">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Student Data</h2>
            <div className="bg-gray-50 rounded-2xl p-4">
              <pre className="text-sm text-gray-700 whitespace-pre-wrap overflow-x-auto">
                {JSON.stringify(report.studentData, null, 2)}
              </pre>
            </div>
          </div>

          {/* GPT Analysis */}
          {report.gptAnalysis && (
            <div className="bg-white shadow-xl rounded-3xl p-6 border border-purple-100">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Professional Analysis</h2>
              <div className="prose max-w-none">
                <div className="whitespace-pre-wrap text-gray-700">
                  {report.gptAnalysis}
                </div>
              </div>
            </div>
          )}

          {/* Risk Analysis */}
          {report.riskAnalysis && (
            <div className="bg-white shadow-xl rounded-3xl p-6 border border-red-100">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Risk Assessment</h2>
              <div className="prose max-w-none">
                <div className="whitespace-pre-wrap text-gray-700">
                  {report.riskAnalysis}
                </div>
              </div>
            </div>
          )}

          {/* Recommendations */}
          {report.recommendations && (
            <div className="bg-white shadow-xl rounded-3xl p-6 border border-green-100">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Recommendations</h2>
              <div className="prose max-w-none">
                <div className="whitespace-pre-wrap text-gray-700">
                  {report.recommendations}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Student Info */}
          {report.student && (
            <div className="bg-white shadow-xl rounded-3xl p-6 border border-purple-100">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Student Information</h3>
              <div className="space-y-2">
                <p><span className="font-medium">Name:</span> {report.student.name || "N/A"}</p>
                <p><span className="font-medium">Email:</span> {report.student.email}</p>
              </div>
            </div>
          )}

          {/* Knowledge Links */}
          {report.knowledgeLinks && report.knowledgeLinks.length > 0 && (
            <div className="bg-white shadow-xl rounded-3xl p-6 border border-purple-100">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Learning Resources</h3>
              <div className="space-y-3">
                {report.knowledgeLinks.map((link, index) => (
                  <a
                    key={index}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block p-3 rounded-xl border border-gray-200 hover:border-purple-300 hover:bg-purple-50 transition-colors"
                  >
                    <div className="font-medium text-purple-700">{link.title}</div>
                    <div className="text-sm text-gray-600 mt-1">{link.description}</div>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Report Status */}
          <div className="bg-white shadow-xl rounded-3xl p-6 border border-purple-100">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Report Status</h3>
            <div className="space-y-2">
              <p><span className="font-medium">Status:</span> <StatusBadge status={report.status} /></p>
              <p><span className="font-medium">Created:</span> {new Date(report.createdAt).toLocaleDateString()}</p>
              {report.status === "COMPLETED" && (
                <p className="text-green-600 text-sm">✅ Analysis completed successfully</p>
              )}
              {report.status === "FAILED" && (
                <p className="text-red-600 text-sm">❌ Analysis failed</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-50">
          <div className={`px-4 py-3 rounded-xl shadow-lg ${
            toast.type === "error" ? "bg-red-100 text-red-800" :
            toast.type === "success" ? "bg-green-100 text-green-800" :
            "bg-purple-100 text-purple-800"
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
    PROCESSING: "bg-purple-100 text-purple-800",
    COMPLETED: "bg-green-100 text-green-800",
    FAILED: "bg-red-100 text-red-800"
  };

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status as keyof typeof styles]}`}>
      {status}
    </span>
  );
}
