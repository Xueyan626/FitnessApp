import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { verifySession } from "@/lib/auth";

const prisma = new PrismaClient();

// POST /api/coach/chat - Chat with AI agent about a report
export async function POST(req: Request) {
  try {
    const session = await verifySession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Check if user is a coach
    const user = await prisma.user.findUnique({
      where: { id: session.uid },
      select: { role: true }
    });

    if (user?.role !== "COACH") {
      return NextResponse.json({ error: "Access denied. Coach role required." }, { status: 403 });
    }

    const { reportId, message, chatHistory } = await req.json();

    if (!reportId || !message) {
      return NextResponse.json({ error: "Report ID and message are required" }, { status: 400 });
    }

    // Get the report
    const report = await prisma.coachReport.findFirst({
      where: { 
        id: reportId,
        coachId: session.uid 
      }
    });

    if (!report) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    if (report.status !== "COMPLETED") {
      return NextResponse.json({ error: "Report analysis not completed yet" }, { status: 400 });
    }

    // Call OpenAI API for chat
    const aiResponse = await chatWithAI(report, message, chatHistory || []);

    return NextResponse.json({ 
      success: true, 
      response: aiResponse 
    });
  } catch (err) {
    console.error("Coach chat API error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

async function chatWithAI(report: any, userMessage: string, chatHistory: Array<{role: string, content: string}>) {
  const geminiApiKey = process.env.GEMINI_API_KEY;
  
  if (!geminiApiKey) {
    throw new Error("Gemini API key not configured");
  }

  // Prepare the system prompt
  const systemPrompt = `You are a professional fitness coach and health expert AI assistant. You have analyzed a student's health report and can answer questions about the analysis.

Report Details:
- Title: ${report.title}
- Student Data: ${JSON.stringify(report.studentData, null, 2)}
- Analysis: ${report.gptAnalysis || "Not available"}
- Risk Analysis: ${report.riskAnalysis || "Not available"}
- Recommendations: ${report.recommendations || "Not available"}

You can help with:
1. Explaining the analysis results in detail
2. Providing additional recommendations
3. Answering questions about health risks
4. Suggesting specific exercises or treatments
5. Clarifying technical terms
6. Discussing follow-up actions

Be professional, helpful, and provide actionable advice based on the analysis.`;

  // Prepare conversation history for Gemini
  const conversationHistory = chatHistory.map(msg => ({
    role: msg.role === "assistant" ? "model" : "user",
    parts: [{ text: msg.content }]
  }));

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiApiKey}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      contents: [
        {
          role: "user",
          parts: [{ text: `${systemPrompt}\n\nUser message: ${userMessage}` }]
        }
      ],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 1000,
      }
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(`Gemini API error: ${errorData.error?.message || response.statusText}`);
  }

  const data = await response.json();
  const content = data.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!content) {
    throw new Error("No response content received from Gemini");
  }

  return content;
}
