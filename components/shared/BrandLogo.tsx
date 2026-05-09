import Link from "next/link";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  href?: string;
  className?: string;
};

export default function BrandLogo({ href = "/", className }: Props) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center gap-2 hover:opacity-80 transition-opacity",
        className
      )}
    >
      <Sparkles className="h-4 w-4 text-brand-amber" />
      <span className="font-display font-bold text-lg">Talentryx AI</span>
    </Link>
  );
}
