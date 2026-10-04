import React from "react";
import { useMeals } from "@/lib/MealContext";
import { CalendarCheck, Flame, Beef, Leaf, Award } from "lucide-react";

export default function WeeklyStats() {
  const { weekly, targets } = useMeals();

  const tiles = [
    { icon: Flame, label: "Avg calories / tracked day", value: `${weekly.avgCalories}` },
    { icon: CalendarCheck, label: "Days tracked (last 7)", value: `${weekly.daysTracked}/7` },
    { icon: Beef, label: "Protein goal hits", value: `${weekly.proteinGoalDays}` },
    { icon: Leaf, label: "Avg fiber", value: `${weekly.avgFiber}g` },
  ];

  let insight;
  if (!weekly.daysTracked) {
    insight = "Log a few meals — your weekly balance matters more than any single day.";
  } else {
    const parts = [];
    if (weekly.proteinGoalDays >= 5) parts.push(`Strong week — protein goal hit ${weekly.proteinGoalDays} days`);
    else if (weekly.proteinGoalDays >= 3) parts.push(`Protein goal hit on ${weekly.proteinGoalDays} days — keep it up`);
    else parts.push("Try to work protein into more meals this week");
    parts.push(`${weekly.avgCalories} kcal avg vs ${targets.calories} target`);
    insight = parts.join(" · ");
  }

  return (
    <div className="rounded-[20px] bg-white border border-[#E2E8F0] p-5">
      <div className="flex items-center gap-2 mb-4">
        <Award className="w-4 h-4 text-emerald-500" />
        <h2 className="font-heading font-bold text-base text-[#0F172A]">This week</h2>
      </div>
      <div className="grid grid-cols-2 gap-3 mb-4">
        {tiles.map((t) => (
          <div key={t.label} className="rounded-2xl bg-slate-50 p-3.5 flex items-center gap-3">
            <t.icon className="w-4 h-4 text-emerald-500 shrink-0" />
            <div className="min-w-0">
              <p className="text-base font-bold text-[#0F172A] tabular-nums leading-tight">{t.value}</p>
              <p className="text-[10px] text-[#64748B] font-medium">{t.label}</p>
            </div>
          </div>
        ))}
      </div>
      <p className="text-xs text-[#64748B] leading-relaxed">{insight}</p>
    </div>
  );
}
