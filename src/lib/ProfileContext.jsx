import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { calcTargets, nextAdjustment } from "@/lib/nutrition";

const ProfileContext = createContext(null);
const DEFAULT_TARGETS = { calories: 2000, protein: 150, carbs: 250, fats: 65 };

export function ProfileProvider({ children }) {
  const [profile, setProfile] = useState(null);
  const [weightEntries, setWeightEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const me = await base44.auth.me();
      const [profiles, entries] = await Promise.all([
        base44.entities.Profile.filter({ created_by_id: me.id }),
        base44.entities.WeightEntry.filter({ created_by_id: me.id }, "logged_at", 200),
      ]);
      setProfile(profiles?.[0] || null);
      setWeightEntries(entries || []);
    } catch (e) {
      setProfile(null);
      setWeightEntries([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const saveProfile = useCallback(async (data) => {
    const t = calcTargets(data);
    const payload = {
      ...data,
      macro_split: data.macro_split || "balanced",
      tdee_adjustment: 0,
      water_goal_ml: 2500,
      fiber_goal: 30,
      target_calories: t.calories,
      target_protein: t.protein,
      target_carbs: t.carbs,
      target_fats: t.fats,
    };
    const rec = await base44.entities.Profile.create(payload);
    setProfile(rec);
    try {
      const entry = await base44.entities.WeightEntry.create({
        weight_kg: data.weight_kg,
        logged_at: new Date().toISOString(),
      });
      setWeightEntries([entry]);
    } catch (e) {
      /* first weigh-in is non-fatal */
    }
    return rec;
  }, []);

  const updateProfile = useCallback(
    async (partial) => {
      if (!profile) return null;
      const merged = { ...profile, ...partial };
      const t = calcTargets(merged);
      const rec = await base44.entities.Profile.update(profile.id, {
        ...partial,
        target_calories: t.calories,
        target_protein: t.protein,
        target_carbs: t.carbs,
        target_fats: t.fats,
      });
      setProfile(rec);
      return rec;
    },
    [profile]
  );

  const addWeight = useCallback(
    async (kg) => {
      const now = new Date().toISOString();
      const todayStr = new Date().toDateString();
      const existingToday = weightEntries.find(
        (e) => new Date(e.logged_at).toDateString() === todayStr
      );
      const rec = existingToday
        ? await base44.entities.WeightEntry.update(existingToday.id, { weight_kg: kg, logged_at: now })
        : await base44.entities.WeightEntry.create({ weight_kg: kg, logged_at: now });
      const entries = [...weightEntries.filter((e) => e.id !== rec.id), rec].sort(
        (a, b) => new Date(a.logged_at) - new Date(b.logged_at)
      );
      setWeightEntries(entries);
      // Dynamic TDEE adaptation: re-tune calories from the 14-day weight trend
      const tdee_adjustment = nextAdjustment(entries, profile);
      await updateProfile({ weight_kg: kg, tdee_adjustment });
    },
    [weightEntries, updateProfile, profile]
  );

  const targets = profile
    ? {
        calories: profile.target_calories || DEFAULT_TARGETS.calories,
        protein: profile.target_protein || DEFAULT_TARGETS.protein,
        carbs: profile.target_carbs || DEFAULT_TARGETS.carbs,
        fats: profile.target_fats || DEFAULT_TARGETS.fats,
      }
    : DEFAULT_TARGETS;

  return (
    <ProfileContext.Provider
      value={{ profile, targets, weightEntries, loading, refresh, saveProfile, updateProfile, addWeight }}
    >
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error("useProfile must be used within ProfileProvider");
  return ctx;
}
