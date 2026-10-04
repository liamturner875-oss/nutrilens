import React, { useState } from "react";
import { useProfile } from "@/lib/ProfileContext";
import { MACRO_SPLITS } from "@/lib/nutrition";
import { cn } from "@/lib/utils";
import { SlidersHorizontal, Wand2 } from "lucide-react";

export default function PlanCard() {
  const { profile, targets, updateProfile } = useProfile();
  const split = profile?.macro_split || "balanced";
  const [saving, setSaving] = useState(false);
  const [custom, setCustom] = useState({
    protein: profile?.custom_protein ?? "",
    carbs: profile?.custom_carbs ?? "",
    fats: profile?.custom_fats ?? "",
  });

  const choose = async (value) => {
    setSaving(true);
    try {
      await updateProfile({ macro_split: value });
    } finally {
      setSaving(false);
    }
  };

  const saveCustom = async () => {
    setSaving(true);
    try {
      await updateProfile({
        macro_split: "custom",
        custom_protein: Number(custom.protein) || 0,
        custom_carbs: Number(custom.carbs) || 0,
        custom_fats: Number(custom.fats) || 0,
      });
    } finally {
      setSaving(false);
    }
  };

  const customKeys = ["protein", "carbs", "fats"];

  return (
    <div className="rounded-[20px] bg-white border border-[#E2E8F0] p-5">
      <div className="flex items-center gap-2 mb-1">
        <SlidersHorizontal className="w-4 h-4 text-emerald-500" />
        <h2 className="font-heading font-bold text-base text-[#0F172A]">Your plan</h2>
      </div>
      <p className="text-xs text-[#64748B] mb-4">
        Current targets: {targets.calories} kcal · P {targets.protein}g · C {targets.carbs}g · F {targets.fats}g
      </p>
      <div className="flex flex-wrap gap-2 mb-3">
        {MACRO_SPLITS.map((s) => (
          <button
            key={s.value}
            onClick={() => choose(s.value)}
            disabled={saving}
            className={cn(
              "px-3.5 h-9 rounded-full text-sm font-medium border transition disabled:opacity-50",
              split === s.value
                ? "bg-[#0F172A] text-white border-[#0F172A]"
                : "bg-white text-[#64748B] border-[#E2E8F0] hover:bg-slate-50"
            )}
          >
            {s.label}
          </button>
        ))}
      </div>
      {split === "custom" && (
        <div className="space-y-2 mb-3">
          <div className="grid grid-cols-3 gap-2">
            {customKeys.map((k) => (
              <div key={k}>
                <label className="block text-[10px] font-semibold text-[#64748B] uppercase mb-1">{k} (g)</label>
                <input
                  type="number"
                  value={custom[k]}
                  onChange={(e) => setCustom((c) => ({ ...c, [k]: e.target.value }))}
                  className="w-full h-10 rounded-xl border border-[#E2E8F0] px-3 text-sm text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-emerald-400"
                />
              </div>
            ))}
          </div>
          <button
            onClick={saveCustom}
            disabled={saving}
            className="h-10 w-full rounded-full bg-emerald-500 text-white text-sm font-semibold hover:bg-emerald-600 disabled:opacity-50 transition"
          >
            {saving ? "Saving…" : "Save custom grams"}
          </button>
        </div>
      )}
      {profile?.tdee_adjustment ? (
        <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-2xl px-3 py-2 flex items-center gap-1.5">
          <Wand2 className="w-3.5 h-3.5 shrink-0" />
          Adaptive adjustment active: {profile.tdee_adjustment > 0 ? "+" : ""}
          {profile.tdee_adjustment} kcal/day, auto-tuned from your weight trend.
        </p>
      ) : null}
    </div>
  );
}
