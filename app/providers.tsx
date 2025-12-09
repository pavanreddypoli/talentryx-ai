"use client";

import { SessionContextProvider } from "@supabase/auth-helpers-react";
import { createSupabaseBrowserClient } from "@/lib/supabaseClient";

export default function Providers({ children }: { children: React.ReactNode }) {
  const supabase = createSupabaseBrowserClient();

  return (
    <SessionContextProvider supabaseClient={supabase}>
      {children}
    </SessionContextProvider>
  );
}
