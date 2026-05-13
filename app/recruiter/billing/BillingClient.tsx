"use client";

import { useState } from "react";
import { CheckCircle2, Sparkles, X, Ticket, Check } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type Props = {
  isPro: boolean;
  hasCustomer: boolean;
  showSuccess: boolean;
};

const FREE_FEATURES = [
  "1 active job at a time",
  "25 total candidates ranked",
  "Keyword match scoring",
  "Recruiter notes per candidate",
];

const PRO_FEATURES = [
  "Unlimited active jobs",
  "Unlimited candidates ranked",
  "AI-powered strengths & gap analysis",
  "Bulk upload — up to 50 resumes",
  "Priority support",
];

export default function BillingClient({ isPro, hasCustomer, showSuccess }: Props) {
  const [successDismissed, setSuccessDismissed] = useState(false);

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="font-display text-2xl font-bold text-brand-navy">Billing</h1>
        <p className="text-sm text-slate-500 mt-1">Manage your subscription and billing</p>
      </div>

      {/* Post-upgrade success banner */}
      {showSuccess && !successDismissed && (
        <div className="flex items-start justify-between gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm">
          <div className="flex items-center gap-2 text-emerald-700">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <p className="font-medium">You&apos;re now on Talentryx Pro — all features are unlocked.</p>
          </div>
          <button
            type="button"
            onClick={() => setSuccessDismissed(true)}
            className="shrink-0 text-emerald-500 hover:text-emerald-700 transition-colors"
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {isPro ? <ProCard hasCustomer={hasCustomer} /> : <FreeCard />}
    </div>
  );
}

// ── Pro plan card ─────────────────────────────────────────────────────────────

function ProCard({ hasCustomer }: { hasCustomer: boolean }) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleManage() {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/recruiter/billing/portal", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Request failed");
      window.location.href = data.url;
    } catch {
      setError("Couldn't open billing portal — please try again or contact support.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card variant="light-gradient">
      <CardContent className="py-5 space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-brand-amber" />
          <p className="font-display text-xl font-bold text-brand-navy">Talentryx Pro</p>
          <span className="ml-1 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700 border border-emerald-200">
            Active
          </span>
        </div>

        <p className="text-sm text-slate-500">$49/month — billed monthly</p>

        <ul className="space-y-1.5">
          {PRO_FEATURES.map((f) => (
            <li key={f} className="flex items-center gap-2 text-sm text-slate-600">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
              {f}
            </li>
          ))}
        </ul>

        {error && <p className="text-xs text-red-500">{error}</p>}

        <div className="space-y-1.5">
          <Button
            variant="brand-primary"
            size="sm"
            onClick={handleManage}
            disabled={isLoading || !hasCustomer}
          >
            {isLoading ? "Opening portal…" : "Manage subscription"}
          </Button>
          <p className="text-xs text-slate-400">
            Change payment method, view invoices, switch to annual billing, or cancel — all from the Stripe customer portal.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Free plan card ────────────────────────────────────────────────────────────

const PRO_PRICE = 49;

function FreeCard() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [codeInput, setCodeInput] = useState("");
  const [applying, setApplying] = useState(false);
  const [discountError, setDiscountError] = useState<string | null>(null);
  const [applied, setApplied] = useState(false);
  const [pct, setPct] = useState(0);
  const [appliedCode, setAppliedCode] = useState("");

  const finalPrice = applied
    ? (PRO_PRICE * (1 - pct / 100)).toFixed(2)
    : null;

  async function handleApply() {
    if (!codeInput.trim()) return;
    setApplying(true);
    setDiscountError(null);
    try {
      const res = await fetch("/api/billing/validate-discount", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: codeInput.trim() }),
      });
      const data = await res.json();
      if (!data.valid) {
        setDiscountError(data.error ?? "Invalid code");
        setApplied(false);
      } else {
        setPct(data.discount_percent);
        setAppliedCode(codeInput.trim().toUpperCase());
        setApplied(true);
        setDiscountError(null);
      }
    } catch {
      setDiscountError("Couldn't validate code — please try again");
    } finally {
      setApplying(false);
    }
  }

  function handleRemove() {
    setCodeInput("");
    setApplied(false);
    setDiscountError(null);
    setPct(0);
    setAppliedCode("");
  }

  async function handleUpgrade() {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/recruiter/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(applied && appliedCode ? { discount_code: appliedCode } : {}),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Request failed");
      window.location.href = data.url;
    } catch {
      setError("Couldn't start upgrade — please try again or contact support.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card variant="light-gradient">
      <CardContent className="py-5 space-y-5">
        <div>
          <p className="font-display text-xl font-bold text-brand-navy">Free plan</p>
          <p className="text-sm text-slate-500 mt-1">
            1 active job, 25 candidates ranked total. Upgrade for unlimited jobs and full AI features.
          </p>
        </div>

        {/* Current vs Pro comparison */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Current — Free</p>
            <ul className="space-y-1.5">
              {FREE_FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm text-slate-500">
                  <span className="shrink-0 mt-1.5 h-1.5 w-1.5 rounded-full bg-slate-300" />
                  {f}
                </li>
              ))}
            </ul>
          </div>
          <div className="space-y-2">
            <p className="text-xs font-semibold text-brand-amber uppercase tracking-wide">Pro — $49/mo</p>
            <ul className="space-y-1.5">
              {PRO_FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm text-slate-600">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
                  {f}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {error && <p className="text-xs text-red-500">{error}</p>}

        <div className="space-y-3">
          {/* Discount code section */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 mb-4">
            <div className="flex items-center gap-2 mb-3">
              <Ticket className="h-4 w-4 text-slate-400" />
              <span className="text-sm font-medium text-slate-700">Have a discount code?</span>
            </div>
            <div className="flex gap-2">
              <input
                value={codeInput}
                onChange={(e) => {
                  setCodeInput(e.target.value.toUpperCase());
                  if (applied) { setApplied(false); setPct(0); setAppliedCode(""); }
                  setDiscountError(null);
                }}
                placeholder="e.g. PAVAN50"
                disabled={applied}
                className="flex-1 h-8 px-3 text-sm font-mono rounded-md border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-amber/40 focus:border-brand-amber disabled:bg-slate-50 disabled:text-slate-400"
              />
              {applied ? (
                <Button type="button" variant="outline" size="sm" onClick={handleRemove}>
                  <X className="h-3.5 w-3.5 mr-1" /> Remove
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleApply}
                  disabled={applying || !codeInput.trim()}
                >
                  {applying ? "Checking…" : "Apply"}
                </Button>
              )}
            </div>
            {discountError && (
              <p className="mt-2 text-xs text-red-500">{discountError}</p>
            )}
            {applied && (
              <p className="mt-2 text-xs text-emerald-600 flex items-center gap-1">
                <Check className="h-3 w-3" />
                {pct}% off applied — {appliedCode}
              </p>
            )}
            {!discountError && !applied && (
              <p className="mt-2 text-xs text-slate-400">Enter a code to get a discount on your first month.</p>
            )}
          </div>

          {/* Price display */}
          <div className="flex items-baseline gap-2">
            {applied ? (
              <>
                <span className="text-sm line-through text-slate-400">${PRO_PRICE}/mo</span>
                <span className="text-base font-bold text-slate-900">${finalPrice}/mo</span>
              </>
            ) : (
              <span className="text-sm font-semibold text-slate-700">${PRO_PRICE}/month</span>
            )}
          </div>

          <Button
            variant="brand-primary"
            onClick={handleUpgrade}
            disabled={isLoading}
          >
            {isLoading
              ? "Redirecting to Stripe…"
              : `Upgrade to Pro — ${applied ? `$${finalPrice}` : "$49"}/month`}
          </Button>
          <p className="text-xs text-slate-400">
            Cancel anytime. Annual billing saves $120/year — switch to annual from the customer portal after upgrading.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
