import { NextResponse } from "next/server";

// This route is disabled - payments are now manual with proof upload
export async function POST(req: Request) {
  return NextResponse.json(
    { error: "Automatic payment verification is disabled. Please use manual payment with proof upload." },
    { status: 410 } // 410 Gone - indicates the resource is no longer available
  );
}
