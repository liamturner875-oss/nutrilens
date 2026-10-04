import React from "react";
import { Flame, Trash2, Clock } from "lucide-react";

const tone = {
  light: "bg-sky-50 text-sky-600 border-sky-200",
  moderate: "bg-amber-50 text-amber-600 border-amber-200",
  vigorous: "bg-rose-50 text-rose-500 border-rose-200",
};

export default function ExerciseList({ exercises, onDelete }) {
  if (!exercises?.length) {
    return (
      <div className="rounded-[24px] bg-white border border-dashed border-[#E2E8F0] p-8 text-center">
        <p className="text-sm text-[#64748B]">No workouts logged yet — add one and the AI will estimate the burn.</p>
      </div>
    );
  }
  return (
    <div className="space-y-2">
      {exercises.map((x) => (
        <div
          key={x.id}
          className="rounded-[24px] bg-white border border-[#E2E8F0] p-4 shadow-sm flex items-center gap-3"
        >
          <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center shrink-0">
            <Flame className="w-5 h-5 text-rose-500" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold text-[#0F172A] truncate">{x.name}</p>
              <span
                className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${tone[x.intensity] || tone.moderate}`}
              >
                {x.intensity}
              </span>
            </div>
            <p className="text-xs text-[#64748B] truncate">
              <Clock className="inline w-3 h-3 -mt-0.5 mr-0.5" />
              {Math.round(x.duration_min)} min
              {x.basis ? ` · ${x.basis}` : ""}
            </p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-sm font-bold text-[#0F172A] tabular-nums">{Math.round(x.calories_burned)}</p>
            <p className="text-[10px] text-[#64748B]">kcal burned</p>
          </div>
          <button
            onClick={() => onDelete(x.id)}
            className="w-9 h-9 rounded-full flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition shrink-0"
            aria-label="Delete workout"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
