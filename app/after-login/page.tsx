"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AfterLogin() {
  const router = useRouter();

  useEffect(() => {
    async function sync() {
      await fetch("/api/sync-user", { method: "POST" });
      router.push("/dashboard");
    }

    sync();
  }, []);

  return (
    <div className="flex items-center justify-center h-screen text-xl">
      Setting up your account...
    </div>
  );
}
