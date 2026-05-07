"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function RoleRedirectGuard() {
  const router = useRouter();

  useEffect(() => {
    fetch("/api/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.active_role === "job_seeker") {
          router.replace("/job-seeker/dashboard");
        }
      })
      .catch(() => {
        // server guard already exists
      });
  }, [router]);

  return null;
}
