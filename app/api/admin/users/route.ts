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

    const body = await req.json();
    const { id } = body as { id?: string };
    if (!id) return NextResponse.json({ error: "Missing user id" }, { status: 400 });

    // Prevent deleting self (optional safety)
    if (session.user.id === id) {
      return NextResponse.json({ error: "Cannot delete your own account" }, { status: 400 });
    }

    // Attempt to delete the user. If there are foreign key constraints,
    // the database/prisma will return an error — handle gracefully.
    const deleted = await prisma.user.delete({ where: { id } });
    return NextResponse.json({ success: true, deletedId: deleted.id });
  } catch (error) {
    console.error("DELETE /api/admin/users error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
