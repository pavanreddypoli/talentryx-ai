"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabaseClient";

const SupabaseContext = createContext<any>(null);

export default function Providers({ children }: { children: React.ReactNode }) {
  const [client] = useState(() => createSupabaseBrowserClient());
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    client.auth.getSession().then(({ data }) => {
      setSession(data.session);
    });

    client.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });
  }, [client]);

  return (
    <SupabaseContext.Provider value={{ supabase: client, session }}>
      {children}
    </SupabaseContext.Provider>
  );
}

export function useSupabase() {
  return useContext(SupabaseContext);
}
