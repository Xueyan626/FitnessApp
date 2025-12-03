// src/app/api/plan/generate/route.ts
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { verifySession } from "@/lib/auth";

const prisma = new PrismaClient();
const GEMINI_API_KEY = "AIzaSyCJpCeBNOwMkfVVGnoft1AjA72gfWGayAw";

// Detailed plan generation prompt with daily varied diet
const DETAILED_PLAN_PROMPT = `You are an expert health advisor combining Traditional Chinese Medicine (TCM) and modern sports science. Create a highly detailed, personalized weekly health plan.

**User Profile:**
- Name: {{userName}}
- Age: {{userAge}} years old
- Gender: {{userGender}}
- Height: {{userHeight}} cm
- Weight: {{userWeight}} kg
- BMI: {{userBMI}}

**TCM Constitution Type:** {{constitution}}

**Detailed Posture Analysis:**
{{postureAnalysis}}

---

**CRITICAL INSTRUCTIONS:**

1. **Diet Plan Requirements:**
   - Create DIFFERENT meals for EACH DAY of the week (Monday through Sunday)
   - Base recommendations on TCM constitution type:
     * Yang Deficiency: warming foods, avoid cold/raw foods
     * Yin Deficiency: cooling, moistening foods
     * Qi Deficiency: easily digestible, energy-building foods
     * Phlegm-Dampness: light, avoid greasy and dairy
     * Blood Stasis: circulation-promoting foods
     * Balanced: maintain equilibrium
   - Consider user's BMI for caloric needs
   - Vary proteins, vegetables, and cooking methods throughout the week
   - Each day should have 3-4 breakfast items, 3-4 lunch items, 3-4 dinner items, and 3 snacks
   - Include specific food items with TCM properties explained

2. **Exercise Plan Requirements:**
   - Base ALL exercises on the specific posture issues identified above
   - Specify exercise type: aerobic, anaerobic, stretching, or flexibility
   - Target specific muscle groups mentioned in posture analysis
   - Include duration, sets, and reps where applicable
   - Address head position, shoulder alignment, spine curvature, pelvic tilt
   - Progressive difficulty throughout the week
   - Balance strengthening and stretching exercises

3. **Format:** Return ONLY valid JSON, no markdown, no code blocks, no extra text.

**Required JSON Structure:**
{
  "diet": {
    "monday": {
      "breakfast": ["Warm ginger oatmeal with walnuts (warms Yang, tonifies Qi)", "Poached eggs with spinach (builds Blood)", "Ginger tea (promotes circulation)"],
      "lunch": ["Grilled salmon with quinoa (Omega-3 for inflammation)", "Steamed broccoli and carrots", "Warm miso soup"],
      "dinner": ["Baked chicken breast with sweet potato", "Sautéed bok choy with garlic", "Brown rice"],
      "snacks": ["Greek yogurt with honey", "Almonds", "Apple slices"]
    },
    "tuesday": {
      "breakfast": ["Scrambled eggs with mushrooms", "Whole grain toast with avocado", "Green tea"],
      "lunch": ["Chicken stir-fry with mixed vegetables", "Brown rice", "Clear soup"],
      "dinner": ["Steamed fish with ginger", "Roasted asparagus", "Quinoa"],
      "snacks": ["Walnuts", "Pear slices", "Rice crackers"]
    },
    "wednesday": {
      "breakfast": ["Congee with goji berries and dates", "Steamed buns", "Warm soy milk"],
      "lunch": ["Beef and vegetable soup", "Whole grain bread", "Mixed green salad"],
      "dinner": ["Tofu and vegetable curry", "Brown rice", "Cucumber salad"],
      "snacks": ["Dried dates", "Cashews", "Banana"]
    },
    "thursday": {
      "breakfast": ["Vegetable omelet", "Sweet potato", "Herbal tea"],
      "lunch": ["Grilled chicken with roasted vegetables", "Wild rice", "Miso soup"],
      "dinner": ["Pan-seared cod with lemon", "Sautéed green beans", "Quinoa"],
      "snacks": ["Trail mix", "Orange", "Edamame"]
    },
    "friday": {
      "breakfast": ["Whole grain pancakes with berries", "Yogurt", "Chamomile tea"],
      "lunch": ["Turkey and vegetable wrap", "Mixed salad", "Vegetable soup"],
      "dinner": ["Baked salmon with herbs", "Steamed broccoli", "Brown rice"],
      "snacks": ["Almonds", "Grapes", "Rice cakes"]
    },
    "saturday": {
      "breakfast": ["Vegetable fried rice", "Soft-boiled eggs", "Green tea"],
      "lunch": ["Grilled shrimp with vegetables", "Quinoa salad", "Clear soup"],
      "dinner": ["Roasted chicken with root vegetables", "Spinach salad", "Wild rice"],
      "snacks": ["Mixed nuts", "Kiwi", "Seaweed snacks"]
    },
    "sunday": {
      "breakfast": ["Congee with chicken and ginger", "Steamed vegetables", "Warm water with lemon"],
      "lunch": ["Baked fish with Mediterranean vegetables", "Whole grain couscous", "Tomato soup"],
      "dinner": ["Stir-fried tofu with vegetables", "Brown rice noodles", "Cucumber salad"],
      "snacks": ["Dried figs", "Pumpkin seeds", "Apple"]
    },
    "tips": ["Drink warm water throughout the day", "Avoid ice-cold beverages", "Eat regular meals at consistent times", "Chew food thoroughly", "Target daily caloric intake: {{calorieTarget}} kcal"]
  },
  "exercise": {
    "monday": ["Aerobic: Brisk walking 30min (cardiovascular health)", "Posture-specific: Chin tucks 3x15 reps (corrects forward head posture)", "Stretching: Upper trapezius stretch 3x30sec (releases neck tension)", "Core: Dead bug exercise 3x12 reps (stabilizes spine)"],
    "tuesday": ["Aerobic: Swimming 25min (low-impact full body)", "Posture-specific: Scapular wall slides 3x12 reps (corrects rounded shoulders)", "Anaerobic: Resistance band rows 3x15 reps (strengthens mid-back)", "Flexibility: Doorway pec stretch 3x45sec"],
    "wednesday": ["Aerobic: Stationary cycling 30min", "Posture-specific: Pelvic tilts 3x20 reps (corrects anterior pelvic tilt)", "Core: Plank hold 3x45sec", "Stretching: Hip flexor stretch 3x30sec each side"],
    "thursday": ["Aerobic: Light jogging 20min", "Posture-specific: Single-leg balance 3x30sec each leg (improves ankle stability)", "Anaerobic: Bodyweight squats 3x15 reps", "Flexibility: Calf stretches 3x30sec"],
    "friday": ["Mind-body: Yoga for posture 45min", "Posture-specific: Cat-cow stretches 3x10 reps", "Core: Bird-dog exercise 3x12 reps each side"],
    "saturday": ["Aerobic: Hiking or outdoor walk 45min", "Posture-specific: Wall angels 3x12 reps", "Anaerobic: Glute bridges 3x15 reps", "Stretching: Full-body routine 15min"],
    "sunday": ["Active recovery: Tai Chi or Qi Gong 30min", "Flexibility: Yin yoga or deep stretching 20min", "Meditation: 10min mindfulness"],
    "tips": ["Focus on quality over quantity", "Progress gradually: increase intensity by 5-10% per week", "Pay special attention to exercises targeting your posture issues", "Breathe deeply during all exercises"]
  },
  "summary": "This comprehensive plan addresses your {{constitution}} constitution through targeted nutrition and your specific posture imbalances through corrective exercises. The diet plan provides varied, balanced meals throughout the week to maintain interest and ensure nutritional diversity. Expect noticeable improvements in posture and energy within 4-6 weeks with consistent practice."
}

**Generate the complete plan with DIFFERENT meals for each day of the week:**`;

// Helper: Calculate BMI
function calculateBMI(heightCm: number | null, weightKg: number | null): string {
  if (!heightCm || !weightKg) return "Not available";
  const heightM = heightCm / 100;
  const bmi = weightKg / (heightM * heightM);
  return bmi.toFixed(1);
}

// Helper: Estimate calories
function estimateCalories(
  weightKg: number | null,
  heightCm: number | null,
  age: number,
  sex: string | null
): string {
  if (!weightKg || !heightCm) return "2000";

  let bmr: number;
  if (sex?.toLowerCase() === "male") {
    bmr = 10 * weightKg + 6.25 * heightCm - 5 * age + 5;
  } else {
    bmr = 10 * weightKg + 6.25 * heightCm - 5 * age - 161;
  }

  const tdee = bmr * 1.55;
  return Math.round(tdee).toString();
}

// Get user context with latest assessment and posture
async function getUserContext(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      name: true,
      heightCm: true,
      weightKg: true,
      sex: true,
      birthDate: true,
    },
  });

  const latestAssessment = await prisma.assessment.findFirst({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: { id: true, constitution: true, scores: true },
  });

  const latestPosture = await prisma.postureAnalysis.findFirst({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: { id: true, analysisMd: true },
  });

  return { user, assessment: latestAssessment, posture: latestPosture };
}

// Build detailed prompt
function buildDetailedPrompt(context: any): string {
  const { user, assessment, posture } = context;

  const age = user?.birthDate
    ? Math.floor((Date.now() - new Date(user.birthDate).getTime()) / 31536000000)
    : 30;

  const bmi = calculateBMI(user?.heightCm, user?.weightKg);
  const calorieTarget = estimateCalories(user?.weightKg, user?.heightCm, age, user?.sex);

  const postureAnalysis = posture?.analysisMd || "No posture analysis available. Focus on general postural health.";

  return DETAILED_PLAN_PROMPT
    .replace("{{userName}}", user?.name || "User")
    .replace("{{userAge}}", String(age))
    .replace("{{userGender}}", user?.sex || "Not specified")
    .replace("{{userHeight}}", String(user?.heightCm || "Not specified"))
    .replace("{{userWeight}}", String(user?.weightKg || "Not specified"))
    .replace(/{{userBMI}}/g, bmi)
    .replace(/{{constitution}}/g, assessment?.constitution || "BALANCED")
    .replace("{{postureAnalysis}}", postureAnalysis)
    .replace("{{calorieTarget}}", calorieTarget);
}

// Call Gemini API
async function callGeminiAPI(prompt: string): Promise<any> {
  console.log("Calling Gemini API for detailed plan generation...");

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 4096,
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
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

  console.log("Gemini plan generation completed");

  // Extract JSON from response
  const jsonMatch =
    text.match(/```json\s*([\s\S]*?)\s*```/) || 
    text.match(/```\s*([\s\S]*?)\s*```/);
  const cleanText = jsonMatch ? jsonMatch[1] : text;

  try {
    return JSON.parse(cleanText.trim());
  } catch (e) {
    console.error("JSON parse error:", cleanText.substring(0, 500));
    throw new Error("Failed to parse AI response as JSON");
  }
}

// POST endpoint: Generate new plan
export async function POST(req: Request) {
  try {
    console.log("=== Plan Generation Started ===");

    const session = await verifySession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user context
    const context = await getUserContext(session.uid);

    if (!context.assessment) {
      return NextResponse.json(
        { error: "Please complete an assessment first before generating a plan" },
        { status: 400 }
      );
    }

    if (!context.posture) {
      return NextResponse.json(
        { error: "Please complete a posture analysis first for personalized exercise recommendations" },
        { status: 400 }
      );
    }

    // Build prompt and call Gemini API
    const prompt = buildDetailedPrompt(context);
    const planContent = await callGeminiAPI(prompt);

    // Save plan to database
    const plan = await prisma.plan.create({
      data: {
        userId: session.uid,
        content: planContent,
        assessmentId: context.assessment.id,
        postureAnalysisId: context.posture.id,
      },
    });

    console.log(`Plan ${plan.id} created successfully for user ${session.uid}`);

    return NextResponse.json({
      id: plan.id,
      content: plan.content,
      createdAt: plan.createdAt,
      message: "Detailed personalized plan generated successfully",
    });
  } catch (err: any) {
    console.error("Plan generation error:", err);
    return NextResponse.json(
      { error: err.message || "Server error" },
      { status: 500 }
    );
  }
}