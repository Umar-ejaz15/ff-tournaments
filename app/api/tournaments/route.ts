import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: Request) {
  try {
    const tournaments = await prisma.tournament.findMany({
      where: { status: "upcoming" },
      include: {
        _count: {
          select: { teams: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(tournaments, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Tournaments fetch error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

