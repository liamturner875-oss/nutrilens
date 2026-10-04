import React, { useState } from "react";
import { Flame, Beef, Wheat, Droplet, Trash2, Pencil } from "lucide-react";
import { Image } from "@/components/ui/image";
import EditMealDialog from "@/components/EditMealDialog";

const mealTypeLabel = { breakfast: "Breakfast", lunch: "Lunch", dinner: "Dinner", snack: "Snack" };

export default function MealLog({ meals, onDelete }) {
  const [editing, setEditing] = useState(null);

  if (!meals.length) {
    return (
      <div className="rounded-[20px] bg-white border border-[#E2E8F0] p-8 text-center">
        <p className="text-sm text-[#64748B]">No meals logged yet. Scan your first plate to start tracking.</p>
      </div>
    );
  }
  return (
    <div className="space-y-3">
      {meals.map((m) => (
        <div key={m.id} className="flex gap-3 rounded-[20px] bg-white border border-[#E2E8F0] p-3">
          <div className="w-16 h-16 rounded-2xl overflow-hidden bg-slate-100 shrink-0">
            {m.photo_url && <Image src={m.photo_url} fittingType="fill" className="w-full h-full" />}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-semibold text-[#0F172A] truncate">{m.description}</p>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => setEditing(m)}
                  className="text-slate-300 hover:text-emerald-600"
                  aria-label="Edit meal"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onDelete(m.id)}
                  className="text-slate-300 hover:text-rose-500"
                  aria-label="Delete meal"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            <p className="text-[11px] text-[#64748B] mb-1.5">{mealTypeLabel[m.meal_type] || "Snack"}</p>
            <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] font-medium">
              <span className="inline-flex items-center gap-1 text-sky-600"><Flame className="w-3 h-3" />{Math.round(m.calories)} cal</span>
              <span className="inline-flex items-center gap-1 text-violet-600"><Beef className="w-3 h-3" />{Math.round(m.protein)}g</span>
              <span className="inline-flex items-center gap-1 text-amber-600"><Wheat className="w-3 h-3" />{Math.round(m.carbs)}g</span>
              <span className="inline-flex items-center gap-1 text-rose-500"><Droplet className="w-3 h-3" />{Math.round(m.fats)}g</span>
            </div>
          </div>
        </div>
      ))}
      {editing && <EditMealDialog meal={editing} onClose={() => setEditing(null)} />}
    </div>
  );
}
