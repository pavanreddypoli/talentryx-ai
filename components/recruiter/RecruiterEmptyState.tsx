import Link from "next/link";
import { Sparkles, Plus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

// /recruiter/jobs/new is a 404 until D5 ships
export default function RecruiterEmptyState() {
  return (
    <Card variant="light-gradient" className="py-16">
      <CardContent className="flex flex-col items-center text-center gap-4">
        <div className="flex items-center justify-center h-14 w-14 rounded-full bg-brand-amber/10">
          <Sparkles className="h-7 w-7 text-brand-amber" />
        </div>
        <div>
          <h3 className="font-display text-lg font-semibold text-brand-navy">
            No jobs yet
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            Create your first job posting to start ranking candidates.
          </p>
        </div>
        <Button variant="brand-primary" asChild>
          <Link href="/recruiter/jobs/new">
            <Plus className="h-4 w-4" />
            Create your first job
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
