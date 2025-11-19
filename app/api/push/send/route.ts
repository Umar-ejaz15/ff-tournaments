import fs from "fs/promises";
import path from "path";
import webpush from "web-push";
import { NextResponse } from "next/server";

const DATA_FILE = path.join(process.cwd(), "data", "push-subscriptions.json");

function initVapid() {
  try {
    const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || process.env.VAPID_PUBLIC_KEY;
    const privateKey = process.env.VAPID_PRIVATE_KEY;
    const email = process.env.VAPID_EMAIL || "mailto:admin@example.com";
    if (!publicKey || !privateKey) {
      console.warn("VAPID keys not configured. Set NEXT_PUBLIC_VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY in .env");
      return false;
    }
    webpush.setVapidDetails(email, publicKey, privateKey);
    return true;
  } catch (err) {
    console.error("❌ Failed to init VAPID", err);
    return false;
  }
}

async function readSubs() {
  try {
    const raw = await fs.readFile(DATA_FILE, "utf8");
    return JSON.parse(raw || "[]");
  } catch (err: any) {
    if (err.code === "ENOENT") return [];
    throw err;
  }
}

export async function POST(req: Request) {
  try {
    const can = initVapid();
    if (!can) return NextResponse.json({ error: "VAPID keys not configured" }, { status: 500 });

    const body = await req.json();
    const title = body.title || "ZP Battle Zone";
    const message = body.message || "You have a new notification";
    const url = body.url || "/";

    const payload = JSON.stringify({ title, body: message, url });

    const subs = await readSubs();
    const results: any[] = [];

    for (const item of subs) {
      const sub = item.subscription ?? item;
      try {
        await webpush.sendNotification(sub, payload);
        results.push({ endpoint: sub.endpoint, ok: true });
      } catch (err: any) {
        console.error("⚠️ Failed to send to", sub?.endpoint, err?.statusCode ?? err?.message ?? err);
        results.push({ endpoint: sub?.endpoint, ok: false, error: String(err) });
      }
    }

    return NextResponse.json({ results });
  } catch (error) {
    console.error("❌ Send push error:", error);
    return NextResponse.json({ error: "Failed to send notifications" }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";
