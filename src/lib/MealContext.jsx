import React, { useContext, useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { useProfile } from "@/lib/ProfileContext";
import useToday from "@/lib/useToday";
import { MealContext } from "@/lib/MealContextInstance";

export function MealProvider({ children }) {
  const { targets } = useProfile();
  const today = useToday(); // rolls over at midnight so the daily view resets
  const [allMeals, setAllMeals] = useState([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const all = await base44.entities.Meal.list("-created_date", 300);
      setAllMeals(all || []);
    } catch (e) {
      setAllMeals([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh, today]);

  const meals = allMeals.filter((m) => {
    const d = m.logged_at || m.created_date;
    return d && new Date(d).toDateString() === today;
  });

  const totals = meals.reduce(
    (acc, m) => ({
      calories: acc.calories + (m.calories || 0),
      protein: acc.protein + (m.protein || 0),
      carbs: acc.carbs + (m.carbs || 0),
      fats: acc.fats + (m.fats || 0),
      fiber: acc.fiber + (m.fiber || 0),
      sodium_mg: acc.sodium_mg + (m.sodium_mg || 0),
      potassium_mg: acc.potassium_mg + (m.potassium_mg || 0),
    }),
    { calories: 0, protein: 0, carbs: 0, fats: 0, fiber: 0, sodium_mg: 0, potassium_mg: 0 }
  );

  // Rolling 7-day compliance — weekly balance over perfect daily streaks
  const weekly = (() => {
    const cutoff = Date.now() - 7 * 864e5;
    const byDay = {};
    allMeals.forEach((m) => {
      const d = m.logged_at || m.created_date;
      if (!d || new Date(d).getTime() < cutoff) return;
      const key = new Date(d).toDateString();
      const b = (byDay[key] = byDay[key] || { calories: 0, protein: 0, fiber: 0 });
      b.calories += m.calories || 0;
      b.protein += m.protein || 0;
      b.fiber += m.fiber || 0;
    });
    const days = Object.values(byDay);
    const tracked = days.length;
    const sum = (k) => days.reduce((s, d) => s + d[k], 0);
    const withinCalories = (d) =>
      d.calories > 0 && Math.abs(d.calories - targets.calories) <= targets.calories * 0.1;
    return {
      daysTracked: tracked,
      avgCalories: tracked ? Math.round(sum("calories") / tracked) : 0,
      avgFiber: tracked ? Math.round(sum("fiber") / tracked) : 0,
      proteinGoalDays: days.filter((d) => d.protein >= targets.protein).length,
      calorieGoalDays: days.filter(withinCalories).length,
    };
  })();

  const addMeal = useCallback(
    async (data) => {
      const created = await base44.entities.Meal.create(data);
      await refresh();
      return created;
    },
    [refresh]
  );

  const deleteMeal = useCallback(async (id) => {
    await base44.entities.Meal.delete(id);
    setAllMeals((prev) => prev.filter((m) => m.id !== id));
  }, []);

  const updateMeal = useCallback(async (id, data) => {
    const updated = await base44.entities.Meal.update(id, data);
    setAllMeals((prev) => prev.map((m) => (m.id === id ? { ...m, ...data, ...updated } : m)));
    return updated;
  }, []);

  return (
    <MealContext.Provider
      value={{ meals, allMeals, totals, targets, weekly, loading, refresh, addMeal, deleteMeal, updateMeal }}
    >
      {children}
    </MealContext.Provider>
  );
}

export function useMeals() {
  const ctx = useContext(MealContext);
  if (!ctx) throw new Error("useMeals must be used within MealProvider");
  return ctx;
}
