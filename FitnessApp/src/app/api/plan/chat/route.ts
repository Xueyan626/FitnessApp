// src/app/api/plan/chat/route.ts
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { verifySession } from "@/lib/auth";

const prisma = new PrismaClient();
const GEMINI_API_KEY = "AIzaSyCJpCeBNOwMkfVVGnoft1AjA72gfWGayAw";

// Updated chat prompt for daily varied diet structure
const CHAT_PROMPT = `You are a friendly health advisor chatting with a user about their personalized health plan.

**Current Plan Structure:**
The diet plan has DIFFERENT meals for each day of the week (monday, tuesday, wednesday, thursday, friday, saturday, sunday).
Each day has: breakfast, lunch, dinner, and snacks arrays.

**Current Plan:**
{{currentPlan}}

**User's Request:**
"{{userMessage}}"

---

**Instructions:**
1. Understand what the user wants to change (add/remove/replace items)
2. If they mention a specific day, only change that day's meals
3. If they don't mention a day, apply changes to ALL days or ask for clarification
4. Maintain TCM principles in all modifications
5. Provide a friendly, conversational response explaining what you changed

**Response Format - CRITICAL:**
RESPONSE: [Your 2-3 sentence friendly reply explaining what you changed]
PLAN: [Complete updated plan JSON with the new daily diet structure]

**Example:**
User says: "Remove oatmeal from Monday breakfast"
RESPONSE: I've removed oatmeal from your Monday breakfast and kept the other items. Your Monday breakfast now has eggs and tea which are great for your constitution!
PLAN: {"diet": {"monday": {"breakfast": [...], "lunch": [...], ...}, "tuesday": {...}, ...}, "exercise": {...}, "summary": "..."}

**Generate your response now:**`;

export async function POST(req: Request) {
  console.log("\n=== PLAN CHAT START ===");

  try {
    // 1. Verify session
    const session = await verifySession();
    if (!session) {
      console.log("❌ No session");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.log("✅ User:", session.uid);

    // 2. Get request data
    const body = await req.json();
    const { planId, message } = body;

    if (!planId || !message) {
      console.log("❌ Missing planId or message");
      return NextResponse.json(
        { error: "planId and message required" },
        { status: 400 }
      );
    }

    console.log("📝 Message:", message);
    console.log("📋 Plan ID:", planId);

    // 3. Get plan
    const plan = await prisma.plan.findUnique({
      where: { id: planId },
    });

    if (!plan) {
      console.log("❌ Plan not found");
      return NextResponse.json({ error: "Plan not found" }, { status: 404 });
    }

    if (plan.userId !== session.uid) {
      console.log("❌ Wrong user");
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    console.log("✅ Plan found");
    console.log("Current Monday breakfast:", plan.content?.diet?.monday?.breakfast);

    // 4. Call Gemini
    console.log("🤖 Calling Gemini...");

    const prompt = CHAT_PROMPT
      .replace("{{currentPlan}}", JSON.stringify(plan.content, null, 2))
      .replace("{{userMessage}}", message);

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 4000,
          },
        }),
      }
    );

    if (!response.ok) {
      const err = await response.json();
      console.error("❌ Gemini error:", err);
      throw new Error(err.error?.message || "Gemini failed");
    }

    console.log("✅ Gemini responded");

    // 5. Parse response
    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

    console.log("📄 AI text length:", text.length);
    console.log("📄 First 300 chars:", text.substring(0, 300));

    // Extract RESPONSE and PLAN
    const responseMatch = text.match(/RESPONSE:\s*(.+?)(?=PLAN:|$)/s);
    const planMatch = text.match(/PLAN:\s*({[\s\S]*})/);

    let aiMessage = "I've updated your plan based on your request!";
    let updatedPlan = plan.content;

    if (responseMatch) {
      aiMessage = responseMatch[1].trim();
      console.log("✅ AI message:", aiMessage);
    } else {
      console.warn("⚠️ No RESPONSE found in AI text");
    }

    if (planMatch) {
      try {
        const jsonText = planMatch[1]
          .trim()
          .replace(/```json\s*/g, "")
          .replace(/```\s*/g, "");
        
        console.log("📝 Parsing JSON (first 200 chars):", jsonText.substring(0, 200));
        updatedPlan = JSON.parse(jsonText);
        console.log("✅ Plan parsed successfully");
        console.log("New Monday breakfast:", updatedPlan?.diet?.monday?.breakfast);
      } catch (e: any) {
        console.error("❌ Failed to parse plan JSON:", e.message);
        console.log("Raw JSON text:", planMatch[1].substring(0, 500));
      }
    } else {
      console.warn("⚠️ No PLAN found in AI response");
    }

    // 6. Update database
    console.log("💾 Updating database...");
    const updated = await prisma.plan.update({
      where: { id: planId },
      data: { content: updatedPlan },
    });

    console.log("✅ Database updated successfully");
    console.log("✅ Stored Monday breakfast:", updated.content?.diet?.monday?.breakfast);
    console.log("=== PLAN CHAT END ===\n");

    return NextResponse.json({
      content: updated.content,
      message: aiMessage,
    });

  } catch (err: any) {
    console.error("\n❌ ERROR:", err.message);
    console.error(err.stack);
    console.log("=== PLAN CHAT END (ERROR) ===\n");

    return NextResponse.json(
      { error: err.message || "Server error" },
      { status: 500 }
    );
  }
}