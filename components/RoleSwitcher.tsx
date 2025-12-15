"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Role = "recruiter" | "job_seeker";

export default function RoleSwitcher() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [activeRole, setActiveRole] = useState<Role | null>(null);
  const router = useRouter();

  useEffect(() => {
    async function loadRoles() {
      const res = await fetch("/api/me/roles");
      const data = await res.json();
      setRoles(data.roles || []);
      setActiveRole(data.active_role);
    }

    loadRoles();
  }, []);

  async function switchRole(role: Role) {
    await fetch("/api/me/active-role", {
      method: "POST",
      body: JSON.stringify({ role }),
    });

    if (role === "job_seeker") {
      router.push("/job-seeker/dashboard");
    } else {
      router.push("/dashboard");
    }
  }

  if (!activeRole || roles.length < 2) return null;

  return (
    <div className="relative">
      <select
        value={activeRole}
        onChange={(e) => switchRole(e.target.value as Role)}
        className="bg-indigo-600 text-white text-sm rounded-md px-3 py-1"
      >
        {roles.map((r) => (
          <option key={r} value={r}>
            {r === "recruiter" ? "Recruiter" : "Job Seeker"}
          </option>
        ))}
      </select>
    </div>
  );
}
