// app/api/me/active-role/route.ts
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(req: Request) {
  try {
    const email = req.headers.get("x-user-email");
    const { role } = await req.json();

    if (!email || !role) {
      return NextResponse.json(
        { error: "Missing email or role" },
        { status: 400 }
      );
    }

    if (!["recruiter", "job_seeker"].includes(role)) {
      return NextResponse.json(
        { error: "Invalid role" },
        { status: 400 }
      );
    }

    await supabaseAdmin
      .from("users")
      .update({ active_role: role })
      .eq("email", email);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("active-role api error:", err);
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}
