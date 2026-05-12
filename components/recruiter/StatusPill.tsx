"use client";

import { useState, useRef, useEffect, useLayoutEffect } from "react";
import { ChevronDown } from "lucide-react";
import { ALL_STATUSES, STATUS_CONFIG, resolveStatus } from "@/lib/candidateStatuses";
import type { CandidateStatus } from "@/lib/candidateStatuses";

type Props = {
  status: string;
  onChange: (s: CandidateStatus) => void;
  size?: "sm" | "md";
};

export default function StatusPill({ status, onChange, size = "sm" }: Props) {
  const [open, setOpen] = useState(false);
  const [openUpward, setOpenUpward] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const resolved = resolveStatus(status);
  const cfg = STATUS_CONFIG[resolved];

  // Measure available space below trigger; flip upward if < 340px (320 max-height + 20 buffer)
  useLayoutEffect(() => {
    if (!open || !triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    setOpenUpward(window.innerHeight - rect.bottom < 340);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function handleOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [open]);

  const pillPadding = size === "md" ? "px-3 py-1 text-sm" : "px-2 py-0.5 text-xs";

  return (
    <div ref={ref} className="relative inline-flex">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`inline-flex items-center gap-1 rounded-full border font-medium transition-opacity hover:opacity-80 ${pillPadding} ${cfg.bgClass} ${cfg.textClass} ${cfg.borderClass}`}
      >
        {cfg.label}
        <ChevronDown className={`shrink-0 ${size === "md" ? "h-3.5 w-3.5" : "h-3 w-3"} opacity-60`} />
      </button>

      {open && (
        <div className={`absolute left-0 z-50 min-w-[160px] max-h-[320px] overflow-y-auto rounded-lg border border-slate-200 bg-white py-1 shadow-lg ${openUpward ? "bottom-full mb-1" : "top-full mt-1"}`}>
          {ALL_STATUSES.map((s) => {
            const c = STATUS_CONFIG[s];
            return (
              <button
                key={s}
                type="button"
                onClick={() => { onChange(s); setOpen(false); }}
                className="flex w-full items-center gap-2 px-3 py-1.5 text-left hover:bg-slate-50 transition-colors"
              >
                <span
                  className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${c.bgClass} ${c.textClass} ${c.borderClass}`}
                >
                  {c.label}
                </span>
                {s === resolved && (
                  <span className="ml-auto text-[10px] text-slate-400">current</span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
