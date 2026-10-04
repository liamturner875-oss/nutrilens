export const ACTIVITY_LEVELS = [
  { value: "sedentary", label: "Sedentary", hint: "Little or no exercise", multiplier: 1.2 },
  { value: "light", label: "Lightly active", hint: "Exercise 1–3 days/week", multiplier: 1.375 },
  { value: "moderate", label: "Moderately active", hint: "Exercise 3–5 days/week", multiplier: 1.55 },
  { value: "very_active", label: "Very active", hint: "Exercise 6–7 days/week", multiplier: 1.725 },
];

export const GOALS = [
  { value: "lose_weight", label: "Weight loss", hint: "−500 kcal/day · ~0.5 kg per week", adjustment: -500 },
  { value: "slight_deficit", label: "Slight deficit", hint: "−250 kcal/day · gentle cut", adjustment: -250 },
  { value: "maintain", label: "Maintain", hint: "Stay at your current weight", adjustment: 0 },
  { value: "lean_bulk", label: "Lean bulk", hint: "+250 kcal/day · minimal fat gain", adjustment: 250 },
  { value: "bulk", label: "Bulk", hint: "+500 kcal/day · maximum growth", adjustment: 500 },
];

export const MACRO_SPLITS = [
  { value: "balanced", label: "Balanced", hint: "40C / 30P / 30F", pct: { carbs: 0.4, protein: 0.3, fats: 0.3 } },
  { value: "high_protein", label: "High protein", hint: "35C / 40P / 25F", pct: { carbs: 0.35, protein: 0.4, fats: 0.25 } },
  { value: "keto", label: "Keto", hint: "8C / 27P / 65F", pct: { carbs: 0.08, protein: 0.27, fats: 0.65 } },
  { value: "bulk", label: "Bulk", hint: "50C / 25P / 25F", pct: { carbs: 0.5, protein: 0.25, fats: 0.25 } },
  { value: "custom", label: "Custom", hint: "Set your own grams" },
];

// Mifflin-St Jeor basal metabolic rate
export function calcBMR(weightKg, heightCm, age, sex) {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return Math.round(sex === "male" ? base + 5 : base - 161);
}

export function calcTargets(p) {
  const g = GOALS.find((x) => x.value === p.goal) || GOALS[2];
  const a = ACTIVITY_LEVELS.find((x) => x.value === p.activity_level) || ACTIVITY_LEVELS[2];
  const tdee = calcBMR(p.weight_kg, p.height_cm, p.age, p.sex) * a.multiplier;
  const calories = Math.max(1200, Math.round(tdee + g.adjustment + (p.tdee_adjustment || 0)));
  const split = MACRO_SPLITS.find((s) => s.value === (p.macro_split || "balanced"));
  if (split && split.pct) {
    return {
      calories,
      protein: Math.round((calories * split.pct.protein) / 4),
      carbs: Math.round((calories * split.pct.carbs) / 4),
      fats: Math.round((calories * split.pct.fats) / 9),
    };
  }
  // custom grams
  return {
    calories,
    protein: Math.round(p.custom_protein || (calories * 0.3) / 4),
    carbs: Math.round(p.custom_carbs || (calories * 0.4) / 4),
    fats: Math.round(p.custom_fats || (calories * 0.3) / 9),
  };
}

// Dynamic TDEE adaptation: nudge daily calories when the weight trend
// diverges from the goal direction. Uses weigh-ins from the last 14 days.
export function nextAdjustment(entries, profile) {
  const cur = profile.tdee_adjustment || 0;
  if (!entries || entries.length < 2) return cur;
  const sorted = [...entries].sort((x, y) => new Date(x.logged_at) - new Date(y.logged_at));
  const latest = sorted[sorted.length - 1];
  const cutoff = new Date(latest.logged_at).getTime() - 14 * 864e5;
  const window = sorted.filter(
    (e) => e.id !== latest.id && new Date(e.logged_at).getTime() >= cutoff
  );
  if (!window.length) return cur;
  const ref = window[0];
  const days = (new Date(latest.logged_at) - new Date(ref.logged_at)) / 864e5;
  if (days < 7) return cur; // need at least a week of trend
  const ratePerWeek = ((latest.weight_kg - ref.weight_kg) / days) * 7;
  const losing = profile.goal === "lose_weight" || profile.goal === "slight_deficit";
  const gaining = profile.goal === "bulk" || profile.goal === "lean_bulk";
  if (losing) {
    if (ratePerWeek > -0.15) return Math.max(cur - 100, -500); // stalled — trim calories
    if (ratePerWeek < -1.0) return Math.min(cur + 100, 0); // losing too fast — ease up
  } else if (gaining) {
    if (ratePerWeek < 0.05) return Math.min(cur + 100, 500); // no gain — add calories
    if (ratePerWeek > 0.75) return Math.max(cur - 100, 0); // gaining too fast — pull back
  }
  return cur;
}

export const kgToLbs = (kg) => kg * 2.20462;
export const lbsToKg = (lbs) => lbs / 2.20462;
export const cmToFtIn = (cm) => {
  const totalIn = Math.round(cm / 2.54);
  return { ft: Math.floor(totalIn / 12), inch: totalIn % 12 };
};
export const ftInToCm = (ft, inch) => (Number(ft) * 12 + Number(inch)) * 2.54;
export const fmtWeight = (kg, units) =>
  units === "imperial" ? `${kgToLbs(kg).toFixed(1)} lbs` : `${kg.toFixed(1)} kg`;
