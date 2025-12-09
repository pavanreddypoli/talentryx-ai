// app/page.tsx
import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col">
      {/* Top Nav */}
      <header className="w-full border-b bg-white">
        <div className="mx-auto max-w-6xl flex items-center justify-between px-4 py-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-slate-900" />
            <span className="font-semibold text-lg tracking-tight">
              TalentRank AI
            </span>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm text-slate-600">
            <a href="#features" className="hover:text-slate-900">
              Features
            </a>
            <a href="#how-it-works" className="hover:text-slate-900">
              How it works
            </a>
            <a href="#pricing" className="hover:text-slate-900">
              Pricing
            </a>
          </nav>
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="text-sm text-slate-700 hover:text-slate-900"
            >
              Log in
            </Link>
            <Link
              href="/dashboard"
              className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
            >
              Get started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="flex-1 bg-gradient-to-b from-slate-50 to-white">
        <div className="mx-auto max-w-6xl px-4 py-16 lg:py-24 grid gap-10 lg:grid-cols-2 items-center">
          <div>
            <p className="mb-3 text-xs font-semibold tracking-wide text-slate-500 uppercase">
              For high-volume recruiting teams
            </p>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-slate-900">
              Let AI pre-screen hundreds of resumes in minutes.
            </h1>
            <p className="mt-4 text-base md:text-lg text-slate-600 max-w-xl">
              TalentRank AI ingests your job description and bulk resumes, then
              ranks candidates by true role fit—so your team can focus on
              interviews, not manual filtering.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link
                href="/dashboard"
                className="rounded-md bg-slate-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-slate-800"
              >
                Start ranking resumes
              </Link>
              <span className="text-xs text-slate-500">
                No credit card required • Built for enterprise HR
              </span>
            </div>
            <div className="mt-8 flex flex-col gap-2 text-sm text-slate-500">
              <span>✓ Bulk upload PDF/DOCX resumes</span>
              <span>✓ AI-based relevance scoring & ranking</span>
              <span>✓ Exportable shortlists for your ATS</span>
            </div>
          </div>

          {/* Right side - simple mock dashboard */}
          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-800">
                Sample Ranking View
              </h2>
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                AI-generated
              </span>
            </div>
            <div className="space-y-3">
              {["Senior Data Engineer", "Product Marketing Manager", "HRBP Lead"].map(
                (role, idx) => (
                  <div
                    key={role}
                    className="rounded-xl border bg-slate-50 px-4 py-3 flex items-center justify-between"
                  >
                    <div>
                      <p className="text-xs uppercase tracking-wide text-slate-500">
                        Top candidate for
                      </p>
                      <p className="text-sm font-semibold text-slate-800">
                        {role}
                      </p>
                      <p className="text-xs text-slate-500">
                        7+ years experience • Strong skill match • Clear career progression
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-500">Match score</p>
                      <p className="text-lg font-semibold text-slate-800">
                        {90 - idx * 6}%
                      </p>
                    </div>
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section
        id="features"
        className="border-t bg-white py-12 md:py-16"
      >
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-2xl font-semibold text-slate-900">
            Built for modern recruiting at scale
          </h2>
          <p className="mt-2 text-sm text-slate-600 max-w-2xl">
            Designed for in-house talent teams and agencies hiring across hundreds of roles per year.
          </p>
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            <div className="rounded-xl border bg-slate-50 p-4">
              <h3 className="text-sm font-semibold text-slate-900">
                Bulk resume intake
              </h3>
              <p className="mt-2 text-xs text-slate-600">
                Upload hundreds of PDF/DOCX resumes at once. No manual parsing or copy-pasting.
              </p>
            </div>
            <div className="rounded-xl border bg-slate-50 p-4">
              <h3 className="text-sm font-semibold text-slate-900">
                AI-powered ranking
              </h3>
              <p className="mt-2 text-xs text-slate-600">
                Semantic matching based on skills, experience, and role context—not just keyword counts.
              </p>
            </div>
            <div className="rounded-xl border bg-slate-50 p-4">
              <h3 className="text-sm font-semibold text-slate-900">
                ATS-friendly exports
              </h3>
              <p className="mt-2 text-xs text-slate-600">
                Export shortlists to CSV or your ATS so your existing hiring workflows stay intact.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section
        id="pricing"
        className="border-t bg-slate-900 text-slate-50 py-12 md:py-16"
      >
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-2xl font-semibold">
            Simple pricing for serious teams
          </h2>
          <p className="mt-2 text-sm text-slate-300 max-w-xl">
            Start small, scale up as your hiring volume grows. Cancel anytime.
          </p>

          <div className="mt-8 grid gap-6 md:grid-cols-3">
            <div className="rounded-2xl border border-slate-700 bg-slate-900/50 p-5">
              <h3 className="text-sm font-semibold">Starter</h3>
              <p className="mt-1 text-2xl font-bold">$29</p>
              <p className="text-xs text-slate-300 mb-3">per month</p>
              <ul className="space-y-1 text-xs text-slate-200">
                <li>• Up to 100 resumes/month</li>
                <li>• 5 active roles</li>
                <li>• Basic AI matching</li>
              </ul>
            </div>

            <div className="rounded-2xl border border-emerald-400 bg-slate-900 p-5 shadow-lg">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                Pro{" "}
                <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-medium text-emerald-200">
                  Most popular
                </span>
              </h3>
              <p className="mt-1 text-2xl font-bold">$79</p>
              <p className="text-xs text-slate-300 mb-3">per month</p>
              <ul className="space-y-1 text-xs text-slate-200">
                <li>• Up to 500 resumes/month</li>
                <li>• Unlimited roles</li>
                <li>• Advanced AI summaries</li>
                <li>• CSV export & team access</li>
              </ul>
            </div>

            <div className="rounded-2xl border border-slate-700 bg-slate-900/50 p-5">
              <h3 className="text-sm font-semibold">Enterprise</h3>
              <p className="mt-1 text-2xl font-bold">Let&apos;s talk</p>
              <p className="text-xs text-slate-300 mb-3">custom pricing</p>
              <ul className="space-y-1 text-xs text-slate-200">
                <li>• Unlimited resumes & roles</li>
                <li>• Dedicated support & SLAs</li>
                <li>• Custom scoring & ATS integration</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t bg-slate-950 text-slate-500 text-xs">
        <div className="mx-auto max-w-6xl px-4 py-4 flex items-center justify-between">
          <span>© {new Date().getFullYear()} TalentRank AI.</span>
          <span>Built for recruiting teams.</span>
        </div>
      </footer>
    </main>
  );
}
