"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Fraunces } from "next/font/google";
import {
  Menu,
  X,
  Sparkles,
  ArrowRight,
  ArrowUpRight,
  Users,
  BrainCircuit,
  FileDown,
  Gauge,
  Wand2,
  ShieldCheck,
  Upload,
  Trophy,
  Building2,
  User as UserIcon,
  CheckCircle2,
  Star,
  Zap,
  Target,
  Mail,
  Github,
  Twitter,
} from "lucide-react";

// Distinctive editorial display font — paired with Geist Sans (already loaded) for body
const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  display: "swap",
});

export default function HomePage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Animate the score numbers in the hero mock dashboard
  const [scores, setScores] = useState([0, 0, 0]);
  useEffect(() => {
    const targets = [92, 78, 64];
    let frame = 0;
    const id = setInterval(() => {
      frame++;
      setScores(targets.map((t) => Math.min(t, Math.round((t * frame) / 30))));
      if (frame >= 30) clearInterval(id);
    }, 30);
    return () => clearInterval(id);
  }, []);

  return (
    <main className="min-h-screen flex flex-col bg-[#fafaf7] text-slate-900">
      {/* ============================================================ */}
      {/* NAV                                                           */}
      {/* ============================================================ */}
      <header className="sticky top-0 z-50 bg-[#0a0e27]/80 backdrop-blur-xl border-b border-white/5">
        <div className="mx-auto max-w-7xl flex items-center justify-between px-6 py-4 text-white">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="relative h-9 w-9 rounded-lg bg-gradient-to-br from-amber-300 to-amber-500 flex items-center justify-center shadow-[0_0_20px_rgba(251,191,36,0.4)] group-hover:shadow-[0_0_30px_rgba(251,191,36,0.6)] transition-shadow">
              <Sparkles className="h-5 w-5 text-[#0a0e27]" strokeWidth={2.5} />
            </div>
            <span className={`${fraunces.className} font-semibold text-xl tracking-tight`}>
              Talentryx<span className="text-amber-400">.</span>
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-9 text-sm text-white/70">
            <a href="#how-it-works" className="hover:text-white transition-colors">
              How it works
            </a>
            <a href="#recruiters" className="hover:text-white transition-colors">
              For recruiters
            </a>
            <a href="#job-seekers" className="hover:text-white transition-colors">
              For job seekers
            </a>
            <a href="#pricing" className="hover:text-white transition-colors">
              Pricing
            </a>
          </nav>

          <div className="hidden md:flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm text-white/80 hover:text-white px-3 py-2 transition-colors"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className="group inline-flex items-center gap-1.5 rounded-full bg-amber-400 px-5 py-2 text-sm font-semibold text-[#0a0e27] hover:bg-amber-300 transition-all shadow-[0_4px_24px_rgba(251,191,36,0.35)] hover:shadow-[0_6px_32px_rgba(251,191,36,0.5)]"
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
          <div className="md:hidden border-t border-white/10 bg-[#0a0e27] px-6 py-4 text-white/80 space-y-3 text-sm">
            <a href="#how-it-works" onClick={() => setMobileMenuOpen(false)} className="block py-1">How it works</a>
            <a href="#recruiters" onClick={() => setMobileMenuOpen(false)} className="block py-1">For recruiters</a>
            <a href="#job-seekers" onClick={() => setMobileMenuOpen(false)} className="block py-1">For job seekers</a>
            <a href="#pricing" onClick={() => setMobileMenuOpen(false)} className="block py-1">Pricing</a>
            <div className="pt-3 border-t border-white/10 flex gap-3">
              <Link href="/login" className="flex-1 text-center py-2 rounded-md border border-white/20">Log in</Link>
              <Link href="/signup" className="flex-1 text-center py-2 rounded-md bg-amber-400 text-[#0a0e27] font-semibold">Get started</Link>
            </div>
          </div>
        )}
      </header>

      {/* ============================================================ */}
      {/* HERO                                                          */}
      {/* ============================================================ */}
      <section className="relative overflow-hidden bg-[#0a0e27] text-white">
        {/* Atmosphere: radial gradient mesh */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `
              radial-gradient(circle at 20% 30%, rgba(99, 102, 241, 0.25), transparent 50%),
              radial-gradient(circle at 80% 70%, rgba(251, 191, 36, 0.15), transparent 50%),
              radial-gradient(circle at 50% 100%, rgba(139, 92, 246, 0.2), transparent 60%)
            `,
          }}
        />
        <div className="absolute inset-0 grain-overlay opacity-30 pointer-events-none" />

        <div className="relative mx-auto max-w-7xl px-6 py-20 lg:py-28 grid gap-16 lg:grid-cols-[1.1fr_1fr] items-center">
          {/* LEFT — copy */}
          <div className="text-center lg:text-left">
            <div
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5 text-xs font-medium text-white/80 backdrop-blur-sm animate-fade-up"
              style={{ animationDelay: "0ms" }}
            >
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
              </span>
              Two-sided AI for the hiring market
            </div>

            <h1
              className={`${fraunces.className} mt-6 text-5xl md:text-6xl lg:text-7xl leading-[1.05] tracking-tight font-medium animate-fade-up`}
              style={{ animationDelay: "100ms" }}
            >
              Rank resumes in <em className="text-amber-300 italic">minutes</em>.
              <br />
              Boost yours in <em className="text-amber-300 italic">seconds</em>.
            </h1>

            <p
              className="mt-6 text-lg text-white/70 max-w-xl mx-auto lg:mx-0 leading-relaxed animate-fade-up"
              style={{ animationDelay: "200ms" }}
            >
              One platform, two AIs. <span className="text-white">Recruiters</span> rank candidates by true role
              fit — semantic, not keyword bingo. <span className="text-white">Job seekers</span> see their match
              score, get AI rewrites, and add the exact keywords that push them past the screen.
            </p>

            <div
              className="mt-9 flex flex-col sm:flex-row gap-3 justify-center lg:justify-start animate-fade-up"
              style={{ animationDelay: "300ms" }}
            >
              <Link
                href="/recruiter"
                className="group inline-flex items-center justify-center gap-2 rounded-full bg-amber-400 px-7 py-3.5 text-sm font-semibold text-[#0a0e27] hover:bg-amber-300 transition-all shadow-[0_8px_32px_rgba(251,191,36,0.3)] hover:shadow-[0_12px_40px_rgba(251,191,36,0.45)]"
              >
                <Building2 className="h-4 w-4" />
                I&apos;m hiring
                <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>
              <Link
                href="/job-seeker"
                className="group inline-flex items-center justify-center gap-2 rounded-full border border-white/20 bg-white/5 px-7 py-3.5 text-sm font-semibold text-white hover:bg-white/10 hover:border-white/30 transition-all backdrop-blur-sm"
              >
                <UserIcon className="h-4 w-4" />
                I&apos;m job hunting
                <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>
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

          {/* RIGHT — TWO live mock dashboards (recruiter + job seeker) */}
          <div
            className="relative animate-fade-up space-y-5"
            style={{ animationDelay: "500ms" }}
          >
            {/* Floating glow */}
            <div className="absolute -inset-4 bg-gradient-to-tr from-amber-400/20 via-indigo-500/20 to-violet-500/20 rounded-3xl blur-2xl" />

            {/* ============= RECRUITER MOCK CARD ============= */}
            <div className="relative rounded-2xl bg-white text-slate-900 shadow-2xl shadow-black/40 overflow-hidden">
              {/* Card header */}
              <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1.5">
                    <div className="h-2 w-2 rounded-full bg-rose-400" />
                    <div className="h-2 w-2 rounded-full bg-amber-400" />
                    <div className="h-2 w-2 rounded-full bg-emerald-400" />
                  </div>
                  <div className="text-[10px] font-semibold text-slate-500 ml-1">
                    Recruiter view
                  </div>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] font-medium text-emerald-700 bg-emerald-50 rounded-full px-2 py-0.5">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75 animate-ping" />
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  </span>
                  Ranking 47 candidates
                </div>
              </div>

              {/* JD pill */}
              <div className="px-5 pt-3 pb-2">
                <div className="text-[10px] font-semibold text-slate-400 tracking-wider uppercase mb-1">
                  Job description
                </div>
                <div className="text-sm font-medium text-slate-900">
                  Senior Data Engineer · Remote
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">
                  Python · Spark · Airflow · GCP · BigQuery
                </div>
              </div>

              <div className="border-t border-slate-100" />

              {/* Candidate rows */}
              <div className="px-2 py-1.5">
                {[
                  {
                    name: "Anika Sharma",
                    initials: "AS",
                    bgColor: "bg-gradient-to-br from-violet-400 to-indigo-500",
                    score: scores[0],
                    label: "Strong",
                    badge: "bg-emerald-50 text-emerald-700 border-emerald-200",
                    insight: "Spark · Airflow · BigQuery",
                  },
                  {
                    name: "Marcus Chen",
                    initials: "MC",
                    bgColor: "bg-gradient-to-br from-amber-400 to-orange-500",
                    score: scores[1],
                    label: "Potential",
                    badge: "bg-amber-50 text-amber-700 border-amber-200",
                    insight: "Strong Python, light on GCP",
                  },
                  {
                    name: "Priya Iyer",
                    initials: "PI",
                    bgColor: "bg-gradient-to-br from-rose-400 to-pink-500",
                    score: scores[2],
                    label: "Low",
                    badge: "bg-rose-50 text-rose-700 border-rose-200",
                    insight: "Backend dev, no data eng",
                  },
                ].map((c, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-slate-50 transition-colors animate-fade-up"
                    style={{ animationDelay: `${700 + i * 120}ms` }}
                  >
                    <div className={`h-8 w-8 rounded-full ${c.bgColor} flex items-center justify-center text-white text-[11px] font-semibold shadow-sm`}>
                      {c.initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] font-semibold text-slate-900 truncate">
                        {c.name}
                      </div>
                      <div className="text-[10px] text-slate-500 truncate">
                        {c.insight}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-0.5">
                      <div className={`text-[13px] font-bold tabular-nums ${
                        c.score >= 85 ? "text-emerald-600" : c.score >= 60 ? "text-amber-600" : "text-rose-600"
                      }`}>
                        {c.score}<span className="text-[9px] font-medium">%</span>
                      </div>
                      <div className={`text-[9px] font-medium border rounded-full px-1.5 py-px ${c.badge}`}>
                        {c.label}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t border-slate-100 px-5 py-2 flex items-center justify-between bg-slate-50/50">
                <div className="text-[10px] text-slate-500">+ 44 more</div>
                <div className="text-[10px] font-medium text-indigo-600 flex items-center gap-1">
                  Export shortlist <ArrowRight className="h-3 w-3" />
                </div>
              </div>
            </div>

            {/* ============= JOB SEEKER MOCK CARD ============= */}
            <div
              className="relative rounded-2xl bg-white text-slate-900 shadow-2xl shadow-black/40 overflow-hidden ml-0 lg:ml-8 animate-fade-up"
              style={{ animationDelay: "950ms" }}
            >
              {/* Card header */}
              <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3">
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded-full bg-gradient-to-br from-amber-300 to-amber-500 flex items-center justify-center text-[10px] font-bold text-[#0a0e27]">
                    Y
                  </div>
                  <div>
                    <div className="text-[12px] font-semibold text-slate-900 leading-tight">
                      Your resume vs JD
                    </div>
                    <div className="text-[10px] text-slate-500 leading-tight">
                      Job seeker view
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5">
                  <Sparkles className="h-2.5 w-2.5" />
                  Boosting to 80+
                </div>
              </div>

              {/* Score + boost suggestions */}
              <div className="px-5 py-4 flex items-center gap-5">
                {/* Circular score ring */}
                <div className="relative flex-shrink-0">
                  <svg width="84" height="84" viewBox="0 0 84 84" className="-rotate-90">
                    <defs>
                      <linearGradient id="scoreGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#f59e0b" />
                        <stop offset="100%" stopColor="#6366f1" />
                      </linearGradient>
                    </defs>
                    <circle
                      cx="42"
                      cy="42"
                      r="34"
                      stroke="#e5e7eb"
                      strokeWidth="7"
                      fill="none"
                    />
                    <circle
                      cx="42"
                      cy="42"
                      r="34"
                      stroke="url(#scoreGrad)"
                      strokeWidth="7"
                      fill="none"
                      strokeDasharray="213.6"
                      strokeDashoffset={213.6 * (1 - scores[1] / 100)}
                      strokeLinecap="round"
                      style={{ transition: "stroke-dashoffset 0.6s ease-out" }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <div className="text-xl font-bold tabular-nums text-slate-900 leading-none">
                      {scores[1]}
                    </div>
                    <div className="text-[9px] font-medium text-slate-500 mt-0.5">
                      MATCH
                    </div>
                  </div>
                </div>

                {/* Boost suggestions */}
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="text-[10px] font-semibold text-slate-400 tracking-wider uppercase">
                    2 quick wins to 80+
                  </div>

                  <div className="flex items-start gap-2 rounded-md bg-emerald-50 border border-emerald-100 px-2.5 py-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-[11px] font-medium text-slate-900 truncate">
                        Add &ldquo;Apache Airflow&rdquo; to Skills
                      </div>
                    </div>
                    <div className="text-[10px] font-bold text-emerald-700 flex-shrink-0">+5%</div>
                  </div>

                  <div className="flex items-start gap-2 rounded-md bg-violet-50 border border-violet-100 px-2.5 py-1.5">
                    <Wand2 className="h-3.5 w-3.5 text-violet-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-[11px] font-medium text-slate-900 truncate">
                        Quantify Q3 impact (e.g., 30%)
                      </div>
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
                <div className="flex items-center gap-1 text-[10px] font-bold text-[#0a0e27] bg-amber-400 rounded-full px-2.5 py-1">
                  Boost to 80+ <ArrowRight className="h-3 w-3" />
                </div>
              </div>
            </div>

            {/* Floating sparkle badge — positioned between the two cards */}
            <div className="absolute top-[44%] -right-3 lg:-right-6 bg-gradient-to-br from-amber-300 to-amber-500 text-[#0a0e27] rounded-2xl px-3 py-2 shadow-xl flex items-center gap-2 animate-float z-10">
              <Sparkles className="h-4 w-4" strokeWidth={2.5} />
              <div className="text-[11px] font-bold leading-none">
                Two AIs
                <br />
                <span className="text-[9px] font-medium opacity-80">one platform</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* HOW IT WORKS                                                  */}
      {/* ============================================================ */}
      <section id="how-it-works" className="bg-[#fafaf7] border-y border-slate-200/70">
        <div className="mx-auto max-w-7xl px-6 py-20">
          <div className="max-w-2xl">
            <div className="text-xs font-semibold tracking-wider text-amber-600 uppercase mb-3">
              How it works
            </div>
            <h2 className={`${fraunces.className} text-3xl md:text-4xl font-medium tracking-tight text-slate-900`}>
              Three steps. No&nbsp;screening fatigue.
            </h2>
          </div>

          <div className="mt-14 grid gap-8 md:grid-cols-3">
            {[
              {
                num: "01",
                icon: Upload,
                tone: "from-indigo-500 to-violet-600",
                title: "Drop in resumes & JD",
                body: "Bulk-upload PDFs and DOCX. Paste the job description. We extract everything — no manual typing.",
              },
              {
                num: "02",
                icon: BrainCircuit,
                tone: "from-amber-400 to-orange-500",
                title: "AI ranks by true fit",
                body: "Semantic match on skills, experience, and progression — not just keyword overlap. Each candidate gets a score with reasoning.",
              },
              {
                num: "03",
                icon: Trophy,
                tone: "from-emerald-500 to-teal-600",
                title: "Shortlist or improve",
                body: "Recruiters export ATS-ready shortlists. Job seekers get concrete suggestions to push their score over 80%.",
              },
            ].map((step, i) => (
              <div
                key={i}
                className="group relative rounded-2xl border border-slate-200 bg-white p-7 hover:border-slate-300 hover:shadow-lg hover:shadow-slate-200/50 transition-all"
              >
                <div className="flex items-start justify-between mb-5">
                  <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${step.tone} flex items-center justify-center shadow-lg`}>
                    <step.icon className="h-6 w-6 text-white" strokeWidth={2} />
                  </div>
                  <div className={`${fraunces.className} text-3xl font-medium text-slate-200`}>
                    {step.num}
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  {step.title}
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  {step.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* FOR RECRUITERS                                                */}
      {/* ============================================================ */}
      <section id="recruiters" className="bg-white">
        <div className="mx-auto max-w-7xl px-6 py-20">
          <div className="grid lg:grid-cols-[1fr_1.4fr] gap-12 lg:gap-16 items-start">
            <div className="lg:sticky lg:top-28">
              <div className="inline-flex items-center gap-2 rounded-full bg-indigo-50 border border-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-700">
                <Building2 className="h-3.5 w-3.5" />
                For recruiters
              </div>
              <h2 className={`${fraunces.className} mt-5 text-4xl md:text-5xl font-medium tracking-tight text-slate-900 leading-[1.05]`}>
                Hire the&nbsp;<em className="text-indigo-600 italic">right</em> people, faster.
              </h2>
              <p className="mt-5 text-base text-slate-600 leading-relaxed max-w-md">
                Stop reading three hundred resumes to find the five worth interviewing. Talentryx
                ranks by what actually matters for the role and shows you why.
              </p>
              <Link
                href="/recruiter"
                className="mt-7 inline-flex items-center gap-2 rounded-full bg-[#0a0e27] px-6 py-3 text-sm font-semibold text-white hover:bg-[#1e1b4b] transition-colors group"
              >
                Start ranking resumes
                <ArrowUpRight className="h-4 w-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </Link>
            </div>

            <div className="grid sm:grid-cols-2 gap-5">
              {[
                {
                  icon: Users,
                  tone: "from-indigo-500 to-violet-600",
                  title: "Bulk resume intake",
                  body: "Drag in 500 PDFs. We parse and rank in under a minute.",
                },
                {
                  icon: BrainCircuit,
                  tone: "from-amber-400 to-orange-500",
                  title: "AI-powered ranking",
                  body: "Skill match, experience relevance, career progression — semantic, not keyword.",
                },
                {
                  icon: Target,
                  tone: "from-rose-500 to-pink-600",
                  title: "Explainable scores",
                  body: "Every rank comes with strengths, gaps, and reasoning your hiring manager can read.",
                },
                {
                  icon: FileDown,
                  tone: "from-emerald-500 to-teal-600",
                  title: "ATS-friendly exports",
                  body: "Export shortlists as CSV or push directly to Greenhouse, Lever, and friends.",
                },
              ].map((f, i) => (
                <div
                  key={i}
                  className="group rounded-2xl border border-slate-200 bg-gradient-to-b from-white to-slate-50/50 p-6 hover:border-slate-300 hover:shadow-md transition-all"
                >
                  <div className={`inline-flex h-11 w-11 rounded-xl bg-gradient-to-br ${f.tone} items-center justify-center shadow-md mb-4`}>
                    <f.icon className="h-5 w-5 text-white" strokeWidth={2} />
                  </div>
                  <h3 className="text-base font-semibold text-slate-900 mb-1.5">
                    {f.title}
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    {f.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* FOR JOB SEEKERS                                               */}
      {/* ============================================================ */}
      <section id="job-seekers" className="relative bg-[#0a0e27] text-white overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `
              radial-gradient(circle at 75% 20%, rgba(251, 191, 36, 0.15), transparent 50%),
              radial-gradient(circle at 25% 80%, rgba(139, 92, 246, 0.15), transparent 50%)
            `,
          }}
        />
        <div className="absolute inset-0 grain-overlay opacity-20 pointer-events-none" />

        <div className="relative mx-auto max-w-7xl px-6 py-20">
          <div className="grid lg:grid-cols-[1.4fr_1fr] gap-12 lg:gap-16 items-start">
            <div className="grid sm:grid-cols-2 gap-5 order-2 lg:order-1">
              {[
                {
                  icon: Gauge,
                  tone: "from-amber-400 to-orange-500",
                  title: "Resume Match Score",
                  body: "See your fit for any job — 0 to 100% — in seconds. Zero guesswork.",
                },
                {
                  icon: Wand2,
                  tone: "from-violet-400 to-fuchsia-500",
                  title: "AI rewrites that don't lie",
                  body: "Stronger phrasing, sharper bullets, more impact. Without inventing experience you don't have.",
                },
                {
                  icon: Zap,
                  tone: "from-amber-300 to-yellow-500",
                  title: "Boost to 80+",
                  body: "Concrete checklist of what to add or change to clear the auto-screen threshold.",
                },
                {
                  icon: ShieldCheck,
                  tone: "from-emerald-400 to-cyan-500",
                  title: "ATS optimization",
                  body: "Format and keyword tuning so your resume actually reaches a human.",
                },
              ].map((f, i) => (
                <div
                  key={i}
                  className="group rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-sm p-6 hover:border-white/20 hover:bg-white/[0.06] transition-all"
                >
                  <div className={`inline-flex h-11 w-11 rounded-xl bg-gradient-to-br ${f.tone} items-center justify-center shadow-lg mb-4`}>
                    <f.icon className="h-5 w-5 text-[#0a0e27]" strokeWidth={2.2} />
                  </div>
                  <h3 className="text-base font-semibold text-white mb-1.5">
                    {f.title}
                  </h3>
                  <p className="text-sm text-white/60 leading-relaxed">
                    {f.body}
                  </p>
                </div>
              ))}
            </div>

            <div className="lg:sticky lg:top-28 order-1 lg:order-2">
              <div className="inline-flex items-center gap-2 rounded-full bg-amber-400/10 border border-amber-300/20 px-3 py-1 text-xs font-semibold text-amber-300">
                <UserIcon className="h-3.5 w-3.5" />
                For job seekers
              </div>
              <h2 className={`${fraunces.className} mt-5 text-4xl md:text-5xl font-medium tracking-tight leading-[1.05]`}>
                Stand&nbsp;out before you click <em className="text-amber-300 italic">apply</em>.
              </h2>
              <p className="mt-5 text-base text-white/70 leading-relaxed max-w-md">
                Know exactly how a recruiter&apos;s AI will see your resume — and fix it before they do.
                One paste, one upload, one honest answer.
              </p>
              <Link
                href="/job-seeker"
                className="mt-7 inline-flex items-center gap-2 rounded-full bg-amber-400 px-6 py-3 text-sm font-semibold text-[#0a0e27] hover:bg-amber-300 transition-colors group shadow-[0_8px_32px_rgba(251,191,36,0.3)]"
              >
                See my match score
                <ArrowUpRight className="h-4 w-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* FINAL CTA                                                     */}
      {/* ============================================================ */}
      <section className="bg-[#fafaf7]">
        <div className="mx-auto max-w-7xl px-6 py-20">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0a0e27] via-[#1e1b4b] to-[#312e81] p-10 md:p-16 text-white shadow-2xl">
            <div
              className="absolute inset-0 opacity-30 pointer-events-none"
              style={{
                backgroundImage: `radial-gradient(circle at 90% 10%, rgba(251, 191, 36, 0.4), transparent 40%)`,
              }}
            />
            <div className="absolute inset-0 grain-overlay opacity-20 pointer-events-none" />

            <div className="relative grid md:grid-cols-[1.5fr_1fr] gap-10 items-center">
              <div>
                <div className="inline-flex items-center gap-1.5 rounded-full bg-white/10 border border-white/20 px-3 py-1 text-xs font-medium text-white/80 backdrop-blur-sm mb-5">
                  <Star className="h-3 w-3 fill-amber-300 text-amber-300" />
                  Free to try, no card required
                </div>
                <h2 className={`${fraunces.className} text-4xl md:text-5xl font-medium tracking-tight leading-[1.05]`}>
                  Try it on a real role.
                  <br />
                  See the difference yourself.
                </h2>
                <p className="mt-5 text-base text-white/70 max-w-xl leading-relaxed">
                  Upload one job description and a few resumes. Have your first ranked shortlist
                  before your coffee gets cold.
                </p>
              </div>

              <div className="flex flex-col gap-3">
                <Link
                  href="/signup"
                  className="group inline-flex items-center justify-center gap-2 rounded-full bg-amber-400 px-7 py-4 text-sm font-bold text-[#0a0e27] hover:bg-amber-300 transition-all shadow-[0_8px_32px_rgba(251,191,36,0.4)] hover:shadow-[0_12px_40px_rgba(251,191,36,0.55)]"
                >
                  Get started free
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

      {/* ============================================================ */}
      {/* FOOTER                                                        */}
      {/* ============================================================ */}
      <footer className="bg-[#0a0e27] text-white/70 border-t border-white/5">
        <div className="mx-auto max-w-7xl px-6 py-14">
          <div className="grid md:grid-cols-[1.5fr_1fr_1fr_1fr] gap-10">
            <div>
              <Link href="/" className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-amber-300 to-amber-500 flex items-center justify-center">
                  <Sparkles className="h-5 w-5 text-[#0a0e27]" strokeWidth={2.5} />
                </div>
                <span className={`${fraunces.className} font-semibold text-xl tracking-tight text-white`}>
                  Talentryx<span className="text-amber-400">.</span>
                </span>
              </Link>
              <p className="mt-4 text-sm text-white/60 max-w-sm leading-relaxed">
                AI for hiring teams and job seekers. Rank by fit, not by buzzwords.
              </p>
              <div className="mt-5 flex items-center gap-3">
                <a
                  href="#"
                  aria-label="Twitter"
                  className="h-9 w-9 rounded-full border border-white/10 hover:border-white/30 hover:bg-white/5 flex items-center justify-center transition-colors"
                >
                  <Twitter className="h-4 w-4" />
                </a>
                <a
                  href="#"
                  aria-label="GitHub"
                  className="h-9 w-9 rounded-full border border-white/10 hover:border-white/30 hover:bg-white/5 flex items-center justify-center transition-colors"
                >
                  <Github className="h-4 w-4" />
                </a>
                <a
                  href="mailto:hello@talentryx.ai"
                  aria-label="Email"
                  className="h-9 w-9 rounded-full border border-white/10 hover:border-white/30 hover:bg-white/5 flex items-center justify-center transition-colors"
                >
                  <Mail className="h-4 w-4" />
                </a>
              </div>
            </div>

            <div>
              <div className="text-xs font-semibold tracking-wider text-white/40 uppercase mb-4">Product</div>
              <ul className="space-y-2.5 text-sm">
                <li><a href="#recruiters" className="hover:text-white transition-colors">For recruiters</a></li>
                <li><a href="#job-seekers" className="hover:text-white transition-colors">For job seekers</a></li>
                <li><a href="#how-it-works" className="hover:text-white transition-colors">How it works</a></li>
                <li><a href="#pricing" className="hover:text-white transition-colors">Pricing</a></li>
              </ul>
            </div>

            <div>
              <div className="text-xs font-semibold tracking-wider text-white/40 uppercase mb-4">Company</div>
              <ul className="space-y-2.5 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">About</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>

            <div>
              <div className="text-xs font-semibold tracking-wider text-white/40 uppercase mb-4">Legal</div>
              <ul className="space-y-2.5 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">Privacy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Security</a></li>
                <li><a href="#" className="hover:text-white transition-colors">DPA</a></li>
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
