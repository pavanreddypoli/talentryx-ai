import Link from "next/link";
import { Briefcase, User } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  type: "recruiter" | "job-seeker";
  className?: string;
};

const labels = {
  recruiter: { text: "Recruiters", href: "/recruiter", Icon: Briefcase },
  "job-seeker": { text: "Job seekers", href: "/job-seeker", Icon: User },
};

export default function PersonaLink({ type, className }: Props) {
  const { text, href, Icon } = labels[type];
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center gap-1 italic hover:underline decoration-1 underline-offset-2 transition-colors",
        className
      )}
    >
      <Icon className="h-3 w-3" />
      {text}
    </Link>
  );
}
