import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import ScannerDropzone from "@/components/ScannerDropzone";
import PortionCard from "@/components/PortionCard";
import { fetchProductByBarcode } from "@/lib/openfoodfacts";
import { useProfile } from "@/lib/ProfileContext";
import { detectCountry } from "@/lib/countries";
import { Barcode, ClipboardList } from "lucide-react";
import { cn } from "@/lib/utils";

const BARCODE_SCHEMA = {
  type: "object",
  properties: {
    barcode: { type: "string" },
    product_name: { type: "string" },
  },
};

const LABEL_SCHEMA = {
  type: "object",
  properties: {
    product_name: { type: "string" },
    basis: { type: "string", enum: ["per_100g", "per_serving", "unknown"] },
    serving_size_g: { type: "number" },
    energy_kcal: { type: "number" },
    protein_g: { type: "number" },
    carbs_g: { type: "number" },
    fats_g: { type: "number" },
    fiber_g: { type: "number" },
    sodium_mg: { type: "number" },
    potassium_mg: { type: "number" },
  },
};

export default function BarcodeScanner({ onResult }) {
  const { profile } = useProfile();
  const country = profile?.country || detectCountry();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [manual, setManual] = useState("");
  const [product, setProduct] = useState(null);
  const [mode, setMode] = useState("barcode"); // barcode | label

  const lookupBarcode = async (code) => {
    const found = await fetchProductByBarcode(code, country);
    if (!found) {
      setError(
        `No product found for ${code} in the open food database — try searching by name instead.`
      );
      return;
    }
    setProduct(found);
  };

  const handlePhoto = async (file) => {
    setBusy(true);
    setError("");
    setProduct(null);
    try {
      const { file_url } = await base44.integrations.Core.UploadPublicFile({ file });
      const read = await base44.integrations.Core.InvokeLLM({
        prompt:
          "Read the barcode number from this product photo — the EAN/UPC digits printed under or over the bars. Return the digits only (no spaces or dashes), and the product name from the packaging if visible.",
        file_urls: [file_url],
        response_json_schema: BARCODE_SCHEMA,
        model: "gemini_3_flash",
      });
      const code = (read?.barcode || "").replace(/\D/g, "");
      if (code.length < 8) {
        setError("Couldn't read the barcode from the photo — get closer and steady the shot, or type the digits below.");
        return;
      }
      await lookupBarcode(code);
    } catch (e) {
      setError("Barcode lookup failed. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  // Nutrition-label mode: read the printed panel instead of looking the product up
  const handleLabelPhoto = async (file) => {
    setBusy(true);
    setError("");
    setProduct(null);
    try {
      const { file_url } = await base44.integrations.Core.UploadPublicFile({ file });
      const read = await base44.integrations.Core.InvokeLLM({
        prompt:
          "Read the nutrition information panel from this product photo. " +
          "Return the product name from the packaging if visible, and the printed values: energy in kcal (convert from kJ if only kJ is shown), protein, carbohydrates, fat and fiber in grams, sodium and potassium in milligrams. " +
          "If the panel shows values per 100 g, set basis to per_100g. If it only shows values per serving, set basis to per_serving and include the serving size in grams (serving_size_g). " +
          "Use 0 for any value not shown on the label.",
        file_urls: [file_url],
        response_json_schema: LABEL_SCHEMA,
        model: "gemini_3_flash",
      });
      if (!read || (!read.energy_kcal && !read.protein_g && !read.carbs_g && !read.fats_g)) {
        setError(
          "Couldn't read nutrition values from that photo — take a sharper, closer shot of the panel."
        );
        return;
      }
      const serving = read.serving_size_g > 0 ? read.serving_size_g : 100;
      const scale = read.basis === "per_serving" ? 100 / serving : 1;
      setProduct({
        name: read.product_name?.trim() || "Scanned product",
        brand: "From label",
        per100: {
          calories: read.energy_kcal * scale,
          protein: read.protein_g * scale,
          carbs: read.carbs_g * scale,
          fats: read.fats_g * scale,
          fiber: (read.fiber_g || 0) * scale,
          sodium_mg: (read.sodium_mg || 0) * scale,
          potassium_mg: (read.potassium_mg || 0) * scale,
        },
        servingGrams: serving,
      });
    } catch (e) {
      setError("Couldn't analyze that label. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const handleManual = async (e) => {
    e.preventDefault();
    const code = manual.replace(/\D/g, "");
    if (code.length < 8) {
      setError("Enter the full barcode digits.");
      return;
    }
    setBusy(true);
    setError("");
    setProduct(null);
    try {
      await lookupBarcode(code);
    } catch (e2) {
      setError("Barcode lookup failed. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  if (product) {
    return (
      <PortionCard
        product={product}
        onResult={onResult}
        onBack={() => setProduct(null)}
        backLabel="Scan again"
      />
    );
  }

  const isLabel = mode === "label";
  return (
    <div>
      <div className="inline-flex gap-1 rounded-full bg-white border border-[#E2E8F0] p-1 mb-3">
        <button
          onClick={() => setMode("barcode")}
          className={cn(
            "inline-flex items-center gap-1.5 px-4 h-9 rounded-full text-sm font-semibold transition",
            !isLabel ? "bg-[#0F172A] text-white" : "text-[#64748B] hover:bg-slate-50"
          )}
        >
          <Barcode className="w-4 h-4" /> Barcode
        </button>
        <button
          onClick={() => setMode("label")}
          className={cn(
            "inline-flex items-center gap-1.5 px-4 h-9 rounded-full text-sm font-semibold transition",
            isLabel ? "bg-[#0F172A] text-white" : "text-[#64748B] hover:bg-slate-50"
          )}
        >
          <ClipboardList className="w-4 h-4" /> Nutrition label
        </button>
      </div>
      {isLabel && (
        <p className="text-xs text-[#64748B] mb-3">
          No barcode match? Snap the nutrition information panel on the packet — the values are read
          straight from the label.
        </p>
      )}
      <ScannerDropzone
        onPhoto={isLabel ? handleLabelPhoto : handlePhoto}
        analyzing={busy}
        hint={isLabel ? "Point at the nutrition panel" : "Point at the barcode"}
        analyzingText={isLabel ? "Reading label…" : "Reading barcode…"}
      />
      {error && (
        <p className="mt-3 text-sm text-rose-600 bg-rose-50 border border-rose-200 rounded-2xl px-4 py-3">{error}</p>
      )}
      {!isLabel && (
        <form onSubmit={handleManual} className="mt-3 flex gap-2">
          <input
            value={manual}
            onChange={(e) => setManual(e.target.value)}
            inputMode="numeric"
            placeholder="Or type the barcode digits"
            className="flex-1 h-12 rounded-full border border-[#E2E8F0] px-4 text-sm text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-emerald-400"
          />
          <button
            type="submit"
            disabled={busy}
            className="h-12 px-5 rounded-full bg-white border border-[#E2E8F0] text-sm font-semibold text-[#0F172A] hover:bg-slate-50 disabled:opacity-50"
          >
            Look up
          </button>
        </form>
      )}
    </div>
  );
}
