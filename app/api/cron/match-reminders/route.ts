import { NextResponse } from "next/server";

export async function GET() {
  // Stub route used by type generation; no-op in development.
  return NextResponse.json({ ok: true, message: "stub" });
}
