// app/api/admin/tournaments/toggle/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { id, isOpen } = await req.json();

    if (!id) {
      return NextResponse.json({ error: "Tournament ID missing" }, { status: 400 });
    }

    const updated = await prisma.tournament.update({
      where: { id },
      data: { isOpen },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("Toggle tournament error:", error);
    return NextResponse.json(
      { error: error.message || "Server error" },
      { status: 500 }
    );
  }
}
