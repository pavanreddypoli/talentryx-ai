"use client";

import type { FilterState } from "@/lib/recruiter/types";

type Props = {
  filters: FilterState;
  onChange: (f: FilterState) => void;
};

const SCORE_OPTIONS: { value: FilterState["score"]; label: string }[] = [
  { value: "all", label: "All scores" },
  { value: "80plus", label: "80%+" },
  { value: "60to79", label: "60–79%" },
  { value: "below60", label: "Below 60%" },
];

const STATUS_OPTIONS: { value: FilterState["status"]; label: string }[] = [
  { value: "all", label: "All statuses" },
  { value: "pending", label: "Pending" },
  { value: "shortlisted", label: "Shortlisted" },
  { value: "rejected", label: "Rejected" },
];

export default function FiltersSidebar({ filters, onChange }: Props) {
  const hasActiveFilters =
    filters.score !== "all" || filters.status !== "all" || filters.search !== "";

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-5 text-sm">
      <p className="font-semibold text-slate-700">Filters</p>

      {/* Score */}
      <div className="space-y-2">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Score</p>
        {SCORE_OPTIONS.map((o) => (
          <label key={o.value} className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="filter-score"
              value={o.value}
              checked={filters.score === o.value}
              onChange={() => onChange({ ...filters, score: o.value })}
              className="accent-brand-amber"
            />
            <span className="text-slate-700 text-sm">{o.label}</span>
          </label>
        ))}
      </div>

      {/* Status */}
      <div className="space-y-2">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</p>
        {STATUS_OPTIONS.map((o) => (
          <label key={o.value} className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="filter-status"
              value={o.value}
              checked={filters.status === o.value}
              onChange={() => onChange({ ...filters, status: o.value })}
              className="accent-brand-amber"
            />
            <span className="text-slate-700 text-sm">{o.label}</span>
          </label>
        ))}
      </div>

      {/* Search */}
      <div className="space-y-2">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Search</p>
        <input
          type="text"
          placeholder="Candidate name…"
          value={filters.search}
          onChange={(e) => onChange({ ...filters, search: e.target.value })}
          className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs outline-none focus:ring-2 focus:ring-brand-amber/50 focus:border-brand-amber"
        />
      </div>

      {/* Clear all — only shown when a filter is active */}
      {hasActiveFilters && (
        <button
          type="button"
          onClick={() => onChange({ score: "all", status: "all", search: "" })}
          className="text-xs text-brand-amber hover:underline"
        >
          Clear all filters
        </button>
      )}
    </div>
  );
}
