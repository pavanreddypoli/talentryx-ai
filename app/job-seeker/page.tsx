"use client";

import Link from "next/link";
import { useState } from "react";
import { Fraunces } from "next/font/google";
import {
  Menu, X, Sparkles, ArrowRight, ArrowUpRight,
  Gauge, Wand2, Zap, TrendingUp,
  ClipboardList, FileUp, Target,
  CheckCircle2, Star, User as UserIcon,
  Twitter, Github, Mail,
} from "lucide-react";

const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  display: "swap",
});

export default function JobSeekerPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <main className="min-h-screen flex flex-col bg-brand-canvas text-slate-900">

      {/* ── NAV ─────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-brand-navy/80 backdrop-blur-xl border-b border-white/5">
        <div className="mx-auto max-w-7xl flex items-center justify-between px-6 py-4 text-white">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="relative h-9 w-9 rounded-lg bg-gradient-to-br from-amber-300 to-amber-500 flex items-center justify-center shadow-logo group-hover:shadow-[0_0_30px_rgba(251,191,36,0.6)] transition-shadow">
              <Sparkles className="h-5 w-5 text-brand-navy" strokeWidth={2.5} />
            </div>
            <span className={`${fraunces.className} font-semibold text-xl tracking-tight`}>
              Talentryx<span className="text-amber-400">.</span>
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-9 text-sm text-white/70">
            <a href="#how-it-works" className="hover:text-white transition-colors">How it works</a>
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
            <Link href="/recruiter" className="hover:text-white transition-colors">For Recruiters</Link>
          </nav>

          <div className="hidden md:flex items-center gap-3">
            <Link href="/login" className="text-sm text-white/80 hover:text-white px-3 py-2 transition-colors">
              Log in
            </Link>
            <Link
              href="/signup?role=job_seeker"
              className="group inline-flex items-center gap-1.5 rounded-full bg-amber-400 px-5 py-2 text-sm font-semibold text-brand-navy hover:bg-amber-300 transition-all shadow-cta-sm hover:shadow-[0_6px_32px_rgba(251,191,36,0.5)]"
            >
              Get started
              <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>

          <button
            className="md:hidden text-white"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden border-t border-white/10 bg-brand-navy px-6 py-4 text-white/80 space-y-3 text-sm">
            <a href="#how-it-works" onClick={() => setMobileMenuOpen(false)} className="block py-1">How it works</a>
            <a href="#features" onClick={() => setMobileMenuOpen(false)} className="block py-1">Features</a>
            <a href="#pricing" onClick={() => setMobileMenuOpen(false)} className="block py-1">Pricing</a>
            <Link href="/recruiter" className="block py-1" onClick={() => setMobileMenuOpen(false)}>For Recruiters</Link>
            <div className="pt-3 border-t border-white/10 flex gap-3">
              <Link href="/login" className="flex-1 text-center py-2 rounded-md border border-white/20">Log in</Link>
              <Link href="/signup?role=job_seeker" className="flex-1 text-center py-2 rounded-md bg-amber-400 text-brand-navy font-semibold">Get started</Link>
            </div>
          </div>
        )}
      </header>

      {/* ── HERO ────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-brand-navy text-white">
        <div className="absolute inset-0 bg-seekers-mesh pointer-events-none" />
        <div className="absolute inset-0 grain-overlay opacity-30 pointer-events-none" />

        <div className="relative mx-auto max-w-7xl px-6 py-20 lg:py-28 grid gap-16 lg:grid-cols-[1.1fr_1fr] items-center">
          {/* LEFT — copy */}
          <div className="text-center lg:text-left">
            <div
              className="inline-flex items-center gap-2 rounded-full bg-amber-400/10 border border-amber-300/20 px-3.5 py-1.5 text-xs font-semibold tracking-wide text-amber-300 uppercase backdrop-blur-sm animate-fade-up"
              style={{ animationDelay: "0ms" }}
            >
              <UserIcon className="h-3.5 w-3.5" />
              For Job Seekers
            </div>

            <h1
              className={`${fraunces.className} mt-6 text-5xl md:text-6xl lg:text-7xl leading-[1.05] tracking-tight font-medium animate-fade-up`}
              style={{ animationDelay: "100ms" }}
            >
              Land more interviews.
              <br />
              Stand out from <em className="text-amber-300 italic">the pile</em>.
            </h1>

            <p
              className="mt-6 text-lg text-white/70 max-w-xl mx-auto lg:mx-0 leading-relaxed animate-fade-up"
              style={{ animationDelay: "200ms" }}
            >
              Paste any job description, upload your resume, and see your match score
              in seconds. Get <span className="text-white">AI-powered rewrites and keyword suggestions</span> to
              push past 80% and land the interview.
            </p>

            <div
              className="mt-9 flex flex-col sm:flex-row gap-3 justify-center lg:justify-start animate-fade-up"
              style={{ animationDelay: "300ms" }}
            >
              <Link
                href="/signup?role=job_seeker"
                className="group inline-flex items-center justify-center gap-2 rounded-full bg-amber-400 px-7 py-3.5 text-sm font-semibold text-brand-navy hover:bg-amber-300 transition-all shadow-cta hover:shadow-cta-hover"
              >
                Try free — see your score
                <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>
              <a
                href="#how-it-works"
                className="group inline-flex items-center justify-center gap-2 rounded-full border border-white/20 bg-white/5 px-7 py-3.5 text-sm font-semibold text-white hover:bg-white/10 hover:border-white/30 transition-all backdrop-blur-sm"
              >
                How does it work?
              </a>
            </div>

            <div
              className="mt-10 flex items-center gap-6 justify-center lg:justify-start text-xs text-white/50 animate-fade-up"
              style={{ animationDelay: "400ms" }}
            >
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                No credit card to try
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                Resumes stay private
              </div>
            </div>
          </div>

          {/* RIGHT — job seeker mock card */}
          <div
            className="relative animate-fade-up"
            style={{ animationDelay: "500ms" }}
          >
            <div className="absolute -inset-4 bg-gradient-to-tr from-amber-400/20 via-violet-500/20 to-violet-500/10 rounded-3xl blur-2xl" />
            <div className="relative rounded-2xl bg-white text-slate-900 shadow-2xl shadow-black/40 overflow-hidden">
              <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3">
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded-full bg-gradient-to-br from-amber-300 to-amber-500 flex items-center justify-center text-[10px] font-bold text-brand-navy">
                    Y
                  </div>
                  <div>
                    <div className="text-[12px] font-semibold text-slate-900 leading-tight">Your resume vs JD</div>
                    <div className="text-[10px] text-slate-500 leading-tight">Job seeker view</div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5">
                  <Sparkles className="h-2.5 w-2.5" />
                  Boosting to 80+
                </div>
              </div>

              <div className="px-5 py-4 flex items-center gap-5">
                <div className="relative flex-shrink-0">
                  <svg width="84" height="84" viewBox="0 0 84 84" className="-rotate-90">
                    <defs>
                      <linearGradient id="scoreGradSeeker" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#f59e0b" />
                        <stop offset="100%" stopColor="#6366f1" />
                      </linearGradient>
                    </defs>
                    <circle cx="42" cy="42" r="34" stroke="#e5e7eb" strokeWidth="7" fill="none" />
                    <circle
                      cx="42" cy="42" r="34"
                      stroke="url(#scoreGradSeeker)" strokeWidth="7" fill="none"
                      strokeDasharray="213.6"
                      strokeDashoffset={213.6 * (1 - 78 / 100)}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <div className="text-xl font-bold tabular-nums text-slate-900 leading-none">78</div>
                    <div className="text-[9px] font-medium text-slate-500 mt-0.5">MATCH</div>
                  </div>
                </div>

                <div className="flex-1 min-w-0 space-y-2">
                  <div className="text-[10px] font-semibold text-slate-400 tracking-wider uppercase">2 quick wins to 80+</div>
                  <div className="flex items-start gap-2 rounded-md bg-emerald-50 border border-emerald-100 px-2.5 py-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-[11px] font-medium text-slate-900 truncate">Add &ldquo;Apache Airflow&rdquo; to Skills</div>
                    </div>
                    <div className="text-[10px] font-bold text-emerald-700 flex-shrink-0">+5%</div>
                  </div>
                  <div className="flex items-start gap-2 rounded-md bg-violet-50 border border-violet-100 px-2.5 py-1.5">
                    <Wand2 className="h-3.5 w-3.5 text-violet-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-[11px] font-medium text-slate-900 truncate">Quantify Q3 impact (e.g., 30%)</div>
                    </div>
                    <div className="text-[10px] font-bold text-violet-700 flex-shrink-0">+4%</div>
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-100 px-5 py-2.5 flex items-center justify-between bg-gradient-to-r from-amber-50/50 to-violet-50/50">
                <div className="flex items-center gap-1.5 text-[10px] text-slate-600">
                  <Wand2 className="h-3 w-3 text-violet-500" />
                  <span className="font-medium">Rewrite with AI</span>
                </div>
                <div className="flex items-center gap-1 text-[10px] font-bold text-brand-navy bg-amber-400 rounded-full px-2.5 py-1">
                  Boost to 80+ <ArrowRight className="h-3 w-3" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ────────────────────────────────────────────── */}
      <section id="how-it-works" className="bg-brand-canvas border-y border-slate-200/70">
        <div className="mx-auto max-w-7xl px-6 py-20">
          <div className="max-w-2xl">
            <div className="text-xs font-semibold tracking-wider text-amber-600 uppercase mb-3">How it works</div>
            <h2 className={`${fraunces.className} text-3xl md:text-4xl font-medium tracking-tight text-slate-900`}>
              Know your score before you hit apply.
            </h2>
          </div>

          <div className="mt-14 grid gap-8 md:grid-cols-3">
            {[
              {
                num: "01", icon: ClipboardList, tone: "from-amber-400 to-orange-500",
                title: "Paste the job description",
                body: "Copy from any job board — LinkedIn, Indeed, company careers page. No special formatting needed.",
              },
              {
                num: "02", icon: FileUp, tone: "from-violet-500 to-violet-700",
                title: "Upload your resume",
                body: "PDF or DOCX. We extract everything — skills, experience, education — and score it against the JD.",
              },
              {
                num: "03", icon: Target, tone: "from-emerald-500 to-teal-600",
                title: "Get your score and fix list",
                body: "See your match percentage, what's working, what's missing, and exactly what to add to push past 80%.",
              },
            ].map((step, i) => (
              <div key={i} className="relative rounded-2xl border border-slate-200 bg-white p-7 hover:border-slate-300 hover:shadow-lg hover:shadow-slate-200/50 transition-all">
                <div className="flex items-start justify-between mb-5">
                  <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${step.tone} flex items-center justify-center shadow-lg`}>
                    <step.icon className="h-6 w-6 text-white" strokeWidth={2} />
                  </div>
                  <div className={`${fraunces.className} text-3xl font-medium text-slate-200`}>{step.num}</div>
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">{step.title}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES (dark) ─────────────────────────────────────────── */}
      <section id="features" className="relative bg-brand-navy text-white overflow-hidden">
        <div className="absolute inset-0 bg-seekers-mesh pointer-events-none" />
        <div className="absolute inset-0 grain-overlay opacity-20 pointer-events-none" />

        <div className="relative mx-auto max-w-7xl px-6 py-20">
          <div className="grid lg:grid-cols-[1.4fr_1fr] gap-12 lg:gap-16 items-start">
            <div className="grid sm:grid-cols-2 gap-5 order-2 lg:order-1">
              {[
                {
                  icon: Gauge, tone: "from-amber-400 to-orange-500",
                  title: "Resume Match Score",
                  body: "Know exactly how a recruiter's AI will score you — 0 to 100% — before you click apply.",
                },
                {
                  icon: Wand2, tone: "from-violet-400 to-fuchsia-500",
                  title: "AI rewrites that don't lie",
                  body: "Stronger phrasing, sharper bullets, more impact. Without inventing experience you don't have.",
                },
                {
                  icon: Zap, tone: "from-amber-300 to-yellow-500",
                  title: "Boost to 80+",
                  body: "A concrete checklist of what to add or change to clear the auto-screen threshold and reach a human.",
                },
                {
                  icon: TrendingUp, tone: "from-emerald-400 to-cyan-500",
                  title: "Track your progress",
                  body: "See your match scores improve over time as you apply keywords and refine your resume.",
                },
              ].map((f, i) => (
                <div key={i} className="group rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-sm p-6 hover:border-white/20 hover:bg-white/[0.06] transition-all">
                  <div className={`inline-flex h-11 w-11 rounded-xl bg-gradient-to-br ${f.tone} items-center justify-center shadow-lg mb-4`}>
                    <f.icon className="h-5 w-5 text-brand-navy" strokeWidth={2.2} />
                  </div>
                  <h3 className="text-base font-semibold text-white mb-1.5">{f.title}</h3>
                  <p className="text-sm text-white/60 leading-relaxed">{f.body}</p>
                </div>
              ))}
            </div>

            <div className="lg:sticky lg:top-28 order-1 lg:order-2">
              <div className="inline-flex items-center gap-2 rounded-full bg-amber-400/10 border border-amber-300/20 px-3 py-1 text-xs font-semibold text-amber-300">
                <UserIcon className="h-3.5 w-3.5" />
                For job seekers
              </div>
              <h2 className={`${fraunces.className} mt-5 text-4xl md:text-5xl font-medium tracking-tight leading-[1.05]`}>
                Stand out before you click <em className="text-amber-300 italic">apply</em>.
              </h2>
              <p className="mt-5 text-base text-white/70 leading-relaxed max-w-md">
                Know exactly how a recruiter&apos;s AI sees your resume — and fix it before
                they do. One paste, one upload, one honest score.
              </p>
              <Link
                href="/signup?role=job_seeker"
                className="mt-7 inline-flex items-center gap-2 rounded-full bg-amber-400 px-6 py-3 text-sm font-semibold text-brand-navy hover:bg-amber-300 transition-colors group shadow-cta"
              >
                See my match score
                <ArrowUpRight className="h-4 w-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── PRICING ─────────────────────────────────────────────────── */}
      <section id="pricing" className="bg-brand-canvas border-t border-slate-200/70">
        <div className="mx-auto max-w-7xl px-6 py-20">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <div className="text-xs font-semibold tracking-wider text-amber-600 uppercase mb-3">Pricing</div>
            <h2 className={`${fraunces.className} text-3xl md:text-4xl font-medium tracking-tight text-slate-900`}>
              Simple, fair pricing
            </h2>
            <p className="mt-4 text-base text-slate-600">Pay only when you need scale. Start free.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
            {/* FREE */}
            <div className="rounded-2xl border border-slate-200 bg-white p-8 flex flex-col">
              <div className="mb-6">
                <div className="text-sm font-semibold text-slate-500 mb-2">Free</div>
                <div className="flex items-baseline gap-1">
                  <span className={`${fraunces.className} text-5xl font-medium text-slate-900`}>$0</span>
                  <span className="text-slate-500 text-sm">/month</span>
                </div>
              </div>
              <ul className="space-y-3 flex-1 mb-8">
                {["3 match scores per month", "See strengths and gaps", "Basic AI insights"].map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm text-slate-700">
                    <CheckCircle2 className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/signup?role=job_seeker"
                className="block text-center rounded-full border border-slate-300 bg-white px-6 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Get started
              </Link>
            </div>

            {/* BOOST — highlighted */}
            <div className="relative rounded-2xl border-2 border-amber-400 bg-white p-8 flex flex-col shadow-lg">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-amber-400 text-brand-navy text-xs font-bold px-3 py-1 whitespace-nowrap">
                MOST POPULAR
              </div>
              <div className="mb-6">
                <div className="text-sm font-semibold text-slate-500 mb-2">Boost</div>
                <div className="flex items-baseline gap-1">
                  <span className={`${fraunces.className} text-5xl font-medium text-slate-900`}>$9</span>
                  <span className="text-slate-500 text-sm">/month</span>
                </div>
                <p className="text-xs text-slate-500 mt-2">Land your next role faster</p>
              </div>
              <ul className="space-y-3 flex-1 mb-8">
                {["Unlimited match scores", "AI-powered resume rewrites", "Boost-to-80 keyword suggestions", "Save and track your progress", "Priority support"].map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm text-slate-700">
                    <CheckCircle2 className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/signup?role=job_seeker"
                className="block text-center rounded-full bg-amber-400 px-6 py-2.5 text-sm font-semibold text-brand-navy hover:bg-amber-300 transition-all shadow-cta"
              >
                Start boosting
              </Link>
              <p className="text-xs text-slate-400 text-center mt-2">Coming during early access</p>
            </div>
          </div>

          <p className="text-sm text-slate-500 text-center mt-8">
            Or pay{" "}
            <span className="font-medium text-slate-700">$4.99 per resume rewrite</span>
            {" "}— no subscription needed.
          </p>
        </div>
      </section>

      {/* ── FINAL CTA ───────────────────────────────────────────────── */}
      <section className="bg-brand-canvas">
        <div className="mx-auto max-w-7xl px-6 py-20">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-navy via-brand-navy-mid to-brand-navy-deep p-10 md:p-16 text-white shadow-2xl">
            <div
              className="absolute inset-0 opacity-30 pointer-events-none"
              style={{ backgroundImage: "radial-gradient(circle at 90% 10%, rgba(251, 191, 36, 0.4), transparent 40%)" }}
            />
            <div className="absolute inset-0 grain-overlay opacity-20 pointer-events-none" />
            <div className="relative grid md:grid-cols-[1.5fr_1fr] gap-10 items-center">
              <div>
                <div className="inline-flex items-center gap-1.5 rounded-full bg-white/10 border border-white/20 px-3 py-1 text-xs font-medium text-white/80 backdrop-blur-sm mb-5">
                  <Star className="h-3 w-3 fill-amber-300 text-amber-300" />
                  Free to try, no card required
                </div>
                <h2 className={`${fraunces.className} text-4xl md:text-5xl font-medium tracking-tight leading-[1.05]`}>
                  Ready to land more interviews?
                </h2>
                <p className="mt-5 text-base text-white/70 max-w-xl leading-relaxed">
                  Stop applying blind. Get your match score, fix what&apos;s missing,
                  and walk into every application knowing you&apos;re in the top 10%.
                </p>
              </div>
              <div className="flex flex-col gap-3">
                <Link
                  href="/signup?role=job_seeker"
                  className="group inline-flex items-center justify-center gap-2 rounded-full bg-amber-400 px-7 py-4 text-sm font-bold text-brand-navy hover:bg-amber-300 transition-all shadow-cta-lg hover:shadow-cta-hover"
                >
                  Try free — get your first score
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                </Link>
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-white/20 bg-white/5 px-7 py-4 text-sm font-semibold text-white hover:bg-white/10 transition-all backdrop-blur-sm"
                >
                  I already have an account
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ──────────────────────────────────────────────────── */}
      <footer className="bg-brand-navy text-white/70 border-t border-white/5">
        <div className="mx-auto max-w-7xl px-6 py-14">
          <div className="grid md:grid-cols-[1.5fr_1fr_1fr_1fr] gap-10">
            <div>
              <Link href="/" className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-amber-300 to-amber-500 flex items-center justify-center">
                  <Sparkles className="h-5 w-5 text-brand-navy" strokeWidth={2.5} />
                </div>
                <span className={`${fraunces.className} font-semibold text-xl tracking-tight text-white`}>
                  Talentryx<span className="text-amber-400">.</span>
                </span>
              </Link>
              <p className="mt-4 text-sm text-white/60 max-w-sm leading-relaxed">
                AI for hiring teams and job seekers. Rank by fit, not by buzzwords.
              </p>
              <div className="mt-5 flex items-center gap-3">
                <a href="#" aria-label="Twitter" className="h-9 w-9 rounded-full border border-white/10 hover:border-white/30 hover:bg-white/5 flex items-center justify-center transition-colors">
                  <Twitter className="h-4 w-4" />
                </a>
                <a href="#" aria-label="GitHub" className="h-9 w-9 rounded-full border border-white/10 hover:border-white/30 hover:bg-white/5 flex items-center justify-center transition-colors">
                  <Github className="h-4 w-4" />
                </a>
                <a href="mailto:hello@talentryx.ai" aria-label="Email" className="h-9 w-9 rounded-full border border-white/10 hover:border-white/30 hover:bg-white/5 flex items-center justify-center transition-colors">
                  <Mail className="h-4 w-4" />
                </a>
              </div>
            </div>

            <div>
              <div className="text-xs font-semibold tracking-wider text-white/40 uppercase mb-4">Product</div>
              <ul className="space-y-2.5 text-sm">
                <li><Link href="/" className="hover:text-white transition-colors">Home</Link></li>
                <li><Link href="/recruiter" className="hover:text-white transition-colors">For Recruiters</Link></li>
                <li><Link href="/job-seeker" className="hover:text-white transition-colors">For Job Seekers</Link></li>
              </ul>
            </div>

            <div>
              <div className="text-xs font-semibold tracking-wider text-white/40 uppercase mb-4">Company</div>
              <ul className="space-y-2.5 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">About</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>

            <div>
              <div className="text-xs font-semibold tracking-wider text-white/40 uppercase mb-4">Legal</div>
              <ul className="space-y-2.5 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">Privacy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Security</a></li>
              </ul>
            </div>
          </div>

          <div className="mt-12 pt-6 border-t border-white/5 flex flex-col md:flex-row justify-between gap-3 text-xs text-white/40">
            <span>© 2026 Talentryx AI. All rights reserved.</span>
            <span>Built for hiring teams &amp; job seekers.</span>
          </div>
        </div>
      </footer>
    </main>
  );
}
