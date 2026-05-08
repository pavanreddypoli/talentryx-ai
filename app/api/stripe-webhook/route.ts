import { NextResponse } from "next/server";
import Stripe from "stripe";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

async function buffer(readable: any) {
  const chunks = [];
  for await (const chunk of readable) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

export async function POST(req: Request) {
  const buf = await buffer(req.body);
  const sig = req.headers.get("stripe-signature")!;

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      buf,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    console.error("⚠️ Webhook signature verification failed.", err.message);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  // ── checkout.session.completed ──────────────────────────────────────────────
  if (event.type === "checkout.session.completed") {
    const session = event.data.object;

    console.log("[stripe-webhook] received event:", event.type, "metadata.product:", session.metadata?.product);

    // Only process Talentryx events — ignore AlgorythmAI/WealthPlanrAI/etc
    if (session.metadata?.product !== "talentryx") {
      console.log("[stripe-webhook] non-talentryx event, ignoring:", session.metadata?.product);
      return NextResponse.json({ received: true });
    }

    const userId = session.metadata?.user_id ?? session.metadata?.supabase_user_id;
    // Legacy fallback: old Stripe events without subproduct metadata are assumed to be Pro.
    // If someone subscribed via manual Stripe checkout before this commit, they may
    // incorrectly get is_pro = true. Acceptable edge case for now — log Issue 11 if any occur.
    const subproduct = session.metadata?.subproduct ?? "pro";

    if (userId) {
      console.log("[stripe-webhook] talentryx event, updating user:", userId, "subproduct:", subproduct);
      if (subproduct === "boost") {
        await supabaseAdmin.from("profiles").update({ has_boost: true }).eq("id", userId);
      } else {
        await supabaseAdmin.from("profiles").update({ is_pro: true }).eq("id", userId);
      }
    }
  }

  // ── customer.subscription.deleted ──────────────────────────────────────────
  if (event.type === "customer.subscription.deleted") {
    const subscription = event.data.object;

    console.log("[stripe-webhook] subscription.deleted, product:", subscription.metadata?.product, "subproduct:", subscription.metadata?.subproduct);

    // Only process Talentryx cancellations
    if (subscription.metadata?.product !== "talentryx") {
      console.log("[stripe-webhook] non-talentryx subscription.deleted, ignoring");
      return NextResponse.json({ received: true });
    }

    const userId = subscription.metadata?.user_id;
    const subproduct = subscription.metadata?.subproduct ?? "pro";

    if (userId) {
      console.log("[stripe-webhook] cancellation, reverting user:", userId, "subproduct:", subproduct);
      if (subproduct === "boost") {
        await supabaseAdmin.from("profiles").update({ has_boost: false }).eq("id", userId);
      } else {
        await supabaseAdmin.from("profiles").update({ is_pro: false }).eq("id", userId);
      }
    }
  }

  return NextResponse.json({ received: true });
}
