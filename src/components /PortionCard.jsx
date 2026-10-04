import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Flame, Beef, Wheat, Droplet, RotateCcw, Loader2 } from "lucide-react";

const DENSITY_SCHEMA = {
  type: "object",
  properties: { grams_per_cup: { type: "number" }, note: { type: "string" } },
};

const UNITS = ["g", "ml", "tsp", "tbsp", "cup"];
const CUP_CHIPS = [
  ["1/4", 0.25],
  ["1/3", 0.33],
  ["1/2", 0.5],
  ["2/3", 0.67],
  ["3/4", 0.75],
  ["1", 1],
  ["2", 2],
];

const gramsFor = (unit, qty, gPerCup) => {
  if (unit === "g") return qty;
  if (!gPerCup) return null;
  if (unit === "ml") return (qty * gPerCup) / 240;
  if (unit === "tsp") return (qty * gPerCup) / 48;
  if (unit === "tbsp") return (qty * gPerCup) / 16;
  return qty * gPerCup; // cup
};

export default function PortionCard({ product, onResult, onBack, backLabel = "Back" }) {
  const [unit, setUnit] = useState("g");
  const [qty, setQty] = useState(product.servingGrams || 100);
  const [gramsPerCup, setGramsPerCup] = useState(null);
  const [converting, setConverting] = useState(false);
  const [convertError, setConvertError] = useState("");
  const attempted = useRef(false);

  // One AI density estimate per product, made when a volume unit is first picked
  useEffect(() => {
    if (unit === "g" || gramsPerCup || attempted.current) return;
    attempted.current = true;
    let cancelled = false;
    setConverting(true);
    setConvertError("");
    base44.integrations.Core.InvokeLLM({
      prompt: `Estimate how many grams of "${product.name}"${
        product.brand ? ` (brand: ${product.brand})` : ""
      } fill one standard US cup (240 ml). Use the typical density and packing of this food — e.g. all-purpose flour ~120 g/cup, granulated sugar ~200 g/cup, milk ~240 g/cup, rolled oats ~90 g/cup. Return grams_per_cup (a realistic number) and note (a very short explanation).`,
      response_json_schema: DENSITY_SCHEMA,
    })
      .then((res) => {
        if (!cancelled) setGramsPerCup(Math.max(1, Math.round(res?.grams_per_cup || 0)));
      })
      .catch(() => {
        if (!cancelled) setConvertError("Couldn't convert that unit — enter grams instead.");
      })
      .finally(() => {
        if (!cancelled) setConverting(false);
      });
    return () => {
      cancelled = true;
    };
  }, [unit, gramsPerCup, product.name, product.brand]);

  const changeUnit = (u) => {
    if (u === unit) return;
    setUnit(u);
    if (u === "g") setQty(product.servingGrams || 100);
    else if (unit === "g") setQty(1);
  };

  const grams = gramsFor(unit, qty, gramsPerCup);
  const f = grams != null ? grams / 100 : null;
  const p100 = product.per100;
  const fmtQty = Number.isInteger(qty) ? qty : +(+qty).toFixed(2);

  const stats = [
    { icon: Flame, label: "Cal", value: f != null ? Math.round(p100.calories * f) : null, color: "text-sky-600 bg-sky-50" },
    { icon: Beef, label: "Protein", value: f != null ? `${Math.round(p100.protein * f)}g` : null, color: "text-violet-600 bg-violet-50" },
    { icon: Wheat, label: "Carbs", value: f != null ? `${Math.round(p100.carbs * f)}g` : null, color: "text-amber-600 bg-amber-50" },
    { icon: Droplet, label: "Fats", value: f != null ? `${Math.round(p100.fats * f)}g` : null, color: "text-rose-500 bg-rose-50" },
  ];

  const confirm = () => {
    const portion = `${fmtQty} ${unit} ≈ ${Math.round(grams)} g`;
    onResult({
      description: `${product.name}${product.brand ? ` — ${product.brand}` : ""} (${portion})`,
      calories: Math.round(p100.calories * f),
      calories_low: Math.round(p100.calories * f * 0.95),
      calories_high: Math.round(p100.calories * f * 1.05),
      protein: Math.round(p100.protein * f),
      carbs: Math.round(p100.carbs * f),
      fats: Math.round(p100.fats * f),
      fiber: Math.round(p100.fiber * f),
      sodium_mg: Math.round(p100.sodium_mg * f),
      potassium_mg: Math.round(p100.potassium_mg * f),
      confidence: 90,
      items: [
        {
          name: `${product.name} (${portion})`,
          calories: Math.round(p100.calories * f),
          protein: Math.round(p100.protein * f),
          carbs: Math.round(p100.carbs * f),
          fats: Math.round(p100.fats * f),
        },
      ],
    });
  };

  return (
    <div className="rounded-[24px] bg-white border border-[#E2E8F0] p-5 shadow-sm">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-heading font-bold text-lg text-[#0F172A]">{product.name}</h3>
          {product.brand && <p className="text-xs text-[#64748B]">{product.brand}</p>}
        </div>
        {onBack && (
          <button
            onClick={onBack}
            className="inline-flex items-center gap-1 text-xs font-semibold text-[#64748B] hover:text-[#0F172A]"
          >
            <RotateCcw className="w-3.5 h-3.5" /> {backLabel}
          </button>
        )}
      </div>

      <p className="text-xs font-semibold text-[#64748B] uppercase tracking-wide">Portion</p>
      <div className="flex flex-wrap gap-1.5 mt-1 mb-3">
        {UNITS.map((u) => (
          <button
            key={u}
            onClick={() => changeUnit(u)}
            className={`px-3.5 h-9 rounded-full text-sm font-medium border transition ${
              unit === u
                ? "bg-[#0F172A] text-white border-[#0F172A]"
                : "bg-white text-[#64748B] border-[#E2E8F0] hover:bg-slate-50"
            }`}
          >
            {u}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-2 mb-2">
        <input
          type="number"
          min="0.01"
          step={unit === "g" ? 1 : 0.25}
          value={qty}
          onChange={(e) => setQty(Math.max(0, parseFloat(e.target.value) || 0))}
          className="w-28 h-11 rounded-full border border-[#E2E8F0] px-4 text-sm text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-emerald-400"
        />
        <span className="text-sm text-[#64748B]">{unit === "g" ? "grams" : unit}</span>
      </div>
      {unit === "cup" && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {CUP_CHIPS.map(([label, value]) => (
            <button
              key={label}
              onClick={() => setQty(value)}
              className={`px-3 h-8 rounded-full text-xs font-semibold border transition ${
                qty === value
                  ? "bg-emerald-500 text-white border-emerald-500"
                  : "bg-white text-[#64748B] border-[#E2E8F0] hover:bg-slate-50"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      )}
      {unit !== "g" && (
        <p className="text-xs text-[#64748B] mb-3">
          {converting ? (
            <span className="inline-flex items-center gap-1.5">
              <Loader2 className="w-3.5 h-3.5 animate-spin" /> Converting to grams…
            </span>
          ) : convertError ? (
            <span className="text-rose-500">{convertError}</span>
          ) : gramsPerCup ? (
            <>≈ {Math.round(grams)} g (about {gramsPerCup} g per cup of this food)</>
          ) : null}
        </p>
      )}

      <div className="grid grid-cols-4 gap-2 mb-3">
        {stats.map((s) => (
          <div key={s.label} className={`rounded-2xl p-2.5 flex flex-col items-center gap-1 ${s.color.split(" ")[1]}`}>
            <s.icon className={`w-4 h-4 ${s.color.split(" ")[0]}`} />
            <span className="text-sm font-bold text-[#0F172A] tabular-nums">{s.value ?? "—"}</span>
            <span className="text-[10px] text-[#64748B] font-medium">{s.label}</span>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-3 gap-2 mb-5">
        <MiniStat label="Fiber" value={f != null ? `${Math.round(p100.fiber * f)}g` : "—"} />
        <MiniStat label="Sodium" value={f != null ? `${Math.round(p100.sodium_mg * f)}mg` : "—"} />
        <MiniStat label="Potassium" value={f != null ? `${Math.round(p100.potassium_mg * f)}mg` : "—"} />
      </div>

      <button
        onClick={confirm}
        disabled={f == null || f <= 0}
        className="w-full h-12 rounded-full bg-emerald-500 text-white font-semibold hover:bg-emerald-600 disabled:opacity-50 transition"
      >
        Use these macros
      </button>
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
