import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";

// Update support request (status, admin response)
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only admins can update support requests
    if (session.user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();
    const { status, adminResponse } = body;

    // Check if request exists
    const existingRequest = await prisma.supportRequest.findUnique({
      where: { id },
    });

    if (!existingRequest) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    // Build update data
    const updateData: any = {
      updatedBy: session.user.email || null,
    };

    if (status) {
      updateData.status = status;
    }

    if (adminResponse !== undefined) {
      updateData.adminResponse = adminResponse;
    }

    // Update the request
    const updatedRequest = await prisma.supportRequest.update({
      where: { id },
      data: updateData,
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
      request: {
        id: updatedRequest.id,
        subject: updatedRequest.subject,
        category: updatedRequest.category,
        priority: updatedRequest.priority,
        message: updatedRequest.message,
        status: updatedRequest.status,
        email: updatedRequest.user.email,
        name: updatedRequest.user.name,
        adminResponse: updatedRequest.adminResponse,
        createdAt: updatedRequest.createdAt.toISOString(),
        updatedAt: updatedRequest.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("Support PATCH error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

