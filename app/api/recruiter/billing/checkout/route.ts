import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser(); // validates JWT server-side
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { data: profile } = await supabase
      .from("profiles")
      .select("stripe_customer_id, is_pro")
      .eq("id", user.id)
      .single();

    if (profile?.is_pro) {
      return NextResponse.json({ error: "Already subscribed" }, { status: 400 });
    }

    // Get or create Stripe customer
    let customerId = profile?.stripe_customer_id ?? null;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email!,
        metadata: { supabase_user_id: user.id },
      });
      customerId = customer.id;
      await supabase
        .from("profiles")
        .update({ stripe_customer_id: customerId })
        .eq("id", user.id);
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      payment_method_types: ["card"],
      line_items: [{ price: process.env.STRIPE_PRICE_PRO!, quantity: 1 }],
      success_url: "https://talentryxai.com/recruiter/billing?success=true",
      cancel_url: "https://talentryxai.com/recruiter/billing",
      metadata: { product: "talentryx", user_id: user.id },
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("POST /api/recruiter/billing/checkout:", err);
    return NextResponse.json(
      { error: "Couldn't start upgrade — please try again or contact support." },
      { status: 500 }
    );
  }
}
