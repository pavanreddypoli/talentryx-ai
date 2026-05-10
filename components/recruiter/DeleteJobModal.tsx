"use client";

import { useState } from "react";
import { Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

type Props = {
  jobTitle: string;
  candidateCount: number;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
};

export default function DeleteJobModal({ jobTitle, candidateCount, onConfirm, onCancel }: Props) {
  const [typed, setTyped] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const confirmed = typed === jobTitle;

  async function handleDelete() {
    setDeleting(true);
    setError(null);
    try {
      await onConfirm();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Delete failed — please try again");
      setDeleting(false);
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-50"
        onClick={() => { if (!deleting) onCancel(); }}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-5">

          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
              <Trash2 className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <h2 className="font-display font-bold text-slate-900 text-lg">Delete this job?</h2>
              <p className="text-sm text-slate-500 mt-0.5">This cannot be undone.</p>
            </div>
          </div>

          <div className="rounded-lg border border-red-100 bg-red-50 px-4 py-3 space-y-1">
            <p className="text-xs font-semibold text-red-700 uppercase tracking-wide">Permanently deletes:</p>
            <ul className="text-sm text-red-700 space-y-0.5 list-disc list-inside">
              <li>The job description</li>
              <li>{candidateCount} candidate{candidateCount !== 1 ? "s" : ""} ranked against this job</li>
              <li>All resume files uploaded</li>
              <li>All recruiter notes and shortlist statuses</li>
            </ul>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">
              Type <span className="font-semibold text-slate-900">{jobTitle}</span> to confirm:
            </label>
            <input
              type="text"
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              disabled={deleting}
              placeholder={jobTitle}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-red-400 disabled:opacity-50"
            />
          </div>

          {error && <p className="text-xs text-red-600">{error}</p>}

          <div className="flex gap-3 justify-end pt-1">
            <Button
              variant="outline"
              size="sm"
              onClick={onCancel}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleDelete}
              disabled={!confirmed || deleting}
              className="bg-red-600 hover:bg-red-700 text-white disabled:opacity-40"
            >
              {deleting ? (
                <span className="flex items-center gap-1.5">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> Deleting…
                </span>
              ) : (
                "Delete permanently"
              )}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
