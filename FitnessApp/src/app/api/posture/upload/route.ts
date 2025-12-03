// src/app/api/posture/upload/route.ts
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { verifySession } from "@/lib/auth";

const prisma = new PrismaClient();

// Gemini analysis prompt
const ANALYSIS_PROMPT = `
You are a professional posture analysis expert. Analyze the three posture images provided (front view, side view, and back view) and create a comprehensive assessment report for general users.

Guidelines:
- Use clear, professional language that educated adults can understand
- You may use some professional terminology when necessary, but explain it briefly
- Focus on observation, impact, and recommendations (NO specific exercises or workout plans)
- Be honest but encouraging in your assessment
- Provide realistic timeframes for improvement when relevant

CRITICAL FORMATTING REQUIREMENTS:
- Do NOT include any introductory text like "Here's a postural analysis report based on the images provided."
- Start DIRECTLY with "# Posture Analysis Report"
- Do NOT include any closing disclaimer, note section, or "---" separators at the end
- End with the "Expected Timeline" or "Professional Consultation" section under Summary
- Do NOT include any additional text after the Summary section

Please provide your analysis in the following Markdown format:

 Posture Analysis Report

 Overall Assessment
[Provide a brief professional summary of the overall posture quality. Mention 1-2 positive observations, then highlight the main areas requiring attention. Keep it factual and objective.]

---

* Head Position

Observation:
[Describe the head alignment in clear terms. You may use terms like "forward head posture" or "cervical alignment" but keep explanations accessible. Compare to ideal neutral position.]

Impact:
[Explain the functional and health implications. How does this affect daily activities, comfort, and long-term health? Be specific about potential symptoms like tension headaches, neck stiffness, or reduced range of motion.]

Recommendation:
[Provide general guidance on what needs to be addressed - NOT specific exercises. For example: "Focus on strengthening the deep neck flexors and stretching tight posterior neck muscles" or "Consider ergonomic adjustments to workstation setup." Mention realistic improvement timeline if applicable.]

---

* Shoulder Position

Observation:
[Assess shoulder height, protraction/retraction, and symmetry. Note any elevation, depression, or rotation. Compare left and right sides.]

Impact:
[Discuss implications for upper body function, breathing mechanics, and potential muscle imbalances. Mention how this affects activities like lifting, reaching, or prolonged sitting.]

Recommendation:
[General direction for correction - focus areas rather than specific exercises. Mention what muscle groups need attention. Include expected timeframe for noticeable improvement.]

---

* Spine Alignment

Observation:
[Evaluate the natural curves of the spine - cervical lordosis, thoracic kyphosis, and lumbar lordosis. Note if curves are normal, excessive, or reduced. Assess for any lateral curvature (scoliosis) if visible.]

Impact:
[Explain how spinal alignment affects overall body mechanics, disc health, nerve function, and muscular loading patterns. Discuss potential symptoms and long-term considerations.]

Recommendation:
[Guidance on which spinal regions need attention and what type of interventions would be beneficial. Mention if professional consultation is advisable. Provide realistic timeline for postural corrections.]

---

* Pelvic Alignment

Observation:
[Assess pelvic position - neutral, anterior tilt, or posterior tilt. Note any lateral shift or rotation. Evaluate the relationship between pelvis and spine.]

Impact:
[Discuss how pelvic alignment influences lower back health, hip function, and overall posture chain. Explain effects on gait, standing tolerance, and core stability.]

Recommendation:
[General guidance on pelvic stabilization needs and core muscle balance. Mention which muscle groups typically need strengthening versus stretching. Include improvement timeframe.]

---
* Lower Extremity Alignment

Observation:
[Assess leg positioning from hip to ankle - knee alignment (valgus/varus), weight distribution between legs, foot positioning. Note any rotational components.]

Impact:
[Explain implications for joint health (hips, knees, ankles), gait pattern, and potential for overuse injuries. Discuss effects on balance and functional movement.]

Recommendation:
[General direction for improving lower body alignment. Mention muscle groups requiring attention and any biomechanical considerations. Provide realistic expectations for improvement.]

---

* Foot and Ankle Assessment

Observation:
[Evaluate arch height (normal, high, or flat), foot pronation/supination, ankle alignment, and weight distribution through the feet.]

Impact:
[Discuss how foot structure affects shock absorption, balance, and the kinetic chain up through the body. Mention implications for walking, standing, and overall joint health.]

Recommendation:
[Guidance on foot and ankle support needs. Mention considerations for footwear, potential need for orthotics, and general strengthening priorities. Note improvement timeline.]

---

* Summary and Priority Areas

Key Findings:
[Summarize the 2-3 most important postural issues identified]

Priority Recommendations:
[List the most critical areas to address first,terminal in order of importance]

Expected Timeline:
[Provide a realistic overall timeline: "With consistent attention and appropriate interventions, noticeable improvements can be expected within X-X weeks for acute issues, and X-X months for more established postural patterns."]
`;

export async function POST(req: Request) {
  try {
    const session = await verifySession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { frontUrl, sideUrl, backUrl } = await req.json();

    if (!frontUrl || !sideUrl || !backUrl) {
      return NextResponse.json(
        { error: "Missing required images" },
        { status: 400 }
      );
    }

    // Validate base64 image data
    const isBase64 = (str: string) => {
      try {
        return str.length > 100 && /^[A-Za-z0-9+/=]+$/.test(str);
      } catch {
        return false;
      }
    };

    if (!isBase64(frontUrl) || !isBase64(sideUrl) || !isBase64(backUrl)) {
      return NextResponse.json(
        { error: "Images must be in base64 format" },
        { status: 400 }
      );
    }

    // Call Gemini API for posture analysis
    const geminiApiKey = "AIzaSyCJpCeBNOwMkfVVGnoft1AjA72gfWGayAw";

    console.log("Calling Gemini API for posture analysis...");

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${geminiApiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: ANALYSIS_PROMPT },
                {
                  inline_data: {
                    mime_type: "image/jpeg",
                    data: frontUrl,
                  },
                },
                {
                  inline_data: {
                    mime_type: "image/jpeg",
                    data: sideUrl,
                  },
                },
                {
                  inline_data: {
                    mime_type: "image/jpeg",
                    data: backUrl,
                  },
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 4000,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Gemini API error:", errorData);
      throw new Error(errorData.error?.message || "Gemini API request failed");
    }

    const data = await response.json();
    const analysisMd =
      data.candidates?.[0]?.content?.parts?.[0]?.text ||
      "Analysis could not be generated.";

    console.log("Gemini analysis completed successfully");

    // Save analysis result to database
    const postureAnalysis = await prisma.postureAnalysis.create({
      data: {
        userId: session.uid,
        frontUrl: `data:image/jpeg;base64,${frontUrl.substring(0, 50)}...`, 
        sideUrl: `data:image/jpeg;base64,${sideUrl.substring(0, 50)}...`,
        backUrl: `data:image/jpeg;base64,${backUrl.substring(0, 50)}...`,
        analysisMd,
      },
    });

    return NextResponse.json({
      id: postureAnalysis.id,
      message: "Analysis completed successfully",
    });
  } catch (err: any) {
    console.error("Posture upload error:", err);
    return NextResponse.json(
      { error: err.message || "Server error" },
      { status: 500 }
    );
  }
}