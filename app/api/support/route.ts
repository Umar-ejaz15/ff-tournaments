import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import fs from "fs/promises";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");
const FILE = path.join(DATA_DIR, "support-requests.json");

async function ensureFile() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    try {
      await fs.access(FILE);
    } catch (e) {
      await fs.writeFile(FILE, JSON.stringify([]), "utf8");
    }
  } catch (err) {
    console.error("ensureFile error:", err);
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { subject, message } = body;
    if (!subject || !message) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

    await ensureFile();
    const content = await fs.readFile(FILE, "utf8");
    const list = JSON.parse(content || "[]");

    const entry = {
      id: Date.now().toString(),
      email: session.user.email,
      name: session.user.name || null,
      subject,
      message,
      status: "open",
      createdAt: new Date().toISOString(),
    };

    list.unshift(entry);
    await fs.writeFile(FILE, JSON.stringify(list, null, 2), "utf8");

    return NextResponse.json({ ok: true, entry });
  } catch (error) {
    console.error("Support POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await ensureFile();
    const content = await fs.readFile(FILE, "utf8");
    const list = JSON.parse(content || "[]");

    // Admins see all requests; users see their own
    if (session.user.role === "admin") {
      return NextResponse.json(list);
    }

    const userRequests = list.filter((r: any) => r.email === session.user.email);
    return NextResponse.json(userRequests);
  } catch (error) {
    console.error("Support GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
