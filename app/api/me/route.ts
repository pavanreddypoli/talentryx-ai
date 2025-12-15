// app/api/me/route.ts
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

/**
 * Returns the active role for the current user
 * Assumes user already exists in `users` table
 */
export async function GET(req: Request) {
  try {
    const email = req.headers.get("x-user-email");

    if (!email) {
      return NextResponse.json(
        { error: "Missing user context" },
        { status: 401 }
      );
    }

    const { data: user, error } = await supabaseAdmin
      .from("users")
      .select("user_type")
      .eq("email", email)
      .single();

    if (error || !user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      user_type: user.user_type ?? "recruiter",
    });
  } catch (err) {
    console.error("me route error:", err);
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}
