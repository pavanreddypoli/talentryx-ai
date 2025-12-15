// app/api/me/roles/route.ts
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET(req: Request) {
  try {
    const email = req.headers.get("x-user-email");

    if (!email) {
      return NextResponse.json(
        { error: "Missing user email" },
        { status: 401 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("users")
      .select("roles, active_role")
      .eq("email", email)
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      roles: data.roles ?? [],
      active_role: data.active_role,
    });
  } catch (err) {
    console.error("roles api error:", err);
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}
