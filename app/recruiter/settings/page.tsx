import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { redirect } from "next/navigation";
import SettingsClient from "./SettingsClient";

export default async function SettingsPage() {
  const supabase = await createSupabaseServerClient();
  const { data: authData } = await supabase.auth.getUser();

  if (!authData.user) redirect("/login");

  const { data: userRow } = await supabase
    .from("users")
    .select("full_name, email, active_role")
    .eq("email", authData.user.email!)
    .single();

  return (
    <SettingsClient
      initialFullName={userRow?.full_name ?? ""}
      email={userRow?.email ?? authData.user.email ?? ""}
      activeRole={userRow?.active_role ?? "recruiter"}
    />
  );
}
