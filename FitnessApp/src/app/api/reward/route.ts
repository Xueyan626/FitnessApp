// src/app/api/reward/route.ts
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { verifySession } from "@/lib/auth"; 

const prisma = new PrismaClient();

export async function GET() {
  try {
    const session = await verifySession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await prisma.user.findUnique({
      where: { id: session.uid },
      select: { 
        points: true,
        bronzeBadges: true,
        silverBadges: true,
        goldBadges: true
      },
    });

    return NextResponse.json({
      points: user?.points ?? 0,
      bronzeBadges: user?.bronzeBadges ?? 0,
      silverBadges: user?.silverBadges ?? 0,
      goldBadges: user?.goldBadges ?? 0,
    });
  } catch (err) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await verifySession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { kind } = await req.json();
    
    if (!kind) {
      return NextResponse.json({ error: "Missing redeem kind" }, { status: 400 });
    }

    const costMap: Record<string, number> = {
      "Bronze Badge": 100,
      "Silver Badge": 200,
      "Gold Badge": 500,
    };

    const cost = costMap[kind];
    if (!cost) return NextResponse.json({ error: "Invalid reward type" }, { status: 400 });

    const user = await prisma.user.findUnique({ where: { id: session.uid } });
    const currentPoints = user?.points ?? 0;

    if (currentPoints < cost) {
      return NextResponse.json({ error: "Insufficient points" }, { status: 400 });
    }

    // Update user points and badge count
    const updateData: any = { points: { decrement: cost } };
    
    if (kind === "Bronze Badge") {
      updateData.bronzeBadges = { increment: 1 };
    } else if (kind === "Silver Badge") {
      updateData.silverBadges = { increment: 1 };
    } else if (kind === "Gold Badge") {
      updateData.goldBadges = { increment: 1 };
    }

    await prisma.user.update({
      where: { id: session.uid },
      data: updateData,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Reward API error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}