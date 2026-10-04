import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Flame, Loader2 } from "lucide-react";

const BURN_SCHEMA = {
  type: "object",
  properties: {
    calories_burned: { type: "number" },
    confidence: { type: "number" },
    basis: { type: "string" },
  },
};

const intensities = [
  { value: "light", label: "Light" },
  { value: "moderate", label: "Moderate" },
  { value: "vigorous", label: "Vigorous" },
];

export default function ExerciseForm({ weightKg, onSaved }) {
  const [name, setName] = useState("");
  const [duration, setDuration] = useState("");
  const [intensity, setIntensity] = useState("moderate");
  const [estimating, setEstimating] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    const mins = parseFloat(duration);
    if (!name.trim() || !mins || mins <= 0) return;
    setEstimating(true);
    setError("");
    try {
      const weightNote = weightKg ? `${Math.round(weightKg)} kg` : "unknown weight — assume 75 kg";
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a fitness calorie-expenditure expert. Estimate the calories burned in this workout:
Activity: "${name.trim()}"
Duration: ${mins} minutes
Intensity: ${intensity}
The person weighs ${weightNote}.
Base the estimate on standard MET values for the activity, scaled by body weight and duration. Be realistic and conservative.
Return calories_burned (a realistic number), confidence (0-100), and basis (one short sentence naming the MET value or method used).`,
        response_json_schema: BURN_SCHEMA,
      });
      const rec = await base44.entities.Exercise.create({
        name: name.trim(),
        duration_min: mins,
        intensity,
        calories_burned: Math.round(res?.calories_burned || 0),
        confidence: res?.confidence ?? 70,
        basis: res?.basis || "",
        logged_at: new Date().toISOString(),
      });
      setName("");
      setDuration("");
      onSaved(rec);
    } catch (err) {
      setError("Couldn't estimate this workout. Please try again.");
    } finally {
      setEstimating(false);
    }
  };

  return (
    <form onSubmit={submit} className="rounded-[24px] bg-white border border-[#E2E8F0] p-5 shadow-sm space-y-4">
      <h2 className="font-heading font-bold text-lg text-[#0F172A]">Log a workout</h2>
      <div>
        <label className="text-xs font-semibold text-[#64748B] uppercase tracking-wide">Activity</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. outdoor run, cycling, weight session, yoga"
          className="w-full mt-1 h-11 rounded-full border border-[#E2E8F0] px-4 text-sm text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-emerald-400"
        />
      </div>
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <label className="text-xs font-semibold text-[#64748B] uppercase tracking-wide">Minutes</label>
          <input
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            type="number"
            min="1"
            placeholder="30"
            className="w-full mt-1 h-11 rounded-full border border-[#E2E8F0] px-4 text-sm text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-emerald-400"
          />
        </div>
        <div className="flex-1">
          <label className="text-xs font-semibold text-[#64748B] uppercase tracking-wide">Intensity</label>
          <div className="flex gap-1.5 mt-1">
            {intensities.map((i) => (
              <button
                type="button"
                key={i.value}
                onClick={() => setIntensity(i.value)}
                className={`flex-1 h-11 rounded-full text-xs font-semibold border transition ${
                  intensity === i.value
                    ? "bg-[#0F172A] text-white border-[#0F172A]"
                    : "bg-white text-[#64748B] border-[#E2E8F0] hover:bg-slate-50"
                }`}
              >
                {i.label}
              </button>
            ))}
          </div>
        </div>
      </div>
      {error && <p className="text-sm text-rose-600">{error}</p>}
      <button
        type="submit"
        disabled={estimating || !name.trim() || !duration}
        className="w-full h-12 rounded-full bg-emerald-500 text-white font-semibold flex items-center justify-center gap-2 hover:bg-emerald-600 disabled:opacity-50 transition"
      >
        {estimating ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" /> Estimating burn…
          </>
        ) : (
          <>
            <Flame className="w-4 h-4" /> Add workout — AI estimates the burn
          </>
        )}
      </button>
    </form>
  );
}
