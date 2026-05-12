"use client";

import { useState, useRef, useEffect, useLayoutEffect } from "react";
import { createPortal } from "react-dom";
import { ChevronDown } from "lucide-react";
import { ALL_STATUSES, STATUS_CONFIG, resolveStatus } from "@/lib/candidateStatuses";
import type { CandidateStatus } from "@/lib/candidateStatuses";

type Props = {
  status: string;
  onChange: (s: CandidateStatus) => void;
  size?: "sm" | "md";
};

type DropdownPos = { top?: number; bottom?: number; left: number };

export default function StatusPill({ status, onChange, size = "sm" }: Props) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<DropdownPos>({ left: 0 });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const resolved = resolveStatus(status);
  const cfg = STATUS_CONFIG[resolved];

  // Compute fixed viewport coords on open; prefer downward, flip upward if insufficient space below
  useLayoutEffect(() => {
    if (!open || !triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    if (spaceBelow >= 340 || spaceBelow >= rect.top) {
      setPos({ top: rect.bottom + 4, left: rect.left });
    } else {
      setPos({ bottom: window.innerHeight - rect.top + 4, left: rect.left });
    }
  }, [open]);

  // Click-outside: check both trigger and portaled dropdown (separate DOM trees)
  useEffect(() => {
    if (!open) return;
    function handleOutside(e: MouseEvent) {
      const target = e.target as Node;
      if (!triggerRef.current?.contains(target) && !dropdownRef.current?.contains(target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [open]);

  const pillPadding = size === "md" ? "px-3 py-1 text-sm" : "px-2 py-0.5 text-xs";

  const dropdown = (
    <div
      ref={dropdownRef}
      style={{ position: "fixed", top: pos.top, bottom: pos.bottom, left: pos.left, zIndex: 9999 }}
      className="min-w-[160px] max-h-[320px] overflow-y-auto rounded-lg border border-slate-200 bg-white py-1 shadow-lg"
    >
      {ALL_STATUSES.map((s) => {
        const c = STATUS_CONFIG[s];
        return (
          <button
            key={s}
            type="button"
            onClick={() => { onChange(s); setOpen(false); }}
            className="flex w-full items-center gap-2 px-3 py-1.5 text-left hover:bg-slate-50 transition-colors"
          >
            <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${c.bgClass} ${c.textClass} ${c.borderClass}`}>
              {c.label}
            </span>
            {s === resolved && (
              <span className="ml-auto text-[10px] text-slate-400">current</span>
            )}
          </button>
        );
      })}
    </div>
  );

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`inline-flex items-center gap-1 rounded-full border font-medium transition-opacity hover:opacity-80 ${pillPadding} ${cfg.bgClass} ${cfg.textClass} ${cfg.borderClass}`}
      >
        {cfg.label}
        <ChevronDown className={`shrink-0 ${size === "md" ? "h-3.5 w-3.5" : "h-3 w-3"} opacity-60`} />
      </button>

      {open && createPortal(dropdown, document.body)}
    </>
  );
}
