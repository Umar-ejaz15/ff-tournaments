import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { sendNotificationToUser } from "@/lib/push";

export async function POST(req: Request) {
  try {
    // Extra guard: only enable this route when explicitly allowed via env
    if (process.env.ENABLE_DEV_ROUTES !== "true") {
      return NextResponse.json({ error: "Disabled" }, { status: 403 });
    }

    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    // allow only admin
    if (session.user.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await req.json();
    const { userId, title, body: message, data } = body;

    if (typeof userId !== "string" || userId.trim().length === 0) {
      return NextResponse.json({ error: "Invalid or missing userId" }, { status: 400 });
    }
    const t = typeof title === "string" ? title.trim() : "";
    const m = typeof message === "string" ? message.trim() : "";
    if (!t || !m) return NextResponse.json({ error: "Missing title or message" }, { status: 400 });
    if (t.length > 200) return NextResponse.json({ error: "Title too long" }, { status: 400 });
    if (m.length > 1000) return NextResponse.json({ error: "Message too long" }, { status: 400 });

    await sendNotificationToUser(userId, { title: t, body: m, data });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Dev send notification error", err);
    return NextResponse.json({ error: "Internal" }, { status: 500 });
  }
}
