import React from "react";
import { motion } from "framer-motion";

const TOKENS = {
  calorie: "hsl(var(--calorie))",
  protein: "hsl(var(--protein))",
  carbs: "hsl(var(--carbs))",
  fats: "hsl(var(--fats))",
};

export default function MacroRings({ totals, targets }) {
  const rings = [
    { key: "calories", label: "Calories", value: totals.calories, target: targets.calories, unit: "", color: TOKENS.calorie },
    { key: "protein", label: "Protein", value: totals.protein, target: targets.protein, unit: "g", color: TOKENS.protein },
    { key: "carbs", label: "Carbs", value: totals.carbs, target: targets.carbs, unit: "g", color: TOKENS.carbs },
    { key: "fats", label: "Fats", value: totals.fats, target: targets.fats, unit: "g", color: TOKENS.fats },
  ];

  return (
    <div className="grid grid-cols-2 gap-4">
      {rings.map((r) => (
        <Ring key={r.key} {...r} />
      ))}
    </div>
  );
}

function Ring({ label, value, target, unit, color }) {
  const size = 132;
  const stroke = 12;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.min(1, (value || 0) / (target || 1));
  const offset = c * (1 - pct);
  const over = (value || 0) > target;

  return (
    <div className="flex flex-col items-center justify-center rounded-[20px] bg-white border border-[#E2E8F0] p-4">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#EEF2F6" strokeWidth={stroke} />
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={color}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={c}
            initial={{ strokeDashoffset: c }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 0.9, ease: "easeOut" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold font-heading text-[#0F172A] tabular-nums">
            {Math.round(value || 0)}
            <span className="text-sm font-medium text-[#64748B]">{unit}</span>
          </span>
          <span className="text-[11px] text-[#64748B] mt-0.5">of {target}{unit}</span>
        </div>
      </div>
      <span className="mt-2 text-sm font-semibold text-[#0F172A]">{label}</span>
      {over && <span className="text-[11px] text-amber-500 font-medium">over target</span>}
    </div>
  );
}
