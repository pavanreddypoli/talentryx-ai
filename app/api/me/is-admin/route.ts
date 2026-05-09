import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) return NextResponse.json({ isAdmin: false });

  const { data } = await supabaseAdmin
    .from("users")
    .select("is_admin")
    .eq("email", user.email)
    .single();

  return NextResponse.json({ isAdmin: !!data?.is_admin });
}
