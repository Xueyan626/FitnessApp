"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function PosturePage() {
  const router = useRouter();
  const [frontImage, setFrontImage] = useState<string>("");
  const [sideImage, setSideImage] = useState<string>("");
  const [backImage, setBackImage] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<any>(null);
  const [analyses, setAnalyses] = useState<any[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  // Convert uploaded image file to base64 format
  const handleImageUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    setImage: (base64: string) => void
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        const base64String = reader.result as string;
        // Remove the "data:image/jpeg;base64," prefix, keep only base64 data
        const base64Data = base64String.split(",")[1];
        setImage(base64Data);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async () => {
    if (!frontImage || !sideImage || !backImage) {
      setError("Please upload all three images");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Send base64 images to backend
      const response = await fetch("/api/posture/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          frontUrl: frontImage,
          sideUrl: sideImage,
          backUrl: backImage,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to analyze posture");
      }

      // Fetch analysis result
      const resultResponse = await fetch(`/api/posture/${data.id}`);
      const resultData = await resultResponse.json();
      setResult(resultData);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Load analysis history
  const loadHistory = async () => {
    try {
      const response = await fetch("/api/posture/list");
      const data = await response.json();
      setAnalyses(data.analyses || []);
      setShowHistory(true);
    } catch (err) {
      console.error("Failed to load history:", err);
    }
  };

  // View a specific historical analysis
  const viewAnalysis = async (id: string) => {
    try {
      const response = await fetch(`/api/posture/${id}`);
      const data = await response.json();
      setResult(data);
      setShowHistory(false);
    } catch (err) {
      console.error("Failed to load analysis:", err);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <button
              onClick={() => router.push("/")}
              className="text-purple-600 hover:text-purple-800 mb-4 font-semibold"
            >
              ← Home
            </button>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
              Posture Analysis
            </h1>
            <p className="text-gray-600">
              AI-powered posture assessment for better health
            </p>
          </div>
          <div className="flex gap-4">
            {!showHistory && (
              <button
                onClick={loadHistory}
                className="px-6 py-3 bg-white text-purple-600 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all border-2 border-purple-400"
              >
                History
              </button>
            )}
            {showHistory && (
              <button
                onClick={() => setShowHistory(false)}
                className="px-6 py-3 bg-white text-purple-600 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all border-2 border-purple-400"
              >
                New Analysis
              </button>
            )}
          </div>
        </div>

        {showHistory ? (
          /* History View */
          <div className="bg-white rounded-3xl shadow-xl p-8">
            <h2 className="text-2xl font-bold text-purple-600 mb-6">
              Analysis History
            </h2>
            {analyses.length === 0 ? (
              <p className="text-gray-500 text-center py-12">
                No analysis history yet. Complete your first analysis!
              </p>
            ) : (
              <div className="space-y-4">
                {analyses.map((analysis) => (
                  <div
                    key={analysis.id}
                    className="border-2 border-purple-200 rounded-xl p-6 hover:bg-purple-50 transition-colors cursor-pointer hover:border-purple-400"
                    onClick={() => viewAnalysis(analysis.id)}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-semibold text-gray-800 text-lg">
                          Posture Analysis
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                          {new Date(analysis.createdAt).toLocaleDateString(
                            "en-US",
                            {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            }
                          )}
                        </p>
                      </div>
                      <button className="text-purple-600 hover:text-purple-800 font-semibold text-lg">
                        View →
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : !result ? (
          /* Upload Form */
          <div className="bg-white rounded-3xl shadow-xl p-8">
            <div className="mb-8 text-center">
              <div className="text-6xl mb-4">📸</div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                Upload Your Photos
              </h2>
              <p className="text-gray-600">
                Take photos from three different angles for accurate analysis
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {/* Front View Upload */}
              <div className="relative h-full">
                <div className="border-2 border-dashed border-purple-300 rounded-2xl p-8 text-center hover:border-purple-500 transition-colors bg-gradient-to-br from-purple-50 to-pink-50 h-full flex flex-col justify-between min-h-[280px]">
                  <div>
                    <div className="text-4xl mb-4">👤</div>
                    <h3 className="font-bold text-purple-600 mb-2">
                      Front View
                    </h3>
                    <p className="text-sm text-gray-500 mb-4">
                      Face the camera directly
                    </p>
                  </div>
                  <div>
                    {frontImage ? (
                      <div className="text-green-600 font-semibold mb-2">
                        ✓ Uploaded
                      </div>
                    ) : (
                      <div className="text-gray-400 mb-2">No image</div>
                    )}
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, setFrontImage)}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                </div>
              </div>

              {/* Side View Upload */}
              <div className="relative h-full">
                <div className="border-2 border-dashed border-purple-300 rounded-2xl p-8 text-center hover:border-purple-500 transition-colors bg-gradient-to-br from-purple-50 to-pink-50 h-full flex flex-col justify-between min-h-[280px]">
                  <div>
                    <div className="text-4xl mb-4">👉</div>
                    <h3 className="font-bold text-purple-600 mb-2">Side View</h3>
                    <p className="text-sm text-gray-500 mb-4">
                      Turn 90° to the right
                    </p>
                  </div>
                  <div>
                    {sideImage ? (
                      <div className="text-green-600 font-semibold mb-2">
                        ✓ Uploaded
                      </div>
                    ) : (
                      <div className="text-gray-400 mb-2">No image</div>
                    )}
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, setSideImage)}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                </div>
              </div>

              {/* Back View Upload */}
              <div className="relative h-full">
                <div className="border-2 border-dashed border-purple-300 rounded-2xl p-8 text-center hover:border-purple-500 transition-colors bg-gradient-to-br from-purple-50 to-pink-50 h-full flex flex-col justify-between min-h-[280px]">
                  <div>
                    <div className="text-4xl mb-4">🔙</div>
                    <h3 className="font-bold text-purple-600 mb-2">Back View</h3>
                    <p className="text-sm text-gray-500 mb-4">
                      Turn 180° around
                    </p>
                  </div>
                  <div>
                    {backImage ? (
                      <div className="text-green-600 font-semibold mb-2">
                        ✓ Uploaded
                      </div>
                    ) : (
                      <div className="text-gray-400 mb-2">No image</div>
                    )}
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, setBackImage)}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-xl mb-6">
                {error}
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={loading || !frontImage || !sideImage || !backImage}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg
                    className="animate-spin h-5 w-5 mr-3"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Analyzing with AI...
                </span>
              ) : (
                "Analyze Posture"
              )}
            </button>
          </div>
        ) : (
          /* Results View */
          <div className="space-y-6">
            {/* Analysis Complete Header */}
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-3xl shadow-xl p-8 text-white">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-3xl font-bold mb-2">
                    Analysis Complete ✓
                  </h2>
                  <p className="opacity-90">
                    {new Date(result.createdAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setResult(null);
                    setFrontImage("");
                    setSideImage("");
                    setBackImage("");
                  }}
                  className="px-6 py-3 bg-white text-purple-600 rounded-xl font-semibold hover:bg-opacity-90 transition-all"
                >
                  New Analysis
                </button>
              </div>
            </div>

            {/* Analysis Report Content */}
            <div className="bg-white rounded-3xl shadow-xl p-8">
              <div
                className="prose max-w-none"
                dangerouslySetInnerHTML={{
                  __html: result.analysisMd
                    ?.replace(/\n/g, "<br/>")
                    ?.replace(
                      /## (.+)/g,
                      '<h3 class="text-lg font-semibold mt-6 mb-3 text-gray-800">➤ $1</h3>'
                    )
                    ?.replace(/\*\*(.+?)\*\*/g, '$1')
                    ?.replace(/^# (.+)/gm, '<h2 class="text-xl mb-4 text-gray-800">$1</h2>'),
                }}
              />
            </div>

            {/* Action Button */}
            <div className="flex gap-4">
              <button
                onClick={() => router.push("/plan")}
                className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all"
              >
                Generate Plan Based on This Analysis →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}