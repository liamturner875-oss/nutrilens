import React, { useState } from "react";
import { useMeals } from "@/lib/MealContext";
import ItemProductPicker from "@/components/ItemProductPicker";
import { X, Plus, Trash2, Scale, Save, Loader2, Search } from "lucide-react";

const ITEM_FIELDS = [
  { key: "calories", label: "Cal" },
  { key: "protein", label: "Protein (g)" },
  { key: "carbs", label: "Carbs (g)" },
  { key: "fats", label: "Fats (g)" },
];

const TOTAL_FIELDS = [
  { key: "calories", label: "Calories" },
  { key: "protein", label: "Protein (g)" },
  { key: "carbs", label: "Carbs (g)" },
  { key: "fats", label: "Fats (g)" },
  { key: "fiber", label: "Fiber (g)" },
  { key: "sodium_mg", label: "Sodium (mg)" },
  { key: "potassium_mg", label: "Potassium (mg)" },
];

const MEAL_TYPES = [
  { value: "breakfast", label: "Breakfast" },
  { value: "lunch", label: "Lunch" },
  { value: "dinner", label: "Dinner" },
  { value: "snack", label: "Snack" },
];

const n = (v) => {
  const x = parseFloat(v);
  return Number.isFinite(x) ? x : 0;
};

const inputCls =
  "h-9 w-full rounded-xl border border-[#E2E8F0] px-2.5 text-sm text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-emerald-400 tabular-nums";

export default function EditMealDialog({ meal, onClose }) {
  const { updateMeal } = useMeals();
  const [description, setDescription] = useState(meal.description || "");
  const [mealType, setMealType] = useState(meal.meal_type || "snack");
  const [items, setItems] = useState((meal.items || []).map((i) => ({ ...i })));
  const [totals, setTotals] = useState({
    calories: meal.calories || 0,
    protein: meal.protein || 0,
    carbs: meal.carbs || 0,
    fats: meal.fats || 0,
    fiber: meal.fiber || 0,
    sodium_mg: meal.sodium_mg || 0,
    potassium_mg: meal.potassium_mg || 0,
  });
  const [fixing, setFixing] = useState(null);
  const [wasG, setWasG] = useState("");
  const [nowG, setNowG] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [picker, setPicker] = useState(null); // { index: null } = append, { index: i } = replace item

  // Changing an item nudges the meal totals by the same amount, so they stay in sync
  const applyDelta = (key, delta) =>
    setTotals((t) => ({ ...t, [key]: Math.max(0, n(t[key]) + delta) }));

  const setItemName = (i, value) =>
    setItems((prev) => prev.map((it, idx) => (idx === i ? { ...it, name: value } : it)));

  const setItemNum = (i, key, raw) => {
    const val = n(raw);
    const old = n(items[i]?.[key]);
    setItems((prev) => prev.map((it, idx) => (idx === i ? { ...it, [key]: val } : it)));
    applyDelta(key, val - old);
  };

  const removeItem = (i) => {
    const it = items[i];
    setItems((prev) => prev.filter((_, idx) => idx !== i));
    ITEM_FIELDS.forEach(({ key }) => applyDelta(key, -n(it[key])));
    if (fixing === i) setFixing(null);
  };

  const addItem = () =>
    setItems((prev) => [...prev, { name: "", calories: 0, protein: 0, carbs: 0, fats: 0 }]);

  // Insert (or replace an item with) a real branded product at a chosen weight
  const insertProduct = (product, grams) => {
    const f = grams / 100;
    const p = product.per100;
    const entry = {
      name: `${product.name}${product.brand ? ` — ${product.brand}` : ""} (${Math.round(grams)} g)`,
      calories: Math.round(p.calories * f),
      protein: Math.round(p.protein * f),
      carbs: Math.round(p.carbs * f),
      fats: Math.round(p.fats * f),
    };
    const i = picker?.index;
    if (i == null) {
      setItems((prev) => [...prev, entry]);
      ITEM_FIELDS.forEach(({ key }) => applyDelta(key, entry[key]));
    } else {
      const old = items[i];
      setItems((prev) => prev.map((it, idx) => (idx === i ? entry : it)));
      ITEM_FIELDS.forEach(({ key }) => applyDelta(key, entry[key] - n(old[key])));
    }
    applyDelta("fiber", Math.round((p.fiber || 0) * f));
    applyDelta("sodium_mg", Math.round((p.sodium_mg || 0) * f));
    applyDelta("potassium_mg", Math.round((p.potassium_mg || 0) * f));
    setPicker(null);
  };

  const startFix = (i) => {
    setFixing(fixing === i ? null : i);
    setWasG("");
    setNowG("");
  };

  // Portion fix: "it said 200 g, I measured 175 g" → scale this item's numbers by 175/200
  const applyFix = (i) => {
    const was = n(wasG);
    const now = n(nowG);
    if (was <= 0 || now <= 0) return;
    const f = now / was;
    const it = items[i];
    const scaled = {};
    ITEM_FIELDS.forEach(({ key }) => {
      scaled[key] = Math.round(n(it[key]) * f * 10) / 10;
    });
    setItems((prev) => prev.map((x, idx) => (idx === i ? { ...x, ...scaled } : x)));
    ITEM_FIELDS.forEach(({ key }) => applyDelta(key, scaled[key] - n(it[key])));
    setFixing(null);
  };

  const save = async () => {
    if (!description.trim()) {
      setError("Give the meal a name.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await updateMeal(meal.id, {
        description: description.trim(),
        meal_type: mealType,
        items: items.filter((it) => (it.name || "").trim() || n(it.calories)),
        calories: n(totals.calories),
        protein: n(totals.protein),
        carbs: n(totals.carbs),
        fats: n(totals.fats),
        fiber: n(totals.fiber),
        sodium_mg: n(totals.sodium_mg),
        potassium_mg: n(totals.potassium_mg),
      });
      onClose();
    } catch (e) {
      setError("Couldn't save the changes. Try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-[24px] w-full max-w-lg max-h-[90vh] overflow-y-auto p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-heading font-bold text-lg text-[#0F172A]">Edit meal</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-[#0F172A]" aria-label="Close">
            <X className="w-5 h-5" />
          </button>
        </div>
        {error && (
          <p className="mb-3 text-sm text-rose-600 bg-rose-50 border border-rose-200 rounded-2xl px-4 py-2.5">{error}</p>
        )}

        <p className="text-xs font-semibold text-[#64748B] uppercase tracking-wide mb-1.5">Meal name</p>
        <input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full h-10 rounded-full border border-[#E2E8F0] px-4 text-sm text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-emerald-400 mb-4"
        />

        <p className="text-xs font-semibold text-[#64748B] uppercase tracking-wide mb-1.5">Meal type</p>
        <div className="flex flex-wrap gap-2 mb-5">
          {MEAL_TYPES.map((t) => (
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

        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-semibold text-[#64748B] uppercase tracking-wide">Items</p>
          <div className="flex items-center gap-3">
            <button
              onClick={addItem}
              className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:text-emerald-700"
            >
              <Plus className="w-3.5 h-3.5" /> Add item
            </button>
            <button
              onClick={() => setPicker({ index: null })}
              className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:text-emerald-700"
            >
              <Search className="w-3.5 h-3.5" /> Find product
            </button>
          </div>
        </div>
        {picker && (
          <div className="mb-3">
            <ItemProductPicker
              title={picker.index == null ? "Add a branded product" : "Replace item with a product"}
              onPick={insertProduct}
              onClose={() => setPicker(null)}
            />
          </div>
        )}
        {items.length === 0 && (
          <p className="text-xs text-[#64748B] mb-3">
            No items recorded — add anything the scan missed underneath.
          </p>
        )}
        <div className="space-y-2 mb-5">
          {items.map((it, i) => (
            <div key={i} className="rounded-2xl border border-[#E2E8F0] p-3 space-y-2">
              <div className="flex gap-2">
                <input
                  value={it.name || ""}
                  onChange={(e) => setItemName(i, e.target.value)}
                  placeholder="Item name"
                  className="flex-1 h-9 rounded-xl border border-[#E2E8F0] px-2.5 text-sm text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-emerald-400"
                />
                <button
                  onClick={() => setPicker({ index: i })}
                  title="Replace with a database product"
                  className="h-9 w-9 rounded-xl border border-[#E2E8F0] bg-white text-[#64748B] hover:bg-slate-50 flex items-center justify-center transition"
                >
                  <Search className="w-4 h-4" />
                </button>
                <button
                  onClick={() => startFix(i)}
                  title="Fix portion amount"
                  className={`h-9 w-9 rounded-xl border flex items-center justify-center transition ${
                    fixing === i
                      ? "bg-emerald-500 text-white border-emerald-500"
                      : "bg-white text-[#64748B] border-[#E2E8F0] hover:bg-slate-50"
                  }`}
                >
                  <Scale className="w-4 h-4" />
                </button>
                <button
                  onClick={() => removeItem(i)}
                  title="Remove item"
                  className="h-9 w-9 rounded-xl border border-[#E2E8F0] bg-white text-slate-400 hover:text-rose-500 flex items-center justify-center transition"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {ITEM_FIELDS.map((f) => (
                  <label key={f.key} className="block">
                    <span className="text-[10px] text-[#64748B] font-medium">{f.label}</span>
                    <input
                      type="number"
                      min="0"
                      value={it[f.key] ?? 0}
                      onChange={(e) => setItemNum(i, f.key, e.target.value)}
                      className={inputCls}
                    />
                  </label>
                ))}
              </div>
              {fixing === i && (
                <div className="flex flex-wrap items-center gap-1.5 text-xs text-[#64748B] bg-slate-50 rounded-xl px-2.5 py-2">
                  Said
                  <input
                    type="number"
                    min="0"
                    value={wasG}
                    onChange={(e) => setWasG(e.target.value)}
                    placeholder="200"
                    className="w-16 h-8 rounded-lg border border-[#E2E8F0] px-2 text-sm text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  />
                  g — I measured
                  <input
                    type="number"
                    min="0"
                    value={nowG}
                    onChange={(e) => setNowG(e.target.value)}
                    placeholder="175"
                    className="w-16 h-8 rounded-lg border border-[#E2E8F0] px-2 text-sm text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  />
                  g
                  <button
                    onClick={() => applyFix(i)}
                    disabled={!(n(wasG) > 0 && n(nowG) > 0)}
                    className="ml-auto h-8 px-3 rounded-full bg-emerald-500 text-white text-xs font-semibold hover:bg-emerald-600 disabled:opacity-50"
                  >
                    Scale item
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        <p className="text-xs font-semibold text-[#64748B] uppercase tracking-wide mb-1.5">Meal totals</p>
        <p className="text-[11px] text-[#64748B] mb-2">
          These update automatically when you edit items — or fine-tune them yourself.
        </p>
        <div className="grid grid-cols-2 gap-1.5 mb-5">
          {TOTAL_FIELDS.map((f) => (
            <label key={f.key} className="block">
              <span className="text-[10px] text-[#64748B] font-medium">{f.label}</span>
              <input
                type="number"
                min="0"
                value={totals[f.key]}
                onChange={(e) => setTotals((t) => ({ ...t, [f.key]: n(e.target.value) }))}
                className={inputCls}
              />
            </label>
          ))}
        </div>

        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 h-11 rounded-full border border-[#E2E8F0] text-sm font-semibold text-[#64748B] hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            onClick={save}
            disabled={saving}
            className="flex-1 h-11 rounded-full bg-emerald-500 text-white text-sm font-semibold hover:bg-emerald-600 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save changes
          </button>
        </div>
      </div>
    </div>
  );
}
