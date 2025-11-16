import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { subject, category, priority, message } = body;
    
    if (!subject || !category || !priority || !message) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const entry = await prisma.supportRequest.create({
      data: {
        userId: session.user.id,
        subject,
        category,
        priority,
        message,
        status: "open",
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({
      ok: true,
      entry: {
        id: entry.id,
        subject: entry.subject,
        category: entry.category,
        priority: entry.priority,
        message: entry.message,
        status: entry.status,
        email: entry.user.email,
        name: entry.user.name,
        createdAt: entry.createdAt.toISOString(),
        updatedAt: entry.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("Support POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Admins see all requests; users see their own
    const where = session.user.role === "admin" ? {} : { userId: session.user.id };

    const requests = await prisma.supportRequest.findMany({
      where,
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const formattedRequests = requests.map((req) => ({
      id: req.id,
      subject: req.subject,
      category: req.category,
      priority: req.priority,
      message: req.message,
      status: req.status,
      email: req.user.email,
      name: req.user.name,
      adminResponse: req.adminResponse,
      createdAt: req.createdAt.toISOString(),
      updatedAt: req.updatedAt.toISOString(),
    }));

    return NextResponse.json(formattedRequests);
  } catch (error) {
    console.error("Support GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
