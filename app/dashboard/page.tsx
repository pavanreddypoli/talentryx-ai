import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import DashboardClient from "./DashboardClient";

export default async function DashboardPage() {
  // MUST await this
  const supabase = await createSupabaseServerClient();

  // Safely get the session
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Protect the route
  if (!session) {
    redirect("/login");
  }

  // Load the client-side dashboard
  return <DashboardClient />;
}
