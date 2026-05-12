export type CandidateStatus =
  | "pending"
  | "shortlisted"
  | "phone_screen"
  | "interviewing"
  | "offer_extended"
  | "hired"
  | "rejected"
  | "withdrew";

export const ALL_STATUSES: CandidateStatus[] = [
  "pending",
  "shortlisted",
  "phone_screen",
  "interviewing",
  "offer_extended",
  "hired",
  "rejected",
  "withdrew",
];

export const STATUS_CONFIG: Record<
  CandidateStatus,
  { label: string; bgClass: string; textClass: string; borderClass: string }
> = {
  pending:        { label: "Pending review",  bgClass: "bg-slate-100",   textClass: "text-slate-700",   borderClass: "border-slate-200"  },
  shortlisted:    { label: "Shortlisted",     bgClass: "bg-amber-100",   textClass: "text-amber-700",   borderClass: "border-amber-200"  },
  phone_screen:   { label: "Phone screen",    bgClass: "bg-blue-100",    textClass: "text-blue-700",    borderClass: "border-blue-200"   },
  interviewing:   { label: "Interviewing",    bgClass: "bg-violet-100",  textClass: "text-violet-700",  borderClass: "border-violet-200" },
  offer_extended: { label: "Offer extended",  bgClass: "bg-teal-100",    textClass: "text-teal-700",    borderClass: "border-teal-200"   },
  hired:          { label: "Hired",           bgClass: "bg-emerald-100", textClass: "text-emerald-700", borderClass: "border-emerald-200"},
  rejected:       { label: "Rejected",        bgClass: "bg-rose-100",    textClass: "text-rose-700",    borderClass: "border-rose-200"   },
  withdrew:       { label: "Withdrew",        bgClass: "bg-slate-100",   textClass: "text-slate-500",   borderClass: "border-slate-300"  },
};

export function resolveStatus(s: string | null | undefined): CandidateStatus {
  if (s && s in STATUS_CONFIG) return s as CandidateStatus;
  return "pending";
}
