import React, { useState, useEffect, useRef } from "react";
import PortionCard from "@/components/PortionCard";
import { searchProducts, suggestProducts } from "@/lib/openfoodfacts";
import { useProfile } from "@/lib/ProfileContext";
import { detectCountry, countryName } from "@/lib/countries";
import { Search, Loader2 } from "lucide-react";

export default function ProductSearch({ onResult }) {
  const { profile } = useProfile();
  const country = profile?.country || detectCountry();
  const [term, setTerm] = useState("");
  const [results, setResults] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [product, setProduct] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggest, setShowSuggest] = useState(false);
  const suggestTimer = useRef(null);

  // Related-products dropdown while typing (debounced)
  useEffect(() => {
    const q = term.trim();
    if (q.length < 3 || product) {
      setSuggestions([]);
      return;
    }
    clearTimeout(suggestTimer.current);
    suggestTimer.current = setTimeout(async () => {
      try {
        const found = await suggestProducts(q, country);
        setSuggestions(found.slice(0, 6));
      } catch (e) {
        /* dropdown is best-effort; full search reports errors */
      }
    }, 600);
    return () => clearTimeout(suggestTimer.current);
  }, [term, product, country]);

  const pick = (p) => {
    setProduct(p);
    setSuggestions([]);
    setShowSuggest(false);
  };

  const run = async (e) => {
    e.preventDefault();
    const q = term.trim();
    if (!q) return;
    setShowSuggest(false);
    setBusy(true);
    setError("");
    setResults(null);
    setProduct(null);
    try {
      const found = await searchProducts(q, country);
      if (!found.length) {
        setError("No products with nutrition data found — check the spelling or try the brand name.");
      }
      setResults(found);
    } catch (err) {
      setError(err?.message || "Search failed. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  if (product) {
    return (
      <PortionCard product={product} onResult={onResult} onBack={() => setProduct(null)} backLabel="New search" />
    );
  }

  return (
    <form onSubmit={run} className="rounded-[24px] bg-white border border-[#E2E8F0] p-5 shadow-sm">
      <h3 className="font-heading font-bold text-lg text-[#0F172A] mb-1">Search branded foods</h3>
      <p className="text-xs text-[#64748B] mb-4">
        Type a brand (e.g. “pams”) to list its products, or a food name. Millions of products with official
        nutrition data — every product worldwide{country ? `, ${countryName(country)} ones boosted to the top` : ""}.
      </p>
      <div className="relative">
        <div className="flex gap-2">
          <input
            value={term}
            onChange={(e) => {
              setTerm(e.target.value);
              setShowSuggest(true);
            }}
            onFocus={() => setShowSuggest(true)}
            placeholder='e.g. "pams" or "blueberry yogurt"'
            className="flex-1 h-12 rounded-full border border-[#E2E8F0] px-4 text-sm text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-emerald-400"
          />
          <button
            type="submit"
            disabled={busy || !term.trim()}
            className="h-12 px-5 rounded-full bg-emerald-500 text-white text-sm font-semibold flex items-center gap-2 hover:bg-emerald-600 disabled:opacity-50 transition"
          >
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            Search
          </button>
        </div>
        {showSuggest && suggestions.length > 0 && (
          <div className="absolute left-0 right-0 top-13 z-10 mt-1 rounded-2xl bg-white border border-[#E2E8F0] shadow-lg overflow-hidden">
            {suggestions.map((r, i) => (
              <button
                key={i}
                type="button"
                onClick={() => pick(r)}
                className="w-full text-left px-4 py-2.5 hover:bg-emerald-50/60 transition"
              >
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
      {busy && <p className="text-xs text-[#64748B] mt-3">Searching the food database…</p>}
      {error && (
        <p className="mt-3 text-sm text-rose-600 bg-rose-50 border border-rose-200 rounded-2xl px-4 py-3">{error}</p>
      )}
      {results?.length > 0 && (
        <div className="mt-4 space-y-2 max-h-96 overflow-y-auto">
          {results.map((r, i) => (
            <button
              key={i}
              type="button"
              onClick={() => pick(r)}
              className="w-full text-left rounded-2xl border border-[#E2E8F0] p-3 hover:border-emerald-400 hover:bg-emerald-50/40 transition"
            >
              <p className="text-sm font-semibold text-[#0F172A] truncate">
                {r.name}
                {r.brand ? <span className="text-[#64748B] font-medium"> — {r.brand}</span> : null}
              </p>
              <p className="text-xs text-[#64748B] mt-0.5 tabular-nums">
                {Math.round(r.per100.calories)} kcal / 100 g · {Math.round(r.per100.protein)}g P ·{" "}
                {Math.round(r.per100.carbs)}g C · {Math.round(r.per100.fats)}g F
              </p>
            </button>
          ))}
        </div>
      )}
    </form>
  );
}
