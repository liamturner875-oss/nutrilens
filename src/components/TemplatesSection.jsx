import React, { useCallback, useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMeals } from "@/lib/MealContext";
import { Plus, Trash2, Zap } from "lucide-react";

export default function TemplatesSection() {
  const { addMeal } = useMeals();
  const [templates, setTemplates] = useState(null);
  const [addingId, setAddingId] = useState(null);

  const load = useCallback(async () => {
    try {
      const list = await base44.entities.Template.list("-created_date", 50);
      setTemplates(list || []);
    } catch (e) {
      setTemplates([]);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const quickAdd = async (t) => {
    setAddingId(t.id);
    try {
      await addMeal({
        description: t.description,
        calories: t.calories,
        protein: t.protein,
        carbs: t.carbs,
        fats: t.fats,
        fiber: t.fiber,
        sodium_mg: t.sodium_mg,
        potassium_mg: t.potassium_mg,
        meal_type: t.meal_type || "snack",
        items: [],
        confidence: 100,
        logged_at: new Date().toISOString(),
      });
    } finally {
      setAddingId(null);
    }
  };

  const remove = async (id) => {
    await base44.entities.Template.delete(id);
    setTemplates((prev) => prev.filter((t) => t.id !== id));
  };

  if (!templates) return null;

  return (
    <div className="rounded-[20px] bg-white border border-[#E2E8F0] p-5">
      <div className="flex items-center gap-2 mb-3">
        <Zap className="w-4 h-4 text-emerald-500" />
        <h3 className="font-heading font-bold text-sm text-[#0F172A]">Quick add</h3>
      </div>
      {!templates.length ? (
        <p className="text-xs text-[#64748B]">
          Save a scanned meal as a template and log it with one tap next time.
        </p>
      ) : (
        <div className="space-y-2">
          {templates.map((t) => (
            <div key={t.id} className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[#0F172A] truncate">{t.name || t.description}</p>
                <p className="text-[11px] text-[#64748B]">
                  {Math.round(t.calories)} cal · P{Math.round(t.protein || 0)} C{Math.round(t.carbs || 0)} F{Math.round(t.fats || 0)}
                </p>
              </div>
              <button
                onClick={() => remove(t.id)}
                className="text-slate-300 hover:text-rose-500"
                aria-label="Remove template"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => quickAdd(t)}
                disabled={addingId === t.id}
                className="w-9 h-9 rounded-full bg-emerald-500 text-white flex items-center justify-center hover:bg-emerald-600 disabled:opacity-50 shrink-0"
                aria-label="Quick add meal"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
