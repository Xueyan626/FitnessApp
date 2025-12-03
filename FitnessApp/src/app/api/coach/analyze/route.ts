import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { verifySession } from "@/lib/auth";

const prisma = new PrismaClient();

// POST /api/coach/analyze - Analyze student report with GPT
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

    const { reportId } = await req.json();

    if (!reportId) {
      return NextResponse.json({ error: "Report ID is required" }, { status: 400 });
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

    // Update status to processing
    await prisma.coachReport.update({
      where: { id: reportId },
      data: { status: "PROCESSING" }
    });

    try {
      // Call GPT API for analysis
      const gptAnalysis = await analyzeWithGPT(report.studentData);
      
      // Update report with GPT analysis
      const updatedReport = await prisma.coachReport.update({
        where: { id: reportId },
        data: {
          status: "COMPLETED",
          gptAnalysis: gptAnalysis.analysis,
          riskAnalysis: gptAnalysis.riskAnalysis,
          recommendations: gptAnalysis.recommendations,
          knowledgeLinks: gptAnalysis.knowledgeLinks
        }
      });

      return NextResponse.json({ 
        success: true, 
        report: updatedReport 
      });
    } catch (gptError) {
      // Update status to failed
      await prisma.coachReport.update({
        where: { id: reportId },
        data: { status: "FAILED" }
      });

      console.error("GPT analysis error:", gptError);
      return NextResponse.json({ 
        error: "GPT analysis failed", 
        details: gptError instanceof Error ? gptError.message : "Unknown error"
      }, { status: 500 });
    }
  } catch (err) {
    console.error("Coach analyze API error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

async function analyzeWithGPT(studentData: any) {
  const geminiApiKey = process.env.GEMINI_API_KEY;
  
  if (!geminiApiKey) {
    throw new Error("Gemini API key not configured");
  }

  // Prepare the prompt for Gemini analysis
  const prompt = `
As a professional fitness coach and health expert, analyze the following student data and provide:

1. **Professional Analysis**: A detailed analysis of the student's constitution, posture, and health status
2. **Risk Assessment**: Identify potential health risks and areas of concern
3. **Recommendations**: Specific, actionable recommendations for the student
4. **Knowledge Links**: Relevant learning resources for the coach

Student Data:
${JSON.stringify(studentData, null, 2)}

Please provide your analysis in the following JSON format:
{
  "analysis": "Detailed professional analysis...",
  "riskAnalysis": "Risk assessment and concerns...",
  "recommendations": "Specific recommendations...",
  "knowledgeLinks": [
    {
      "title": "Resource Title",
      "url": "https://example.com",
      "description": "Brief description"
    }
  ]
}
`;

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiApiKey}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      contents: [
        {
          role: "user",
          parts: [{ text: prompt }]
        }
      ],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 2000,
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
    throw new Error("No analysis content received from Gemini");
  }

  try {
    // Try to parse JSON response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    } else {
      // Fallback: return structured response
      return {
        analysis: content,
        riskAnalysis: "Risk analysis not available",
        recommendations: "Recommendations not available",
        knowledgeLinks: []
      };
    }
  } catch (parseError) {
    // Fallback: return structured response
    return {
      analysis: content,
      riskAnalysis: "Risk analysis not available",
      recommendations: "Recommendations not available",
      knowledgeLinks: []
    };
  }
}
