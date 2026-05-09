"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type DiscountCode = {
  id: string;
  code: string;
  discount_percent: number;
  description: string | null;
  max_uses: number | null;
  times_used: number;
  active: boolean;
  expires_at: string | null;
  created_at: string;
};

type Props = { initialCodes: DiscountCode[] };

export default function AdminDiscountCodesClient({ initialCodes }: Props) {
  const [codes, setCodes] = useState<DiscountCode[]>(initialCodes);
  const [showModal, setShowModal] = useState(false);
  const [formCode, setFormCode] = useState("");
  const [formPct, setFormPct] = useState("10");
  const [formDescription, setFormDescription] = useState("");
  const [formMaxUses, setFormMaxUses] = useState("");
  const [formExpiresAt, setFormExpiresAt] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  function resetForm() {
    setFormCode(""); setFormPct("10"); setFormDescription("");
    setFormMaxUses(""); setFormExpiresAt(""); setCreateError(null);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setCreateError(null);
    try {
      const res = await fetch("/api/admin/discount-codes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: formCode.trim().toUpperCase(),
          discount_percent: parseInt(formPct, 10),
          description: formDescription.trim() || null,
          max_uses: formMaxUses ? parseInt(formMaxUses, 10) : null,
          expires_at: formExpiresAt || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to create");
      setCodes([data, ...codes]);
      setShowModal(false);
      resetForm();
    } catch (err: any) {
      setCreateError(err.message);
    } finally {
      setCreating(false);
    }
  }

  async function handleToggle(id: string, currentActive: boolean) {
    setCodes(codes.map((c) => (c.id === id ? { ...c, active: !currentActive } : c)));
    try {
      const res = await fetch(`/api/admin/discount-codes/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !currentActive }),
      });
      if (!res.ok) setCodes(codes.map((c) => (c.id === id ? { ...c, active: currentActive } : c)));
    } catch {
      setCodes(codes.map((c) => (c.id === id ? { ...c, active: currentActive } : c)));
    }
  }

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900">Discount Codes</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {codes.length} code{codes.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Button variant="brand-primary" size="sm" onClick={() => setShowModal(true)}>
          <Plus className="h-4 w-4" />
          Create new
        </Button>
      </div>

      {codes.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
          <p className="text-sm text-slate-500">No discount codes yet. Create one to get started.</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">Code</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">Discount</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">Description</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">Used</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">Expires</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">Active</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {codes.map((code) => (
                  <tr key={code.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-mono font-semibold text-slate-900">{code.code}</td>
                    <td className="px-4 py-3 font-semibold text-brand-amber">{code.discount_percent}%</td>
                    <td className="px-4 py-3 text-slate-500 max-w-xs truncate">
                      {code.description ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {code.times_used}
                      {code.max_uses != null ? ` / ${code.max_uses}` : ""}
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {code.expires_at
                        ? new Date(code.expires_at).toLocaleDateString()
                        : "Never"}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleToggle(code.id, code.active)}
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${
                          code.active ? "bg-emerald-500" : "bg-slate-200"
                        }`}
                        aria-label={code.active ? "Deactivate" : "Activate"}
                      >
                        <span
                          className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
                            code.active ? "translate-x-5" : "translate-x-0.5"
                          }`}
                        />
                      </button>
                    </td>
                    <td className="px-4 py-3 text-slate-400">
                      {new Date(code.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create modal */}
      {showModal && (
        <>
          <div
            className="fixed inset-0 bg-black/40 z-40"
            onClick={() => { setShowModal(false); resetForm(); }}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-display text-lg font-bold text-slate-900">Create discount code</h2>
                <button
                  onClick={() => { setShowModal(false); resetForm(); }}
                  className="text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Code</label>
                  <Input
                    value={formCode}
                    onChange={(e) => setFormCode(e.target.value.toUpperCase())}
                    placeholder="e.g. PAVAN50"
                    required
                    className="font-mono"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Discount %
                  </label>
                  <Input
                    type="number"
                    min="1"
                    max="100"
                    value={formPct}
                    onChange={(e) => setFormPct(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Description (optional)
                  </label>
                  <Input
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    placeholder="e.g. Beta tester discount"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Max uses (blank = unlimited)
                  </label>
                  <Input
                    type="number"
                    min="1"
                    value={formMaxUses}
                    onChange={(e) => setFormMaxUses(e.target.value)}
                    placeholder="Leave blank for unlimited"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Expires at (optional)
                  </label>
                  <Input
                    type="date"
                    value={formExpiresAt}
                    onChange={(e) => setFormExpiresAt(e.target.value)}
                  />
                </div>
                {createError && <p className="text-sm text-red-500">{createError}</p>}
                <div className="flex gap-2 pt-1">
                  <Button
                    type="submit"
                    variant="brand-primary"
                    disabled={creating}
                    className="flex-1"
                  >
                    {creating ? "Creating…" : "Create code"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => { setShowModal(false); resetForm(); }}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </>
      )}
    </>
  );
}
