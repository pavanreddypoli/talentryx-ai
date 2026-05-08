import Link from "next/link";
import { Sparkles, ClipboardList, Upload, BarChart3, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const STEPS = [
  { number: 1, icon: ClipboardList, title: "Create a job",         description: "Paste the JD, set title and location" },
  { number: 2, icon: Upload,        title: "Upload candidates",     description: "Drag and drop dozens of resumes at once" },
  { number: 3, icon: BarChart3,     title: "See ranked candidates", description: "Sorted by match score, shortlist your favorites" },
] as const;

// /recruiter/jobs/new is a 404 until D5 ships
export default function RecruiterEmptyState() {
  return (
    <Card variant="light-gradient" className="py-10 px-2">
      <CardContent className="flex flex-col items-center text-center gap-8">
        <div className="flex flex-col items-center gap-2">
          <div className="flex items-center justify-center h-12 w-12 rounded-full bg-brand-amber/10">
            <Sparkles className="h-6 w-6 text-brand-amber" />
          </div>
          <h3 className="font-display text-xl font-bold text-brand-navy">
            Get started in 3 steps
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-2xl">
          {STEPS.map((step) => {
            const Icon = step.icon;
            return (
              <div
                key={step.number}
                className="rounded-2xl border border-slate-200 bg-white p-4 hover:shadow-md transition-shadow text-left"
              >
                <div className="flex items-center gap-3 mb-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-amber text-brand-navy text-xs font-bold shrink-0">
                    {step.number}
                  </span>
                  <Icon className="h-5 w-5 text-brand-amber" />
                </div>
                <p className="font-semibold text-slate-800 text-sm">{step.title}</p>
                <p className="mt-1 text-xs text-slate-500">{step.description}</p>
              </div>
            );
          })}
        </div>

        <Button variant="brand-primary" asChild>
          <Link href="/recruiter/jobs/new">
            Create your first job
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
