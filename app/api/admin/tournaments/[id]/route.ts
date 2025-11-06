import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tournament = await prisma.tournament.findUnique({
      where: { id: params.id },
      include: {
        teams: {
          include: {
            captain: { select: { id: true, name: true, email: true } },
            members: {
              include: { user: { select: { id: true, name: true, email: true } } },
            },
          },
          orderBy: { id: "asc" },
        },
        winners: true,
        _count: { select: { teams: true } },
      },
    });

    if (!tournament) return NextResponse.json({ error: "Not found" }, { status: 404 });

    return NextResponse.json(tournament, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Admin tournament detail error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}


