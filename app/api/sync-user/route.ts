import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { currentUser } from "@clerk/nextjs";

export async function POST() {
  const user = await currentUser();

  if (!user) {
    return NextResponse.json({ error: "No user" }, { status: 401 });
  }

  // 1️⃣ CHECK IF USER EXISTS IN SUPABASE
  const { data: existingUser } = await supabaseAdmin
    .from("users")
    .select("*")
    .eq("clerk_user_id", user.id)
    .single();

  let supabaseUserId = existingUser?.id;

  // 2️⃣ CREATE USER IF NOT EXISTING
  if (!existingUser) {
    const { data: newUser, error } = await supabaseAdmin
      .from("users")
      .insert({
        clerk_user_id: user.id,
        email: user.emailAddresses[0].emailAddress,
        full_name: user.fullName,
        plan: "free",
      })
      .select()
      .single();

    if (error) {
      console.error(error);
      return NextResponse.json({ error: "User creation error" }, { status: 500 });
    }

    supabaseUserId = newUser.id;
  }

  // 3️⃣ CHECK FOR ORGANIZATION
  const { data: existingOrg } = await supabaseAdmin
    .from("organizations")
    .select("*")
    .eq("owner_id", supabaseUserId)
    .single();

  let orgId = existingOrg?.id;

  // 4️⃣ CREATE ORGANIZATION IF NEEDED
  if (!existingOrg) {
    const { data: newOrg, error: orgError } = await supabaseAdmin
      .from("organizations")
      .insert({
        name: `${user.fullName}'s Organization`,
        owner_id: supabaseUserId,
      })
      .select()
      .single();

    if (orgError) {
      console.error(orgError);
      return NextResponse.json({ error: "Organization creation error" }, { status: 500 });
    }

    orgId = newOrg.id;

    // 5️⃣ ADD USER TO ORGANIZATION MEMBERS
    await supabaseAdmin.from("organization_members").insert({
      organization_id: orgId,
      user_id: supabaseUserId,
      role: "owner",
    });
  }

  return NextResponse.json({
    success: true,
    supabaseUserId,
    orgId,
  });
}
