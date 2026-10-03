import React, { useState } from "react";
import { useProfile } from "@/lib/ProfileContext";
import WeightChart from "@/components/WeightChart";
import WeeklyStats from "@/components/WeeklyStats";
import PlanCard from "@/components/PlanCard";
import ProgressPhotos from "@/components/ProgressPhotos";
import ExportButtons from "@/components/ExportButtons";
import ResetProfileButton from "@/components/ResetProfileButton";
import { fmtWeight, lbsToKg } from "@/lib/nutrition";
import { Scale, TrendingDown, TrendingUp, Target } from "lucide-react";

export default function Progress() {
  const { profile, weightEntries, addWeight } = useProfile();
  const imperial = profile?.units === "imperial";
  const [val, setVal] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    const n = Number(val);
    if (!n || n <= 0) return;
    setSaving(true);
    try {
      await addWeight(imperial ? +lbsToKg(n).toFixed(1) : n);
      setVal("");
    } finally {
      setSaving(false);
    }
  };

  const current = profile?.weight_kg;
  const first = weightEntries[0];
  const change = first && current != null ? current - first.weight_kg : null;
  const goalWeight = profile?.goal_weight_kg;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Scale className="w-5 h-5 text-emerald-500" />
          <h1 className="font-heading font-extrabold text-2xl text-[#0F172A]">Weight progress</h1>
        </div>
        <div className="flex items-center gap-2">
          <ExportButtons />
          <ResetProfileButton />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-[20px] bg-white border border-[#E2E8F0] p-5 text-center">
          <p className="text-xs font-semibold text-[#64748B] uppercase tracking-wide">Current</p>
          <p className="text-2xl font-bold font-heading text-[#0F172A] mt-1">
            {current != null ? fmtWeight(current, profile.units) : "—"}
          </p>
        </div>
        <div className="rounded-[20px] bg-white border border-[#E2E8F0] p-5 text-center">
          <p className="text-xs font-semibold text-[#64748B] uppercase tracking-wide">Since start</p>
          {change != null ? (
            <p
              className={`text-2xl font-bold font-heading mt-1 flex items-center justify-center gap-1 ${
                change <= 0 ? "text-emerald-600" : "text-amber-600"
              }`}
            >
              {change <= 0 ? <TrendingDown className="w-5 h-5" /> : <TrendingUp className="w-5 h-5" />}
              {fmtWeight(Math.abs(change), profile.units)}
            </p>
          ) : (
            <p className="text-2xl font-bold font-heading text-[#0F172A] mt-1">—</p>
          )}
        </div>
      </div>

      {goalWeight != null && (
        <div className="rounded-[20px] bg-white border border-[#E2E8F0] p-5 flex items-center gap-3">
          <Target className="w-5 h-5 text-emerald-500 shrink-0" />
          <p className="text-sm text-[#64748B]">
            Goal weight <span className="font-bold text-[#0F172A]">{fmtWeight(goalWeight, profile.units)}</span>
            {current != null && <> — {fmtWeight(Math.abs(current - goalWeight), profile.units)} to go</>}
          </p>
        </div>
      )}

      <PlanCard />
      <WeeklyStats />

      <div className="rounded-[20px] bg-white border border-[#E2E8F0] p-5">
        <p className="text-sm font-semibold text-[#0F172A] mb-3">
          Log today's weight ({imperial ? "lbs" : "kg"})
        </p>
        <div className="flex gap-3">
          <input
            type="number"
            step="0.1"
            value={val}
            onChange={(e) => setVal(e.target.value)}
            placeholder={imperial ? "160" : "72.5"}
            className="flex-1 h-12 rounded-full border border-[#E2E8F0] px-5 text-[#0F172A] font-medium focus:outline-none focus:ring-2 focus:ring-emerald-400"
          />
          <button
            onClick={submit}
            disabled={saving || !Number(val)}
            className="h-12 px-6 rounded-full bg-emerald-500 text-white font-semibold hover:bg-emerald-600 disabled:opacity-40 transition"
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
        <p className="text-[11px] text-[#64748B] mt-2">
          Weigh-ins update your macro targets automatically.
        </p>
      </div>

      <div className="rounded-[20px] bg-white border border-[#E2E8F0] p-5">
        <p className="text-sm font-semibold text-[#0F172A] mb-4">Trend</p>
        <WeightChart entries={weightEntries} imperial={imperial} />
      </div>

      <ProgressPhotos />
    </div>
  );
}
