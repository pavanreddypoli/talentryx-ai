import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { redirect } from "next/navigation";

// This imports the FULL client-side dashboard layout (sidebar + mobile menu)
import DashboardClientLayout from "./layoutClient";

export default async function DashboardLayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();

  // 🚫 Not logged in? Go to login page.
  if (!data.user) {
    redirect("/login");
  }

  // ✔ Logged in → Render the full client UI
  return <DashboardClientLayout>{children}</DashboardClientLayout>;
}
