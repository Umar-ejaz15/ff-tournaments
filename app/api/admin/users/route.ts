import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "admin") return unauthorized();

    const url = new URL(req.url);
    const search = url.searchParams.get("q") || undefined;

    const users = await prisma.user.findMany({
      where: search ? { OR: [{ name: { contains: search } }, { email: { contains: search } }] } : {},
      include: { wallet: true, teams: true },
      orderBy: { createdAt: "desc" },
      take: 200,
    });

    return NextResponse.json(users, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("GET /api/admin/users error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "admin") return unauthorized();

    const body = await req.json();
    const { id, role, disabled } = body as { id?: string; role?: string; disabled?: boolean };
    if (!id) return NextResponse.json({ error: "Missing user id" }, { status: 400 });

    const data: any = {};
    if (role) data.role = role;
    if (typeof disabled === "boolean") data.disabled = disabled;

    const updated = await prisma.user.update({ where: { id }, data });
    return NextResponse.json(updated);
  } catch (error) {
    console.error("PATCH /api/admin/users error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "admin") return unauthorized();

    const url = new URL(req.url);
    const id = url.searchParams.get("id");
    let bodyId: string | undefined;
    try {
      const body = await req.json().catch(() => null);
      if (body && typeof body === "object") bodyId = (body as any).id;
    } catch (e) {
      // ignore
    }

    const userId = id || bodyId;
    if (!userId) return NextResponse.json({ error: "Missing user id" }, { status: 400 });

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    // Find teams where the user is captain so we can clean up related winners and teams
    const teams = await prisma.team.findMany({ where: { captainId: userId }, select: { id: true } });
    const teamIds = teams.map((t: { id: string }) => t.id);

    const ops: any[] = [];

    if (teamIds.length) {
      ops.push(prisma.winner.deleteMany({ where: { teamId: { in: teamIds } } }));
      ops.push(prisma.team.deleteMany({ where: { id: { in: teamIds } } }));
    }

    ops.push(prisma.teamMember.updateMany({ where: { userId }, data: { userId: null } }));
    ops.push(prisma.pushSubscription.deleteMany({ where: { userId } }));
    ops.push(prisma.notification.deleteMany({ where: { userId } }));
    ops.push(prisma.transaction.deleteMany({ where: { userId } }));
    ops.push(prisma.wallet.deleteMany({ where: { userId } }));
    ops.push(prisma.account.deleteMany({ where: { userId } }));
    ops.push(prisma.session.deleteMany({ where: { userId } }));
    ops.push(prisma.supportRequest.deleteMany({ where: { userId } }));

    ops.push(prisma.user.delete({ where: { id: userId } }));

    await prisma.$transaction(ops);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/admin/users error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
