import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getToken } from "next-auth/jwt";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    // Robust param extraction for dev/turbopack where params can be undefined
    const url = new URL(request.url);
    const pathParts = url.pathname.split("/").filter(Boolean);
    const fallbackId = pathParts[pathParts.length - 1];
    const { id: routeParamId } = await context.params;
    const id = routeParamId ?? fallbackId;

    if (!id || typeof id !== "string") {
      return NextResponse.json({ error: "Tournament id missing" }, { status: 400 });
    }
    const tournamentBase = await prisma.tournament.findUnique({
      where: { id },
      include: { _count: { select: { teams: true } }, winners: true },
    });

    if (!tournamentBase) {
      return NextResponse.json({ error: "Tournament not found" }, { status: 404 });
    }

    const teams = await prisma.team.findMany({
      where: { tournamentId: id },
      orderBy: { id: "asc" },
      include: {
        members: true,
      },
    });

    // Get user id from NextAuth JWT token (works for `session.strategy = 'jwt'`)
    let userId: string | null = null;
    try {
      const token = (await getToken({ req: request as any, secret: process.env.NEXTAUTH_SECRET })) as any;
      // Our `jwt` callback attaches `id` to the token
      userId = typeof token?.id === "string" ? token.id : null;
    } catch (e) {
      userId = null;
    }

    // Check if user is a participant
    let isParticipant = false;
    if (userId) {
      isParticipant = teams.some(team => team.members.some(member => member.userId === userId));
    }

    const payload = {
      id: tournamentBase.id,
      title: tournamentBase.title,
      mode: tournamentBase.mode,
      gameType: tournamentBase.gameType,
      entryFee: tournamentBase.entryFee,
      prizePool: tournamentBase.prizePool,
      description: tournamentBase.description,
      startTime: tournamentBase.startTime,
      maxParticipants: tournamentBase.maxParticipants,
      status: tournamentBase.status,
      createdAt: tournamentBase.createdAt,
      isOpen: tournamentBase.isOpen,
      lobbyCode: isParticipant ? (tournamentBase as any).lobbyCode ?? null : null,
      lobbyPassword: isParticipant ? (tournamentBase as any).lobbyPassword ?? null : null,
      isParticipant,
      _count: tournamentBase._count,
      winners: tournamentBase.winners,
      teams: teams.map((t) => ({
        id: t.id,
        name: t.name,
        captainId: t.captainId,
        tournamentId: t.tournamentId,
        members: t.members.map((m) => ({
          id: m.id,
          userId: m.userId,
          role: m.role,
          playerName: m.playerName,
          phone: m.phone,
          gameId: m.gameId,
          email: m.email,
        })),
      })),
    };

    return NextResponse.json(payload, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Tournament fetch error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}


