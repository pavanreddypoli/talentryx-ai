import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const VALID_ROLES = ["recruiter", "job_seeker"] as const;
type ValidRole = (typeof VALID_ROLES)[number];

export async function POST(req: Request) {
  try {
    const email = req.headers.get("x-user-email");
    if (!email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => null);
    const { role } = body ?? {};

    if (!role || !VALID_ROLES.includes(role as ValidRole)) {
      return NextResponse.json(
        { error: "Invalid role. Must be 'recruiter' or 'job_seeker'" },
        { status: 400 }
      );
    }

    const { data: user, error: userError } = await supabaseAdmin
      .from("users")
      .select("roles")
      .eq("email", email)
      .single();

    if (userError || !user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const currentRoles: string[] = user.roles ?? [];

    if (currentRoles.includes(role)) {
      return NextResponse.json({ error: "Role already exists" }, { status: 400 });
    }

    const newRoles = [...currentRoles, role];

    const { error: updateError } = await supabaseAdmin
      .from("users")
      .update({ roles: newRoles })
      .eq("email", email);

    if (updateError) {
      console.error("add-role update error:", updateError);
      return NextResponse.json({ error: "Failed to update roles" }, { status: 500 });
    }

    return NextResponse.json({ roles: newRoles });
  } catch (err) {
    console.error("add-role error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
