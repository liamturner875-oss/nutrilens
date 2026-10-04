import React, { useState } from "react";
import { Flame, Beef, Wheat, Droplet, Check, Sparkles, Save, BookmarkPlus } from "lucide-react";
import { Image } from "@/components/ui/image";
import { base44 } from "@/api/base44Client";

const mealTypes = [
  { value: "breakfast", label: "Breakfast" },
  { value: "lunch", label: "Lunch" },
  { value: "dinner", label: "Dinner" },
  { value: "snack", label: "Snack" },
];

export default function AnalysisPanel({ analysis, photoUrl, onSave, onRevise, saving, saved }) {
  const [mealType, setMealType] = useState("lunch");
  const [templateSaving, setTemplateSaving] = useState(false);
  const [templateSaved, setTemplateSaved] = useState(false);
  const [showRevise, setShowRevise] = useState(false);
  const [note, setNote] = useState("");
  const [revising, setRevising] = useState(false);

  // Plausible calorie range — from the AI when provided, otherwise derived from confidence
  const spread = Math.round((analysis.calories * (100 - (analysis.confidence || 70)) * 0.8) / 100);
  const calLow = Math.max(0, Math.round(analysis.calories_low ?? analysis.calories - spread));
  const calHigh = Math.round(analysis.calories_high ?? analysis.calories + spread);

  const saveTemplate = async () => {
    setTemplateSaving(true);
    try {
      await base44.entities.Template.create({
        name: analysis.description,
        description: analysis.description,
        calories: analysis.calories,
        protein: analysis.protein,
        carbs: analysis.carbs,
        fats: analysis.fats,
        fiber: analysis.fiber || 0,
        sodium_mg: analysis.sodium_mg || 0,
        potassium_mg: analysis.potassium_mg || 0,
      });
      setTemplateSaved(true);
    } finally {
      setTemplateSaving(false);
    }
  };

  return (
    <div className="rounded-[24px] bg-white border border-[#E2E8F0] p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-emerald-500" />
          <h3 className="font-heading font-bold text-[#0F172A]">AI Breakdown</h3>
        </div>
        <ScoreBadge score={analysis.confidence} />
      </div>

      <p className="text-sm font-semibold text-[#0F172A] mb-1">{analysis.description}</p>
      {analysis.revised && (
        <p className="text-xs text-emerald-700 mb-1">Revised per your note — original estimate {Math.round(analysis.original_calories || analysis.calories)} kcal</p>
      )}
      <p className="text-xs text-[#64748B] mb-4">
        Likely range: {calLow}–{calHigh} kcal
      </p>

      {/* Macro summary row */}
      <div className="grid grid-cols-4 gap-2 mb-5">
        <Stat icon={Flame} label="Cal" value={Math.round(analysis.calories)} color="text-sky-600 bg-sky-50" />
        <Stat icon={Beef} label="Protein" value={`${Math.round(analysis.protein)}g`} color="text-violet-600 bg-violet-50" />
        <Stat icon={Wheat} label="Carbs" value={`${Math.round(analysis.carbs)}g`} color="text-amber-600 bg-amber-50" />
        <Stat icon={Droplet} label="Fats" value={`${Math.round(analysis.fats)}g`} color="text-rose-500 bg-rose-50" />
      </div>

      {/* Micronutrients */}
      <div className="grid grid-cols-3 gap-2 mb-5">
        <MiniStat label="Fiber" value={`${Math.round(analysis.fiber || 0)}g`} />
        <MiniStat label="Sodium" value={`${Math.round(analysis.sodium_mg || 0)}mg`} />
        <MiniStat label="Potassium" value={`${Math.round(analysis.potassium_mg || 0)}mg`} />
      </div>

      {/* Items */}
      {analysis.items?.length > 0 && (
        <div className="mb-5">
          <p className="text-xs font-semibold text-[#64748B] uppercase tracking-wide mb-2">Detected items</p>
          <div className="space-y-2">
            {analysis.items.map((it, i) => (
              <div key={i} className="flex items-center justify-between text-sm py-2 px-3 rounded-xl bg-slate-50">
                <span className="font-medium text-[#0F172A]">{it.name}</span>
                <span className="text-[#64748B] tabular-nums">{Math.round(it.calories)} cal</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Correction flow */}
      {analysis.revised ? null : showRevise ? (
        <div className="mb-5">
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            placeholder='e.g. "actually 1.5 cups of rice, not 1" or "no butter on the toast"'
            className="w-full rounded-2xl border border-[#E2E8F0] p-3 text-sm text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-emerald-400 resize-none"
          />
          <div className="flex justify-end gap-2 mt-2">
            <button
              onClick={() => setShowRevise(false)}
              className="h-9 px-4 rounded-full text-sm font-semibold text-[#64748B] hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              onClick={async () => {
                setRevising(true);
                try {
                  await onRevise(note);
                  setShowRevise(false);
                  setNote("");
                } finally {
                  setRevising(false);
                }
              }}
              disabled={revising || !note.trim()}
              className="h-9 px-5 rounded-full bg-emerald-500 text-white text-sm font-semibold hover:bg-emerald-600 disabled:opacity-50"
            >
              {revising ? "Revising…" : "Revise estimate"}
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowRevise(true)}
          className="mb-5 text-sm font-semibold text-emerald-600 hover:text-emerald-700"
        >
          Something off? Adjust the estimate
        </button>
      )}

      {/* Meal type selector */}
      <p className="text-xs font-semibold text-[#64748B] uppercase tracking-wide mb-2">Meal type</p>
      <div className="flex flex-wrap gap-2 mb-4">
        {mealTypes.map((t) => (
          <button
            key={t.value}
            onClick={() => setMealType(t.value)}
            className={`px-3.5 h-9 rounded-full text-sm font-medium border transition ${
              mealType === t.value
                ? "bg-[#0F172A] text-white border-[#0F172A]"
                : "bg-white text-[#64748B] border-[#E2E8F0] hover:bg-slate-50"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <button
        onClick={saveTemplate}
        disabled={templateSaving || templateSaved}
        className="w-full h-11 rounded-full border border-[#E2E8F0] text-sm font-semibold text-[#64748B] hover:bg-slate-50 disabled:opacity-60 transition mb-2 flex items-center justify-center gap-2"
      >
        {templateSaved ? (
          <><Check className="w-4 h-4" /> Saved to quick add</>
        ) : templateSaving ? (
          "Saving…"
        ) : (
          <><BookmarkPlus className="w-4 h-4" /> Save as quick-add meal</>
        )}
      </button>
      <button
        onClick={() => onSave(mealType)}
        disabled={saving || saved}
        className="w-full h-12 rounded-full bg-emerald-500 text-white font-semibold flex items-center justify-center gap-2 hover:bg-emerald-600 disabled:opacity-60 transition"
      >
        {saved ? (
          <><Check className="w-4 h-4" /> Saved to log</>
        ) : saving ? (
          "Saving…"
        ) : (
          <><Save className="w-4 h-4" /> Log this meal</>
        )}
      </button>
    </div>
  );
}

function Stat({ icon: Icon, label, value, color }) {
  return (
    <div className={`rounded-2xl p-2.5 flex flex-col items-center gap-1 ${color.split(" ")[1]}`}>
      <Icon className={`w-4 h-4 ${color.split(" ")[0]}`} />
      <span className="text-sm font-bold text-[#0F172A] tabular-nums">{value}</span>
      <span className="text-[10px] text-[#64748B] font-medium">{label}</span>
    </div>
  );
}

function MiniStat({ label, value }) {
  return (
    <div className="rounded-2xl bg-slate-50 py-2 text-center">
      <p className="text-xs font-bold text-[#0F172A] tabular-nums">{value}</p>
      <p className="text-[10px] text-[#64748B] font-medium">{label}</p>
    </div>
  );
}

function ScoreBadge({ score }) {
  const s = Math.round(score || 0);
  const tone = s >= 75 ? "emerald" : s >= 50 ? "amber" : "rose";
  const map = {
    emerald: "bg-emerald-50 text-emerald-600 border-emerald-200",
    amber: "bg-amber-50 text-amber-600 border-amber-200",
    rose: "bg-rose-50 text-rose-500 border-rose-200",
  };
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full border ${map[tone]}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {s}% confidence
    </span>
  );
}
