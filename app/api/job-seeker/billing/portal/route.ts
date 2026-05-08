import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("stripe_customer_id")
    .eq("id", user.id)
    .single();

  if (!profile?.stripe_customer_id) {
    return NextResponse.json(
      { error: "No Stripe customer found — no active subscription" },
      { status: 404 }
    );
  }

  try {
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: profile.stripe_customer_id,
      return_url: "https://talentryxai.com/job-seeker/billing",
    });
    return NextResponse.json({ url: portalSession.url });
  } catch (err) {
    console.error("POST /api/job-seeker/billing/portal:", err);
    return NextResponse.json(
      { error: "Couldn't open billing portal — please try again or contact support." },
      { status: 500 }
    );
  }
}
