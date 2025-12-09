import Stripe from "stripe";
import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabaseAdmin";

// Admin client (service_role)
const supabase = createSupabaseAdminClient();

export const config = {
  api: {
    bodyParser: false,
  },
};

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16",
});

async function buffer(readable: any) {
  const chunks = [];
  for await (const chunk of readable) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

export async function POST(req: Request) {
  const rawBody = await buffer(req.body);
  const sig = req.headers.get("stripe-signature")!;

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    console.error("❌ Webhook signature verification failed:", err.message);
    return NextResponse.json({ error: err.message }, { status: 400 });
  }

  const data = event.data.object as any;

  switch (event.type) {
    case "customer.subscription.created":
    case "customer.subscription.updated":
      await supabase
        .from("profiles")
        .update({
          subscription_status: "pro",
          stripe_subscription_id: data.id,
        })
        .eq("stripe_customer_id", data.customer);
      break;

    case "customer.subscription.deleted":
      await supabase
        .from("profiles")
        .update({
          subscription_status: "free",
          stripe_subscription_id: null,
        })
        .eq("stripe_customer_id", data.customer);
      break;

    case "checkout.session.completed":
      console.log("Checkout completed");
      break;
  }

  return NextResponse.json({ received: true });
}
