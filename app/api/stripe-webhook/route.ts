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

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;

    console.log("[stripe-webhook] received event:", event.type, "metadata.product:", session.metadata?.product);

    // Only process Talentryx events — ignore AlgorythmAI/WealthPlanrAI/etc
    if (session.metadata?.product !== "talentryx") {
      console.log("[stripe-webhook] non-talentryx event, ignoring:", session.metadata?.product);
      return NextResponse.json({ received: true });
    }

    // Support both field names: new routes use 'user_id', legacy used 'supabase_user_id'
    const userId = session.metadata?.user_id ?? session.metadata?.supabase_user_id;
    if (userId) {
      console.log("[stripe-webhook] talentryx event, updating user:", userId);
      // Use supabaseAdmin — webhook has no user session, so authenticated-role RLS would deny the UPDATE
      await supabaseAdmin.from("profiles").update({ is_pro: true }).eq("id", userId);
    }
  }

  return NextResponse.json({ received: true });
}
