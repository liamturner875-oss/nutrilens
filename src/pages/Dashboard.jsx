import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMeals } from "@/lib/MealContext";
import ScannerDropzone from "@/components/ScannerDropzone";
import DescribeMeal from "@/components/DescribeMeal";
import HydrationCard from "@/components/HydrationCard";
import TemplatesSection from "@/components/TemplatesSection";
import MacroRings from "@/components/MacroRings";
import MealLog from "@/components/MealLog";
import AnalysisPanel from "@/components/AnalysisPanel";
import BarcodeScanner from "@/components/BarcodeScanner";
import ProductSearch from "@/components/ProductSearch";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { Sparkles, AlertCircle, Camera, MessageSquareText, QrCode, Search } from "lucide-react";

const ANALYSIS_SCHEMA = {
  type: "object",
  properties: {
    description: { type: "string" },
    calories: { type: "number" },
    calories_low: { type: "number" },
    calories_high: { type: "number" },
    protein: { type: "number" },
    carbs: { type: "number" },
    fats: { type: "number" },
    fiber: { type: "number" },
    sodium_mg: { type: "number" },
    potassium_mg: { type: "number" },
    confidence: { type: "number" },
    items: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: { type: "string" },
          calories: { type: "number" },
          protein: { type: "number" },
          carbs: { type: "number" },
          fats: { type: "number" },
        },
      },
    },
  },
};

const PROMPT = `You are a precision nutrition AI (like Cal AI / Noom). Analyze the food in this photo.
Identify each visible food item and estimate realistic portion sizes.
Real-world photos are messy: dim restaurant lighting, crowded mixed dishes, partially eaten plates, packaging that hides portions. Handle these honestly — scale portions from visible reference objects (plate size, utensils, hands), account for occluded food, and for a partially eaten plate estimate what REMAINS on the plate.
Return:
- description: a short name for the whole meal
- calories: your best point estimate of total calories
- calories_low, calories_high: a plausible range around the estimate. WIDEN the range when lighting, angle, or occlusion make portions uncertain — an honest range beats a confident wrong number
- protein, carbs, fats: total grams
- fiber: total grams; sodium_mg and potassium_mg: total milligrams
- confidence: 0-100 confidence in the estimate — be honest and drop it for ambiguous photos
- items: array of each detected food item with its own calories/protein/carbs/fats
Be conservative and realistic. If the image is not food, return zeros and description "No food detected".`;

const TEXT_PROMPT = `You are a precision nutrition AI. The user describes what they ate in casual, natural language (typed or dictated), e.g. "two eggs, a piece of toast with butter, and a protein shake". Parse every food and drink mentioned, estimate realistic portions, and return:
- description: a short name for the whole meal
- calories: your best point estimate; calories_low, calories_high: a plausible range — widen it when the description is vague about portions
- protein, carbs, fats: total grams
- fiber: total grams; sodium_mg and potassium_mg: total milligrams
- confidence: 0-100 confidence in the estimate
- items: array of each food with its own calories/protein/carbs/fats
Be conservative and realistic. If nothing edible is described, return zeros and description "No food detected".
Meal description: """`;

const REVISE_PROMPT = (analysis, correction) => `You are a precision nutrition AI. You previously estimated a meal as this JSON:
${JSON.stringify(analysis)}
The user corrected you with this note: "${correction}"
The user knows their real portions better than the photo does — honor the correction fully, adjust the relevant items, and return a REVISED estimate with the same fields (description, calories, calories_low, calories_high, protein, carbs, fats, fiber, sodium_mg, potassium_mg, confidence, items). Slightly raise confidence, since a human verified the portions.`;

export default function Home() {
  const { meals, allMeals, totals, targets, addMeal, deleteMeal } = useMeals();
  const isMobile = useIsMobile();
  const [mode, setMode] = useState("scan"); // scan | describe
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [photoUrl, setPhotoUrl] = useState(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const startAnalysis = () => {
    setError("");
    setAnalysis(null);
    setSaved(false);
  };

  // Feed past user corrections into new estimates so accuracy improves over time
  const learnBlock = (() => {
    const fixes = (allMeals || [])
      .filter((m) => m.correction_text)
      .slice(-5)
      .map(
        (m) =>
          `- "${m.description}": AI estimated ${Math.round(m.original_calories || m.calories)} kcal; user note: "${m.correction_text}"; corrected to ${Math.round(m.calories)} kcal`
      );
    return fixes.length
      ? `\nThis user has corrected past estimates — calibrate your portion estimates accordingly:\n${fixes.join("\n")}`
      : "";
  })();

  const handleProductResult = (result) => {
    startAnalysis();
    setPhotoUrl(null);
    setAnalysis(result);
  };

  const handlePhoto = async (file) => {
    startAnalysis();
    setAnalyzing(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadPublicFile({ file });
      setPhotoUrl(file_url);
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: PROMPT + learnBlock,
        file_urls: [file_url],
        response_json_schema: ANALYSIS_SCHEMA,
        model: "gemini_3_flash",
      });
      if (!res || (res.calories === 0 && !res.items?.length)) {
        setError("Couldn't identify food in this photo. Try another angle.");
      } else {
        setAnalysis(res);
      }
    } catch (e) {
      setError("Analysis failed. Please try again.");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleDescribe = async (text) => {
    startAnalysis();
    setPhotoUrl(null);
    setAnalyzing(true);
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `${TEXT_PROMPT}${text}"""${learnBlock}`,
        response_json_schema: ANALYSIS_SCHEMA,
      });
      if (!res || (res.calories === 0 && !res.items?.length)) {
        setError("Couldn't parse that description. Try adding a bit more detail.");
      } else {
        setAnalysis(res);
      }
    } catch (e) {
      setError("Analysis failed. Please try again.");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleRevise = async (correction) => {
    if (!analysis || !correction.trim()) return;
    setAnalyzing(true);
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: REVISE_PROMPT(analysis, correction.trim()),
        response_json_schema: ANALYSIS_SCHEMA,
      });
      if (!res || (!res.calories && !res.items?.length)) {
        setError("Couldn't revise that estimate. Try rephrasing your note.");
      } else {
        setAnalysis({
          ...res,
          items: res.items?.length ? res.items : analysis.items,
          revised: true,
          correction_text: correction.trim(),
          original_calories: analysis.original_calories || analysis.calories,
        });
      }
    } catch (e) {
      setError("Couldn't revise the estimate. Please try again.");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSave = async (mealType) => {
    if (!analysis) return;
    setSaving(true);
    try {
      await addMeal({
        photo_url: photoUrl,
        description: analysis.description,
        calories: analysis.calories,
        original_calories: analysis.original_calories || analysis.calories,
        correction_text: analysis.correction_text,
        protein: analysis.protein,
        carbs: analysis.carbs,
        fats: analysis.fats,
        fiber: analysis.fiber || 0,
        sodium_mg: analysis.sodium_mg || 0,
        potassium_mg: analysis.potassium_mg || 0,
        confidence: analysis.confidence,
        items: analysis.items,
        meal_type: mealType,
        logged_at: new Date().toISOString(),
      });
      setSaved(true);
      setAnalysis(null);
      setPhotoUrl(null);
    } catch (e) {
      setError("Couldn't save the meal. Try again.");
    } finally {
      setSaving(false);
    }
  };

  if (isMobile) {
    return (
      <div className="flex flex-col min-h-[calc(100vh-4rem)]">
        {/* Camera / describe area */}
        <div className="relative" style={{ height: "55vh" }}>
          <div className="absolute inset-0 p-4 pt-6 flex flex-col">
            <div className="flex justify-center">
              <ModeToggle mode={mode} setMode={setMode} />
            </div>
            <div className="flex-1 mt-3">
              {mode === "scan" ? (
                <ScannerDropzone onPhoto={handlePhoto} analyzing={analyzing} />
              ) : mode === "barcode" ? (
                <BarcodeScanner onResult={handleProductResult} />
              ) : mode === "search" ? (
                <ProductSearch onResult={handleProductResult} />
              ) : (
                <DescribeMeal onAnalyze={handleDescribe} analyzing={analyzing} />
              )}
            </div>
          </div>
        </div>
        {/* Bottom sheet */}
        <div className="flex-1 -mt-4 rounded-t-[28px] bg-[#F8FAF9] border-t border-[#E2E8F0] p-5 overflow-y-auto">
          {error && <ErrorNote text={error} />}
          {analysis ? (
            <AnalysisPanel
              analysis={analysis}
              photoUrl={photoUrl}
              onSave={handleSave}
              onRevise={handleRevise}
              saving={saving}
              saved={saved}
            />
          ) : (
            <>
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-heading font-bold text-lg text-[#0F172A]">Today</h2>
                <MacroPill totals={totals} targets={targets} />
              </div>
              <MacroRings totals={totals} targets={targets} />
              <div className="mt-5">
                <HydrationCard />
              </div>
              <div className="mt-5">
                <h3 className="font-heading font-bold text-sm text-[#0F172A] mb-3">Meal log</h3>
                <MealLog meals={meals} onDelete={deleteMeal} />
              </div>
              <div className="mt-5">
                <TemplatesSection />
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  // Desktop split 60/40
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-6">
      {/* Left: scanner + log */}
      <div className="space-y-6">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-5 h-5 text-emerald-500" />
            <h1 className="font-heading font-extrabold text-2xl text-[#0F172A]">Track your plate</h1>
          </div>
          <div className="mb-3">
            <ModeToggle mode={mode} setMode={setMode} />
          </div>
          {mode === "scan" ? (
            <ScannerDropzone onPhoto={handlePhoto} analyzing={analyzing} />
          ) : mode === "barcode" ? (
            <BarcodeScanner onResult={handleProductResult} />
          ) : mode === "search" ? (
            <ProductSearch onResult={handleProductResult} />
          ) : (
            <DescribeMeal onAnalyze={handleDescribe} analyzing={analyzing} />
          )}
          {error && <div className="mt-3"><ErrorNote text={error} /></div>}
        </div>
        <div>
          <h2 className="font-heading font-bold text-lg text-[#0F172A] mb-3">Today's log</h2>
          <MealLog meals={meals} onDelete={deleteMeal} />
        </div>
      </div>

      {/* Right: breakdown + extras */}
      <div className="space-y-6">
        <div className="rounded-[24px] bg-white border border-[#E2E8F0] p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-heading font-bold text-lg text-[#0F172A]">Macro & Calorie breakdown</h2>
            <MacroPill totals={totals} targets={targets} />
          </div>
          <MacroRings totals={totals} targets={targets} />
        </div>
        {analysis ? (
          <AnalysisPanel
            analysis={analysis}
            photoUrl={photoUrl}
            onSave={handleSave}
            onRevise={handleRevise}
            saving={saving}
            saved={saved}
          />
        ) : (
          <div className="rounded-[24px] bg-white border border-dashed border-[#E2E8F0] p-8 text-center">
            <p className="text-sm text-[#64748B]">
              Snap a photo or describe your meal to see a live macro & calorie breakdown here.
            </p>
          </div>
        )}
        <HydrationCard />
        <TemplatesSection />
      </div>
    </div>
  );
}

function ModeToggle({ mode, setMode }) {
  const options = [
    { value: "scan", label: "Snap a photo", icon: Camera },
    { value: "describe", label: "Describe it", icon: MessageSquareText },
    { value: "barcode", label: "Barcode", icon: QrCode },
    { value: "search", label: "Search", icon: Search },
  ];
  return (
    <div className="inline-flex gap-1 rounded-full bg-white border border-[#E2E8F0] p-1">
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => setMode(o.value)}
          className={cn(
            "inline-flex items-center gap-1.5 px-4 h-9 rounded-full text-sm font-semibold transition",
            mode === o.value ? "bg-[#0F172A] text-white" : "text-[#64748B] hover:bg-slate-50"
          )}
        >
          <o.icon className="w-4 h-4" /> {o.label}
        </button>
      ))}
    </div>
  );
}

function MacroPill({ totals, targets }) {
  const left = Math.max(0, targets.calories - totals.calories);
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200">
      <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
      {Math.round(left)} cal left
    </span>
  );
}

function ErrorNote({ text }) {
  return (
    <div className="flex items-center gap-2 text-sm text-rose-600 bg-rose-50 border border-rose-200 rounded-2xl px-4 py-3">
      <AlertCircle className="w-4 h-4 shrink-0" />
      {text}
    </div>
  );
}
