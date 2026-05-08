"use client";

import { useState } from "react";
import { CheckCircle2, Sparkles, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type Props = {
  hasBoost: boolean;
  hasCustomer: boolean;
  showSuccess: boolean;
};

const FREE_FEATURES = [
  "3 match scores per month",
  "Keyword strengths & gaps summary",
  "Basic candidate ranking",
];

const BOOST_FEATURES = [
  "Unlimited match scores",
  "AI-powered resume rewrites",
  "Boost-to-80 improvement suggestions",
  "Priority support",
];

export default function BillingClient({ hasBoost, hasCustomer, showSuccess }: Props) {
  const [successDismissed, setSuccessDismissed] = useState(false);

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="font-display text-2xl font-bold text-brand-navy">Billing</h1>
        <p className="text-sm text-slate-500 mt-1">Manage your subscription and billing</p>
      </div>

      {showSuccess && !successDismissed && (
        <div className="flex items-start justify-between gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm">
          <div className="flex items-center gap-2 text-emerald-700">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <p className="font-medium">You&apos;re now on Talentryx Boost — all features are unlocked.</p>
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

      {hasBoost ? <BoostCard hasCustomer={hasCustomer} /> : <FreeCard />}
    </div>
  );
}

// ── Boost plan card ───────────────────────────────────────────────────────────

function BoostCard({ hasCustomer }: { hasCustomer: boolean }) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleManage() {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/job-seeker/billing/portal", { method: "POST" });
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
          <p className="font-display text-xl font-bold text-brand-navy">Talentryx Boost</p>
          <span className="ml-1 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700 border border-emerald-200">
            Active
          </span>
        </div>

        <p className="text-sm text-slate-500">$9/month — billed monthly</p>

        <ul className="space-y-1.5">
          {BOOST_FEATURES.map((f) => (
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

function FreeCard() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleUpgrade() {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/job-seeker/billing/checkout", { method: "POST" });
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
            3 match scores per month. Upgrade for unlimited AI features.
          </p>
        </div>

        {/* Feature comparison */}
        <div className="grid grid-cols-2 gap-4">
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
            <p className="text-xs font-semibold text-brand-amber uppercase tracking-wide">Boost — $9/mo</p>
            <ul className="space-y-1.5">
              {BOOST_FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm text-slate-600">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
                  {f}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {error && <p className="text-xs text-red-500">{error}</p>}

        <div className="space-y-2">
          <Button variant="brand-primary" onClick={handleUpgrade} disabled={isLoading}>
            {isLoading ? "Redirecting to Stripe…" : "Upgrade to Boost — $9/month"}
          </Button>
          <div>
            {/* F1.1 follow-up: one-time $4.99 rewrite checkout — stub until STRIPE_PRICE_RESUME_REWRITE is configured */}
            <button
              type="button"
              disabled
              className="text-xs text-slate-400 cursor-not-allowed"
              title="Coming soon"
            >
              Or pay $4.99 per rewrite (one-time) — coming soon
            </button>
          </div>
          <p className="text-xs text-slate-400">
            Cancel anytime. Annual billing saves per year — switch to annual from the customer portal after upgrading.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
