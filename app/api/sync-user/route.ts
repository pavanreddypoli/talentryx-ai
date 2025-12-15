// app/api/sync-user/route.ts
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

/**
 * This endpoint syncs a user + org into Supabase.
 *
 * Call it from the frontend with:
 *
 * await fetch("/api/sync-user", {
 *   method: "POST",
 *   headers: {
 *     "x-user-type": "recruiter" | "job_seeker"
 *   },
 *   body: JSON.stringify({
 *     externalUserId,   // optional
 *     email,
 *     fullName,
 *   }),
 * });
 */
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    const { externalUserId, email, fullName } = body || {};

    if (!email || !fullName) {
      return NextResponse.json(
        { error: "Missing required fields: email, fullName" },
        { status: 400 }
      );
    }

    // 🔹 Determine incoming role (default recruiter)
    const incomingRole =
      req.headers.get("x-user-type") === "job_seeker"
        ? "job_seeker"
        : "recruiter";

    // 1️⃣ CHECK IF USER EXISTS
    const { data: existingUser, error: existingUserError } =
      await supabaseAdmin
        .from("users")
        .select("*")
        .or(
          [
            externalUserId ? `external_user_id.eq.${externalUserId}` : "",
            `email.eq.${email}`,
          ]
            .filter(Boolean)
            .join(",")
        )
        .single();

    if (existingUserError && existingUserError.code !== "PGRST116") {
      console.error("Error checking existing user:", existingUserError);
      return NextResponse.json(
        { error: "User lookup error" },
        { status: 500 }
      );
    }

    let supabaseUserId = existingUser?.id;

    // 2️⃣ CREATE USER IF NOT EXISTING
    if (!existingUser) {
      const { data: newUser, error: createUserError } =
        await supabaseAdmin
          .from("users")
          .insert({
            external_user_id: externalUserId ?? null,
            email,
            full_name: fullName,
            plan: "free",

            // ✅ NEW: role support
            roles: [incomingRole],
            active_role: incomingRole,
          })
          .select()
          .single();

      if (createUserError) {
        console.error("Error creating user:", createUserError);
        return NextResponse.json(
          { error: "User creation error" },
          { status: 500 }
        );
      }

      supabaseUserId = newUser.id;
    }

    // 2.5️⃣ UPDATE ROLES IF USER EXISTS
    if (existingUser) {
      const existingRoles: string[] = existingUser.roles || [];

      // Add role if missing
      if (!existingRoles.includes(incomingRole)) {
        await supabaseAdmin
          .from("users")
          .update({
            roles: [...existingRoles, incomingRole],
            active_role: incomingRole,
          })
          .eq("id", supabaseUserId);
      } else {
        // Just update active role
        await supabaseAdmin
          .from("users")
          .update({
            active_role: incomingRole,
          })
          .eq("id", supabaseUserId);
      }
    }

    // 3️⃣ CHECK FOR ORGANIZATION (UNCHANGED)
    const { data: existingOrg, error: existingOrgError } =
      await supabaseAdmin
        .from("organizations")
        .select("*")
        .eq("owner_id", supabaseUserId)
        .single();

    if (existingOrgError && existingOrgError.code !== "PGRST116") {
      console.error("Error checking existing org:", existingOrgError);
      return NextResponse.json(
        { error: "Organization lookup error" },
        { status: 500 }
      );
    }

    let orgId = existingOrg?.id;

    // 4️⃣ CREATE ORGANIZATION IF NEEDED (UNCHANGED)
    if (!existingOrg) {
      const { data: newOrg, error: orgError } = await supabaseAdmin
        .from("organizations")
        .insert({
          name: `${fullName}'s Organization`,
          owner_id: supabaseUserId,
        })
        .select()
        .single();

      if (orgError) {
        console.error("Error creating org:", orgError);
        return NextResponse.json(
          { error: "Organization creation error" },
          { status: 500 }
        );
      }

      orgId = newOrg.id;

      // 5️⃣ ADD USER TO ORGANIZATION MEMBERS (UNCHANGED)
      const { error: memberError } = await supabaseAdmin
        .from("organization_members")
        .insert({
          organization_id: orgId,
          user_id: supabaseUserId,
          role: "owner",
        });

      if (memberError) {
        console.error("Error creating org member:", memberError);
      }
    }

    return NextResponse.json({
      success: true,
      supabaseUserId,
      orgId,
      activeRole: incomingRole,
    });
  } catch (err) {
    console.error("sync-user route error:", err);
    return NextResponse.json(
      { error: "Unexpected server error" },
      { status: 500 }
    );
  }
}
