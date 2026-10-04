import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useProfile } from "@/lib/ProfileContext";
import { RotateCcw } from "lucide-react";

export default function ResetProfileButton() {
  const { refresh } = useProfile();
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);

  const reset = async () => {
    setBusy(true);
    try {
      const me = await base44.auth.me();
      await base44.entities.Profile.deleteMany({ created_by_id: me.id });
      await refresh();
    } finally {
      setBusy(false);
    }
  };

  if (!confirming) {
    return (
      <button
        onClick={() => setConfirming(true)}
        className="inline-flex items-center gap-1.5 h-10 px-4 rounded-full bg-white border border-[#E2E8F0] text-sm font-semibold text-[#64748B] hover:bg-slate-50 transition"
      >
        <RotateCcw className="w-4 h-4" /> Reset my details
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-[#64748B] font-medium">Redo setup?</span>
      <button
        onClick={() => setConfirming(false)}
        disabled={busy}
        className="h-10 px-4 rounded-full bg-white border border-[#E2E8F0] text-sm font-semibold text-[#64748B] hover:bg-slate-50 disabled:opacity-50"
      >
        Cancel
      </button>
      <button
        onClick={reset}
        disabled={busy}
        className="h-10 px-4 rounded-full bg-rose-500 text-white text-sm font-semibold hover:bg-rose-600 disabled:opacity-50"
      >
        {busy ? "Resetting…" : "Yes, redo setup"}
      </button>
    </div>
  );
}
