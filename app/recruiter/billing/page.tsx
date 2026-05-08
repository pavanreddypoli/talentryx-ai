import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { redirect } from "next/navigation";
import BillingClient from "./BillingClient";

type Props = {
  searchParams: Promise<{ success?: string }>;
};

export default async function BillingPage({ searchParams }: Props) {
  const supabase = await createSupabaseServerClient();
  const { data: authData } = await supabase.auth.getUser();

  if (!authData.user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_pro, stripe_customer_id")
    .eq("id", authData.user.id)
    .single();

  const { success } = await searchParams;

  return (
    <BillingClient
      isPro={profile?.is_pro ?? false}
      hasCustomer={!!profile?.stripe_customer_id}
      showSuccess={success === "true"}
    />
  );
}
