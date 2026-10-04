import React, { useState } from "react";
import { searchProducts } from "@/lib/openfoodfacts";
import { useProfile } from "@/lib/ProfileContext";
import { detectCountry, countryName } from "@/lib/countries";
import { Search, Loader2, ArrowLeft, X } from "lucide-react";

// Search branded products (localized to the user's country) and pick one at a
// chosen weight — onPick(product, grams) hands the choice back to the editor.
export default function ItemProductPicker({ title, onPick, onClose }) {
  const { profile } = useProfile();
  const country = profile?.country || detectCountry();
  const [term, setTerm] = useState("");
  const [results, setResults] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [chosen, setChosen] = useState(null);
  const [grams, setGrams] = useState(100);

  const run = async (e) => {
    e.preventDefault();
    if (!term.trim()) return;
    setBusy(true);
    setError("");
    setResults(null);
    try {
      const found = await searchProducts(term, country);
      setResults(found);
      if (!found.length) setError("No products with nutrition data found — try the brand name or another spelling.");
    } catch (err) {
      setError(err?.message || "Search failed. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const pick = (p) => {
    setChosen(p);
    setGrams(p.servingGrams || 100);
  };

  if (chosen) {
    const f = grams / 100;
    const p = chosen.per100;
    return (
      <div className="rounded-2xl border border-emerald-300 bg-emerald-50/50 p-3 space-y-2.5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-[#0F172A] truncate">{chosen.name}</p>
            {chosen.brand && <p className="text-xs text-[#64748B]">{chosen.brand}</p>}
          </div>
          <button
            onClick={() => setChosen(null)}
            className="text-slate-400 hover:text-[#0F172A] shrink-0"
            aria-label="Back to search"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min="1"
            value={grams}
            onChange={(e) => setGrams(Math.max(0, parseFloat(e.target.value) || 0))}
            className="w-24 h-9 rounded-xl border border-[#E2E8F0] px-2.5 text-sm text-[#0F172A] tabular-nums focus:outline-none focus:ring-2 focus:ring-emerald-400"
          />
          <span className="text-xs text-[#64748B]">grams</span>
          <p className="ml-auto text-xs text-[#64748B] tabular-nums text-right">
            {Math.round(p.calories * f)} cal · {Math.round(p.protein * f)}g P · {Math.round(p.carbs * f)}g C ·{" "}
            {Math.round(p.fats * f)}g F
          </p>
        </div>
        <button
          onClick={() => grams > 0 && onPick(chosen, grams)}
          disabled={!(grams > 0)}
          className="w-full h-10 rounded-full bg-emerald-500 text-white text-sm font-semibold hover:bg-emerald-600 disabled:opacity-50"
        >
          Use this product
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-[#E2E8F0] p-3 space-y-2.5">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-[#64748B] uppercase tracking-wide">{title}</p>
        <button onClick={onClose} className="text-slate-400 hover:text-[#0F172A]" aria-label="Close product search">
          <X className="w-4 h-4" />
        </button>
      </div>
      <p className="text-[11px] text-[#64748B]">
        Branded products with official nutrition data — worldwide{country ? `, ${countryName(country)} ones first` : ""}.
      </p>
      <form onSubmit={run} className="flex gap-1.5">
        <input
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          placeholder='e.g. "pams yogurt"'
          className="flex-1 h-9 rounded-xl border border-[#E2E8F0] px-2.5 text-sm text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-emerald-400"
        />
        <button
          type="submit"
          disabled={busy}
          className="h-9 px-3.5 rounded-xl bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 hover:bg-emerald-600 disabled:opacity-50"
        >
          {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />} Search
        </button>
      </form>
      {error && <p className="text-xs text-rose-600">{error}</p>}
      {results?.length > 0 && (
        <div className="max-h-56 overflow-y-auto rounded-xl border border-[#E2E8F0] divide-y divide-[#F1F5F9]">
          {results.map((r, i) => (
            <button key={i} type="button" onClick={() => pick(r)} className="w-full text-left px-3 py-2 hover:bg-emerald-50/60">
              <p className="text-sm font-medium text-[#0F172A] truncate">
                {r.name}
                {r.brand ? <span className="text-[#64748B] font-normal"> — {r.brand}</span> : null}
              </p>
              <p className="text-[11px] text-[#64748B] tabular-nums">{Math.round(r.per100.calories)} kcal / 100 g</p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
