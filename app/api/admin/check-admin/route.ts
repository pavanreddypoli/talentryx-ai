import { NextResponse } from "next/server";

// Stub endpoint — prevents 404 polling noise from any client-side admin checks.
export async function GET() {
  return NextResponse.json({ isAdmin: false });
}
