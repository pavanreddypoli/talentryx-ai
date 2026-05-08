"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

type Role = "recruiter" | "job_seeker";

export default function RoleSwitcher() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [activeRole, setActiveRole] = useState<Role | null>(null);
  const [switching, setSwitching] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/me/roles")
      .then((r) => r.json())
      .then((data) => {
        setRoles(data.roles || []);
        setActiveRole(data.active_role ?? null);
      })
      .catch(() => {});
  }, []);

  async function switchRole(role: Role) {
    if (role === activeRole || switching) return;
    setSwitching(true);

    await fetch("/api/me/active-role", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    });

    router.push(role === "job_seeker" ? "/job-seeker/dashboard" : "/dashboard");
  }

  if (!activeRole || roles.length < 2) return null;

  return (
    <div className="flex gap-1 p-1 bg-brand-canvas border border-slate-200 rounded-full w-full">
      {(["recruiter", "job_seeker"] as Role[]).map((r) => (
        <button
          key={r}
          type="button"
          disabled={switching}
          onClick={() => switchRole(r)}
          className={`flex-1 flex items-center justify-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
            r === activeRole
              ? "bg-brand-amber text-brand-navy font-semibold shadow-sm"
              : "text-slate-500 hover:bg-slate-100"
          }`}
        >
          {switching && r !== activeRole ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : null}
          {r === "recruiter" ? "Recruiter" : "Job Seeker"}
        </button>
      ))}
    </div>
  );
}
