"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { ThemeProvider } from "next-themes";
import { createSupabaseBrowserClient } from "@/lib/supabaseClient";

type SupabaseContextType = {
  supabase: ReturnType<typeof createSupabaseBrowserClient>;
  session: any;
};

const SupabaseContext = createContext<SupabaseContextType | null>(null);

export default function Providers({ children }: { children: React.ReactNode }) {
  const [supabase] = useState(() => createSupabaseBrowserClient());
  const [session, setSession] = useState<any>(null);

  // Load session on mount
  useEffect(() => {
    const loadSession = async () => {
      const { data } = await supabase.auth.getSession();
      setSession(data.session);
    };

    loadSession();

    // Subscribe to auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <SupabaseContext.Provider value={{ supabase, session }}>
        {children}
      </SupabaseContext.Provider>
    </ThemeProvider>
  );
}

export function useSupabase() {
  const context = useContext(SupabaseContext);
  if (!context) {
    throw new Error("useSupabase must be used within Providers");
  }
  return context;
}
