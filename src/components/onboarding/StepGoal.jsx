import React, { useState } from "react";
import { GOALS, ACTIVITY_LEVELS, kgToLbs, lbsToKg } from "@/lib/nutrition";
import { cn } from "@/lib/utils";
import { Field, inputCls, NextBtn, BackBtn } from "./shared";

export default function StepGoal({ data, onNext, onBack }) {
  const imperial = data.units === "imperial";
  const [goal, setGoal] = useState(data.goal || "");
  const [activity, setActivity] = useState(data.activity_level || "moderate");
  const [goalWeight, setGoalWeight] = useState(
    data.goal_weight_kg ? (imperial ? +kgToLbs(data.goal_weight_kg).toFixed(1) : data.goal_weight_kg) : ""
  );

  const card = (active) =>
    cn(
      "w-full text-left rounded-2xl border p-3.5 transition",
      active ? "border-emerald-500 bg-emerald-50" : "border-[#E2E8F0] bg-white hover:bg-slate-50"
    );

  const submit = () =>
    onNext({
      goal,
      activity_level: activity,
      goal_weight_kg: goalWeight
        ? imperial
          ? +lbsToKg(Number(goalWeight)).toFixed(1)
          : Number(goalWeight)
        : null,
    });

  return (
    <div className="space-y-5">
      <Field label="What's your goal?">
        <div className="space-y-2">
          {GOALS.map((g) => (
            <button key={g.value} onClick={() => setGoal(g.value)} className={card(goal === g.value)}>
              <span className="block text-sm font-bold text-[#0F172A]">{g.label}</span>
              <span className="block text-xs text-[#64748B] mt-0.5">{g.hint}</span>
            </button>
          ))}
        </div>
      </Field>
      <Field label="Activity level">
        <div className="space-y-2">
          {ACTIVITY_LEVELS.map((a) => (
            <button key={a.value} onClick={() => setActivity(a.value)} className={card(activity === a.value)}>
              <span className="flex items-center justify-between">
                <span>
                  <span className="block text-sm font-bold text-[#0F172A]">{a.label}</span>
                  <span className="block text-xs text-[#64748B] mt-0.5">{a.hint}</span>
                </span>
                {activity === a.value && <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />}
              </span>
            </button>
          ))}
        </div>
      </Field>
      <Field label={`Goal weight (${imperial ? "lbs" : "kg"}, optional)`}>
        <input
          type="number"
          step="0.1"
          value={goalWeight}
          onChange={(e) => setGoalWeight(e.target.value)}
          className={inputCls}
        />
      </Field>
      <div className="flex items-center justify-between">
        <BackBtn onClick={onBack} />
        <div className="w-32">
          <NextBtn disabled={!goal} onClick={submit} />
        </div>
      </div>
    </div>
  );
}
