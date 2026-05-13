import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: Request) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser(); // validates JWT server-side
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json().catch(() => ({}));
    const discountCode: string | null = body.discount_code?.trim().toUpperCase() ?? null;

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

    // Server-side re-validation — never trust the client alone
    let validatedCoupon: string | null = null;
    if (discountCode) {
      const { data: discount } = await supabaseAdmin
        .from("discount_codes")
        .select("active, expires_at, max_uses, times_used")
        .eq("code", discountCode)
        .single();
      const isValid =
        discount?.active &&
        (!discount.expires_at || new Date(discount.expires_at) >= new Date()) &&
        (discount.max_uses == null || discount.times_used < discount.max_uses);
      if (isValid) validatedCoupon = discountCode;
    }

    const sessionParams = (withCoupon: boolean): Stripe.Checkout.SessionCreateParams => ({
      mode: "subscription",
      customer: customerId!,
      payment_method_types: ["card"],
      line_items: [{ price: process.env.STRIPE_PRICE_PRO!, quantity: 1 }],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/recruiter/billing?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/recruiter/billing`,
      metadata: { product: "talentryx", subproduct: "pro", user_id: user.id },
      subscription_data: {
        metadata: { product: "talentryx", subproduct: "pro", user_id: user.id },
      },
      ...(withCoupon && validatedCoupon ? { discounts: [{ coupon: validatedCoupon }] } : {}),
    });

    let session: Stripe.Checkout.Session;
    try {
      session = await stripe.checkout.sessions.create(sessionParams(true));
    } catch (stripeErr: unknown) {
      // If Stripe rejects the coupon (not found in Stripe dashboard), retry without it
      const code = (stripeErr as { code?: string })?.code;
      if (validatedCoupon && (code === "resource_missing" || code === "coupon_not_found")) {
        session = await stripe.checkout.sessions.create(sessionParams(false));
      } else {
        throw stripeErr;
      }
    }

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("POST /api/recruiter/billing/checkout:", err);
    return NextResponse.json(
      { error: "Couldn't start upgrade — please try again or contact support." },
      { status: 500 }
    );
  }
}
