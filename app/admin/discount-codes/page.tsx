import { supabaseAdmin } from "@/lib/supabaseAdmin";
import AdminDiscountCodesClient from "./AdminDiscountCodesClient";

export default async function AdminDiscountCodesPage() {
  const { data: codes } = await supabaseAdmin
    .from("discount_codes")
    .select("*")
    .order("created_at", { ascending: false });

  return <AdminDiscountCodesClient initialCodes={codes ?? []} />;
}
