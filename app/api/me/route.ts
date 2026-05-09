// app/api/me/route.ts
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

    const { data: user, error } = await supabaseAdmin
      .from("users")
      .select("active_role, is_admin, roles")
      .eq("email", email)
      .single();

    // PGRST116 = "no rows returned" — orphaned auth user with no public row.
    // Self-heal: create the missing row with safe defaults so the user can proceed.
    if (error?.code === "PGRST116" || (!error && !user)) {
      const { data: healed, error: healError } = await supabaseAdmin
        .from("users")
        .insert({
          email,
          full_name: email.split("@")[0],
          active_role: "recruiter",
          roles: ["recruiter"],
          plan: "free",
        })
        .select("active_role, is_admin, roles")
        .single();

      if (healError) {
        console.error("api/me self-heal error:", healError);
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      return NextResponse.json({
        active_role: healed?.active_role ?? "recruiter",
        is_admin: healed?.is_admin ?? false,
        roles: healed?.roles ?? ["recruiter"],
      });
    }

    if (error) {
      console.error("api/me error:", error);
      return NextResponse.json({ error: "Server error" }, { status: 500 });
    }

    return NextResponse.json({
      active_role: user.active_role ?? "recruiter",
      is_admin: user.is_admin ?? false,
      roles: user.roles ?? [user.active_role ?? "recruiter"],
    });
  } catch (err) {
    console.error("api/me error:", err);
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}

