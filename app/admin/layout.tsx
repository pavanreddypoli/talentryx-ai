import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Sparkles } from "lucide-react";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: userRecord } = await supabaseAdmin
    .from("users")
    .select("is_admin")
    .eq("email", user.email!)
    .single();

  if (!userRecord?.is_admin) redirect("/");

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-brand-navy border-b border-white/10 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-brand-amber" />
          <span className="font-display font-bold text-white text-lg">Talentryx Admin</span>
        </div>
        <Link
          href="/recruiter/dashboard"
          className="text-sm text-white/60 hover:text-white transition-colors"
        >
          ← Back to app
        </Link>
      </header>
      <main className="max-w-5xl mx-auto px-6 py-8">{children}</main>
    </div>
  );
}
