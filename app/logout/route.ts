import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { redirect } from "next/navigation";

export async function POST() {
  const supabase = await createSupabaseServerClient();

  // Clear the session
  await supabase.auth.signOut();

  // Redirect to login page
  redirect("/login");
}
