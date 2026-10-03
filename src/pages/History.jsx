import React from "react";
import { useMeals } from "@/lib/MealContext";
import MealLog from "@/components/MealLog";
import MacroRings from "@/components/MacroRings";
import { CalendarDays } from "lucide-react";

export default function History() {
  const { meals, totals, targets, deleteMeal, loading } = useMeals();

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-2">
        <CalendarDays className="w-5 h-5 text-emerald-500" />
        <h1 className="font-heading font-extrabold text-2xl text-[#0F172A]">Today's history</h1>
      </div>

      <div className="rounded-[24px] bg-white border border-[#E2E8F0] p-5 shadow-sm">
        <h2 className="font-heading font-bold text-lg text-[#0F172A] mb-4">Daily totals</h2>
        <MacroRings totals={totals} targets={targets} />
      </div>

      <div>
        <h2 className="font-heading font-bold text-lg text-[#0F172A] mb-3">
          Meals ({meals.length})
        </h2>
        {loading ? (
          <div className="rounded-[20px] bg-white border border-[#E2E8F0] p-8 text-center text-sm text-[#64748B]">
            Loading…
          </div>
        ) : (
          <MealLog meals={meals} onDelete={deleteMeal} />
        )}
      </div>
    </div>
  );
}
