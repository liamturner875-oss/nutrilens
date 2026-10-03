import React from "react";
import { calcTargets } from "@/lib/nutrition";
import { cn } from "@/lib/utils";
import { Flame, Beef, Wheat, Droplet } from "lucide-react";
import { NextBtn, BackBtn } from "./shared";

export default function StepResults({ data, onBack, onFinish, saving }) {
  const t = calcTargets(data);
  const stats = [
    { icon: Flame, label: "Calories", value: t.calories, iconCls: "text-sky-600", bg: "bg-sky-50" },
    { icon: Beef, label: "Protein", value: `${t.protein}g`, iconCls: "text-violet-600", bg: "bg-violet-50" },
    { icon: Wheat, label: "Carbs", value: `${t.carbs}g`, iconCls: "text-amber-600", bg: "bg-amber-50" },
    { icon: Droplet, label: "Fats", value: `${t.fats}g`, iconCls: "text-rose-500", bg: "bg-rose-50" },
  ];

  return (
    <div className="space-y-6">
      <p className="text-sm text-[#64748B]">
        Based on your stats and goal, here are your daily targets:
      </p>
      <div className="grid grid-cols-2 gap-3">
        {stats.map((s) => (
          <div key={s.label} className={cn("rounded-2xl p-4 flex flex-col items-center gap-1", s.bg)}>
            <s.icon className={cn("w-5 h-5", s.iconCls)} />
            <span className="text-xl font-bold font-heading text-[#0F172A]">{s.value}</span>
            <span className="text-xs font-medium text-[#64748B]">{s.label}</span>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between">
        <BackBtn onClick={onBack} />
        <div className="w-48">
          <NextBtn disabled={saving} onClick={onFinish} label={saving ? "Saving…" : "Start tracking"} />
        </div>
      </div>
    </div>
  );
}
