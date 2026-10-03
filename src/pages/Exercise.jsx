import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { useProfile } from "@/lib/ProfileContext";
import { useMeals } from "@/lib/MealContext";
import { Flame, Dumbbell, Watch } from "lucide-react";
import ExerciseForm from "@/components/ExerciseForm";
import ExerciseList from "@/components/ExerciseList";

export default function Exercise() {
  const { profile } = useProfile();
  const { totals, targets } = useMeals();
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const me = await base44.auth.me();
      const all = await base44.entities.Exercise.filter({ created_by_id: me.id }, "-created_date", 200);
      setExercises(all || []);
    } catch (e) {
      setExercises([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const today = exercises.filter(
    (x) => new Date(x.logged_at || x.created_date).toDateString() === new Date().toDateString()
  );
  const burnedToday = Math.round(today.reduce((s, x) => s + (x.calories_burned || 0), 0));
  const netToday = Math.round(targets.calories - totals.calories + burnedToday);

  const onDelete = async (id) => {
    await base44.entities.Exercise.delete(id);
    setExercises((prev) => prev.filter((x) => x.id !== id));
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[2fr_3fr] gap-6">
      <div className="space-y-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Dumbbell className="w-5 h-5 text-rose-500" />
            <h1 className="font-heading font-extrabold text-2xl text-[#0F172A]">Workouts</h1>
          </div>
          <p className="text-sm text-[#64748B]">
            Log any activity — the AI estimates calories burned from your body weight, duration and intensity.
          </p>
        </div>
        <ExerciseForm weightKg={profile?.weight_kg} onSaved={() => refresh()} />
        <div className="rounded-[24px] bg-white border border-[#E2E8F0] p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <Watch className="w-4 h-4 text-[#64748B]" />
            <h3 className="font-heading font-bold text-sm text-[#0F172A]">Fitness trackers</h3>
          </div>
          <p className="text-xs text-[#64748B] leading-relaxed">
            Direct sync with Apple Health, Garmin and Whoop isn't available on this platform — so log tracker
            workouts here instead (e.g. "trail run, 47 min") and the AI handles the burn estimate.
          </p>
        </div>
      </div>

      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-3">
          <SummaryTile label="Burned today" value={`${burnedToday} kcal`} tone="text-rose-500" />
          <SummaryTile label="Net calories left today" value={`${netToday} kcal`} tone="text-sky-600" />
        </div>
        <div>
          <h2 className="font-heading font-bold text-lg text-[#0F172A] mb-3">Today's workouts</h2>
          {loading ? (
            <div className="rounded-[24px] bg-white border border-[#E2E8F0] p-8 flex justify-center">
              <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" />
            </div>
          ) : (
            <ExerciseList exercises={today} onDelete={onDelete} />
          )}
        </div>
      </div>
    </div>
  );
}

function SummaryTile({ label, value, tone }) {
  return (
    <div className="rounded-[24px] bg-white border border-[#E2E8F0] p-5 shadow-sm">
      <p className="text-xs text-[#64748B] font-semibold uppercase tracking-wide">{label}</p>
      <p className={`font-heading font-extrabold text-2xl mt-1 tabular-nums ${tone}`}>{value}</p>
    </div>
  );
}
