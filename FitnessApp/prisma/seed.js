const { PrismaClient, Role, Constitution } = require("@prisma/client");

const prisma = new PrismaClient();
let bcrypt;
try {
  bcrypt = require("bcrypt");
} catch {
  bcrypt = require("bcryptjs");
}

async function main() {
  // 1. Create demo users
  const password = "password123";
  const passwordHash = await bcrypt.hash(password, 10);

  // USER
  const user = await prisma.user.upsert({
    where: { email: "demo@user.com" },
    update: {},
    create: {
      email: "demo@user.com",
      name: "Demo User",
      role: Role.USER,
      heightCm: 170,
      weightKg: 65,
      sex: "FEMALE",
      points: 5000,
      passwordHash,
    },
  });

  // COACH
  const coach = await prisma.user.upsert({
    where: { email: "coach@test.com" },
    update: {},
    create: {
      email: "coach@test.com",
      name: "Coach Zhang",
      role: Role.COACH,
      passwordHash,
    },
  });

  // ADMIN
  await prisma.user.upsert({
    where: { email: "admin@test.com" },
    update: {},
    create: {
      email: "admin@test.com",
      name: "System Admin",
      role: Role.ADMIN,
      passwordHash,
    },
  });

  // 2. create assessment for USER
  const assessment = await prisma.assessment.create({
    data: {
      userId: user.id,
      constitution: Constitution.PHLEGM_DAMPNESS,
      scores: {
        qi: 4,
        yin: 7,
        yang: 3,
        phlegm: 9,
        stasis: 6,
      },
      answers: {"yin_dryMouth": 1, "yin_hotPalms": 3, "qi_shortBreath": 2, "stasis_darkLips": 1, "phlegm_heavyBody": 4, "stasis_fixedPain": 5, "phlegm_greasyTongue": 0, "qi_fatigueAfternoon": 2, "yang_intoleranceCold": 3, "yang_lowEnergyMorning": 1},
      questionnaireVersion: 1,
    },
  });

  // 3. create posture analysis
  const posture = await prisma.postureAnalysis.create({
    data: {
      userId: user.id,
      frontUrl: "https://example.com/front.jpg",
      sideUrl: "https://example.com/side.jpg",
      backUrl: "https://example.com/back.jpg",
      analysisMd: "Seed posture analysis content",
    },
  });

  // 4. create a plan
  const plan = await prisma.plan.create({
    data: {
      userId: user.id,
      content: {
        title: "Seed Plan",
        days: [
          { day: 1, todo: "Walk 20 minutes" },
          { day: 2, todo: "Stretch session" },
        ],
        notesMd: "Focus on posture improvement.",
      },
      assessmentId: assessment.id,
      postureAnalysisId: posture.id,
    },
  });

  // 5. create todo with some completed checklist items
  const todo = await prisma.todo.create({
    data: {
      userId: user.id,
      planId: plan.id,
      title: "Seed Checklist",
      pointsPerCheck: 5,
      items: {
        create: [
          { dayIndex: 1, completed: true, completedAt: new Date() },
          { dayIndex: 2, completed: false },
        ],
      },
    },
    include: { items: true },
  });

  // 6. calculate user earned points
  const earnedPoints =
    todo.items.filter((i) => i.completed).length * todo.pointsPerCheck;

  // 7. Create reward event (earned points)
  // await prisma.reward.create({
  //   data: {
  //     userId: user.id,
  //     points: earnedPoints,
  //     kind: 'TODO_CHECK',
  //     threshold: todo.pointsPerCheck,
  //     note: 'Earned points from completed todo in seed',
  //   },
  // });

  // 8. Create a redeem record
  // await prisma.reward.create({
  //   data: {
  //     userId: user.id,
  //     points: -5, // negative means deducted
  //     kind: 'BADGE_BRONZE',
  //     threshold: 5,
  //     note: 'Seed: example redeem',
  //   },
  // });

  // 9. Create a sample coach report
  const coachReport = await prisma.coachReport.create({
    data: {
      coachId: coach.id,
      studentId: user.id,
      title: "Sample Student Analysis",
      description: "Initial assessment and posture analysis for demo student",
      studentData: {
        assessment: {
          constitution: "BALANCED",
          scores: { yin: 12, yang: 8, qi: 10 },
          answers: [
            true,
            false,
            true,
            false,
            true,
            false,
            true,
            false,
            true,
            false,
          ],
        },
        posture: {
          frontUrl: "https://example.com/front.jpg",
          sideUrl: "https://example.com/side.jpg",
          backUrl: "https://example.com/back.jpg",
          analysis: "Good overall posture with minor forward head posture",
        },
        plan: {
          title: "Weekly Plan",
          days: [
            { day: 1, todo: "Walk 20 minutes" },
            { day: 2, todo: "Stretch session" },
          ],
        },
      },
      status: "COMPLETED",
      gptAnalysis:
        "Based on the assessment, this student shows a balanced constitution with good overall health indicators. The posture analysis reveals minor forward head posture which can be addressed through targeted exercises.",
      riskAnalysis:
        "Low risk profile. Main areas of concern include potential for forward head posture progression if not addressed.",
      recommendations:
        "1. Implement daily neck strengthening exercises\n2. Focus on postural awareness during work\n3. Regular stretching routine for upper body",
      knowledgeLinks: [
        {
          title: "Posture Correction Exercises",
          url: "https://example.com/posture-exercises",
          description: "Comprehensive guide to correcting forward head posture",
        },
        {
          title: "TCM Constitution Guide",
          url: "https://example.com/tcm-constitution",
          description:
            "Understanding TCM constitution types and their implications",
        },
      ],
    },
  });

  console.log(`
✅ Seed Completed!
Login accounts:
User: demo@user.com / password123
Coach: coach@test.com / password123
Admin: admin@test.com / password123

Initial user points: 5000
Earned points event added: +${earnedPoints}
Redeem event added: -5
Total remaining points should be: ${5000 + earnedPoints - 5}

Coach Report created: ${coachReport.id}
`);
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
