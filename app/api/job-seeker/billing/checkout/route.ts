import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { data: profile } = await supabase
      .from("profiles")
      .select("stripe_customer_id, has_boost")
      .eq("id", user.id)
      .single();

    if (profile?.has_boost) {
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
      line_items: [{ price: process.env.STRIPE_PRICE_BOOST!, quantity: 1 }],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/job-seeker/billing?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/job-seeker/billing`,
      metadata: { product: "talentryx", subproduct: "boost", user_id: user.id },
      subscription_data: {
        metadata: { product: "talentryx", subproduct: "boost", user_id: user.id },
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("POST /api/job-seeker/billing/checkout:", err);
    return NextResponse.json(
      { error: "Couldn't start upgrade — please try again or contact support." },
      { status: 500 }
    );
  }
}
