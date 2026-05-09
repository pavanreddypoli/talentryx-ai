import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(req: Request) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { code } = await req.json();
  if (!code?.trim()) {
    return NextResponse.json({ valid: false, error: "Code required" });
  }

  const { data: discount } = await supabaseAdmin
    .from("discount_codes")
    .select("id, discount_percent, description, active, expires_at, max_uses, times_used")
    .eq("code", code.trim().toUpperCase())
    .single();

  if (!discount || !discount.active) {
    return NextResponse.json({ valid: false, error: "Invalid code" });
  }
  if (discount.expires_at && new Date(discount.expires_at) < new Date()) {
    return NextResponse.json({ valid: false, error: "Code expired" });
  }
  if (discount.max_uses != null && discount.times_used >= discount.max_uses) {
    return NextResponse.json({ valid: false, error: "Code fully used" });
  }

  // DO NOT increment times_used here — deferred to Stripe webhook after successful payment
  return NextResponse.json({
    valid: true,
    discount_percent: discount.discount_percent,
    description: discount.description,
  });
}
