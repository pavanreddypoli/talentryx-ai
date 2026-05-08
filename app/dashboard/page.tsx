import { redirect } from "next/navigation";

// /dashboard now redirects to the recruiter dashboard.
// The layout (layout.tsx) still runs its auth + role guard first,
// so unauthenticated users and job_seekers never reach this redirect.
export default function DashboardPage() {
  redirect("/recruiter/dashboard");
}
