import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useProfile } from "@/lib/ProfileContext";
import useToday from "@/lib/useToday";
import { Droplets, GlassWater, CupSoda, Pencil, Check } from "lucide-react";

export default function HydrationCard() {
  const { profile, updateProfile } = useProfile();
  const goal = profile?.water_goal_ml || 2500;
  const today = useToday(); // rolls over at midnight so hydration resets
  const [todayMl, setTodayMl] = useState(null);
  const [recordId, setRecordId] = useState(null);
  const [editGoal, setEditGoal] = useState(false);
  const [goalVal, setGoalVal] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      let rec = null;
      try {
        const list = await base44.entities.HydrationLog.list("-created_date", 30);
        rec = (list || []).find(
          (w) => new Date(w.logged_at || w.created_date).toDateString() === today
        );
      } catch (e) {
        /* start at zero if the log can't be read */
      }
      if (cancelled) return;
      if (rec) {
        setTodayMl(rec.water_ml || 0);
        setRecordId(rec.id);
      } else {
        // No record for this day yet — clear yesterday's so new taps start fresh
        setTodayMl(0);
        setRecordId(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [today]);

  const add = async (ml) => {
    const next = (todayMl || 0) + ml;
    setTodayMl(next);
    try {
      if (recordId) {
        await base44.entities.HydrationLog.update(recordId, { water_ml: next });
      } else {
        const rec = await base44.entities.HydrationLog.create({
          water_ml: next,
          logged_at: new Date().toISOString(),
        });
        setRecordId(rec.id);
      }
    } catch (e) {
      /* optimistic UI — corrected on next load */
    }
  };

  const saveGoal = async () => {
    const v = Number(goalVal);
    if (!v || v <= 0) return;
    await updateProfile({ water_goal_ml: v });
    setEditGoal(false);
  };

  const pct = Math.min(100, ((todayMl || 0) / goal) * 100);

  return (
    <div className="rounded-[20px] bg-white border border-[#E2E8F0] p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Droplets className="w-4 h-4 text-sky-500" />
          <h3 className="font-heading font-bold text-sm text-[#0F172A]">Hydration</h3>
        </div>
        <span className="text-xs font-semibold text-sky-700 tabular-nums">
          {((todayMl || 0) / 1000).toFixed(1)}L / {(goal / 1000).toFixed(1)}L
        </span>
      </div>
      <div className="h-2.5 rounded-full bg-sky-50 overflow-hidden mb-3">
        <div className="h-2.5 rounded-full bg-sky-400 transition-all" style={{ width: `${pct}%` }} />
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={() => add(250)}
          className="h-9 px-3.5 rounded-full bg-sky-50 text-sky-700 text-xs font-semibold border border-sky-100 hover:bg-sky-100 transition inline-flex items-center gap-1.5"
        >
          <GlassWater className="w-3.5 h-3.5" /> Glass · 250ml
        </button>
        <button
          onClick={() => add(500)}
          className="h-9 px-3.5 rounded-full bg-sky-50 text-sky-700 text-xs font-semibold border border-sky-100 hover:bg-sky-100 transition inline-flex items-center gap-1.5"
        >
          <CupSoda className="w-3.5 h-3.5" /> Bottle · 500ml
        </button>
        <button
          onClick={() => {
            setGoalVal(String(goal));
            setEditGoal(true);
          }}
          className="ml-auto w-8 h-8 rounded-full border border-[#E2E8F0] text-[#64748B] hover:bg-slate-50 flex items-center justify-center"
          aria-label="Edit water goal"
        >
          <Pencil className="w-3.5 h-3.5" />
        </button>
      </div>
      {editGoal && (
        <div className="flex gap-2 mt-3">
          <input
            type="number"
            value={goalVal}
            onChange={(e) => setGoalVal(e.target.value)}
            placeholder="Daily goal (ml)"
            className="flex-1 h-10 rounded-full border border-[#E2E8F0] px-4 text-sm text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-emerald-400"
          />
          <button
            onClick={saveGoal}
            className="h-10 px-4 rounded-full bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1 hover:bg-emerald-600"
          >
            <Check className="w-3.5 h-3.5" /> Set goal
          </button>
        </div>
      )}
    </div>
  );
}
