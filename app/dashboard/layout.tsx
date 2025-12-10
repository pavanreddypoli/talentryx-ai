import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { redirect } from "next/navigation";

// Import your existing client component
import DashboardClientLayout from "./layoutClient";

export default async function DashboardLayoutWrapper({ children }) {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();

  // ❗ If NOT logged in → redirect to login page
  if (!data.user) {
    redirect("/login");
  }

  // If logged in, show your full dashboard UI
  return <DashboardClientLayout>{children}</DashboardClientLayout>;
}
