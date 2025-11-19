import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

const DATA_FILE = path.join(process.cwd(), "data", "push-subscriptions.json");

async function readSubs() {
  try {
    const raw = await fs.readFile(DATA_FILE, "utf8");
    return JSON.parse(raw || "[]");
  } catch (err: any) {
    if (err.code === "ENOENT") return [];
    throw err;
  }
}

async function writeSubs(subs: any[]) {
  await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
  await fs.writeFile(DATA_FILE, JSON.stringify(subs, null, 2), "utf8");
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const subscription = body.subscription ?? body;

    if (!subscription || !subscription.endpoint) {
      return NextResponse.json({ error: "Invalid subscription" }, { status: 400 });
    }

    const subs = await readSubs();
    const exists = subs.find((s: any) => s?.subscription?.endpoint === subscription.endpoint || s?.endpoint === subscription.endpoint);
    if (!exists) {
      subs.push({ subscription, createdAt: new Date().toISOString() });
      await writeSubs(subs);
    }

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    console.error("❌ Subscribe error:", error);
    return NextResponse.json({ error: "Failed to subscribe" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const body = await req.json();
    const endpoint = body.endpoint ?? body.subscription?.endpoint;
    if (!endpoint) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

    const subs = await readSubs();
    const filtered = subs.filter((s: any) => {
      const ep = s?.subscription?.endpoint ?? s?.endpoint;
      return ep !== endpoint;
    });

    await writeSubs(filtered);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("❌ Unsubscribe error:", error);
    return NextResponse.json({ error: "Failed to unsubscribe" }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";
