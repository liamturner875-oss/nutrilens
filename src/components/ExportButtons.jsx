import React from "react";
import { jsPDF } from "jspdf";
import { useMeals } from "@/lib/MealContext";
import { useProfile } from "@/lib/ProfileContext";
import { fmtWeight } from "@/lib/nutrition";
import { Download, FileText } from "lucide-react";

export default function ExportButtons() {
  const { allMeals, targets } = useMeals();
  const { profile, weightEntries } = useProfile();

  const dailyAgg = () => {
    const byDay = {};
    (allMeals || []).forEach((m) => {
      const d = new Date(m.logged_at || m.created_date);
      if (!d.getTime()) return;
      const key = d.toISOString().slice(0, 10);
      const b = (byDay[key] = byDay[key] || {
        calories: 0, protein: 0, carbs: 0, fats: 0, fiber: 0, sodium_mg: 0, potassium_mg: 0,
      });
      b.calories += m.calories || 0;
      b.protein += m.protein || 0;
      b.carbs += m.carbs || 0;
      b.fats += m.fats || 0;
      b.fiber += m.fiber || 0;
      b.sodium_mg += m.sodium_mg || 0;
      b.potassium_mg += m.potassium_mg || 0;
    });
    (weightEntries || []).forEach((w) => {
      const d = new Date(w.logged_at);
      const key = d.toISOString().slice(0, 10);
      if (byDay[key]) byDay[key].weight_kg = w.weight_kg;
      else byDay[key] = { weight_kg: w.weight_kg };
    });
    return Object.entries(byDay).sort(([a], [b]) => (a < b ? -1 : 1));
  };

  const exportCSV = () => {
    const rows = [
      ["Date", "Calories", "Protein g", "Carbs g", "Fats g", "Fiber g", "Sodium mg", "Potassium mg", "Weight kg"],
    ];
    dailyAgg().forEach(([date, b]) =>
      rows.push([
        date,
        Math.round(b.calories || 0),
        Math.round(b.protein || 0),
        Math.round(b.carbs || 0),
        Math.round(b.fats || 0),
        Math.round(b.fiber || 0),
        Math.round(b.sodium_mg || 0),
        Math.round(b.potassium_mg || 0),
        b.weight_kg ? b.weight_kg.toFixed(1) : "",
      ])
    );
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "macrolens-report.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    let y = 20;
    doc.setFontSize(16);
    doc.text("MacroLens Progress Report", 14, y);
    y += 8;
    doc.setFontSize(10);
    doc.setTextColor(120);
    doc.text(`Generated ${new Date().toLocaleDateString()}`, 14, y);
    y += 10;
    doc.setTextColor(30);
    doc.text(
      `Daily targets: ${targets.calories} kcal · P ${targets.protein}g · C ${targets.carbs}g · F ${targets.fats}g`,
      14,
      y
    );
    y += 8;
    if (profile) {
      const first = weightEntries?.[0];
      const change = first ? profile.weight_kg - first.weight_kg : 0;
      doc.text(
        `Weight: ${fmtWeight(profile.weight_kg, profile.units)} (${change > 0 ? "+" : ""}${fmtWeight(change, profile.units)} since start)`,
        14,
        y
      );
      y += 10;
    }
    doc.setFontSize(12);
    doc.text("Daily log", 14, y);
    y += 6;
    doc.setFontSize(9);
    doc.text("Date         kcal    P(g)   C(g)   F(g)   Fiber  Weight", 14, y);
    y += 6;
    dailyAgg()
      .slice(-30)
      .forEach(([date, b]) => {
        if (y > 280) {
          doc.addPage();
          y = 20;
        }
        const cells = [
          date.padEnd(12),
          String(Math.round(b.calories || 0)).padStart(6),
          String(Math.round(b.protein || 0)).padStart(6),
          String(Math.round(b.carbs || 0)).padStart(6),
          String(Math.round(b.fats || 0)).padStart(6),
          String(Math.round(b.fiber || 0)).padStart(5),
          b.weight_kg ? b.weight_kg.toFixed(1).padStart(6) : "",
        ];
        doc.text(cells.join(" "), 14, y);
        y += 5;
      });
    doc.save("macrolens-report.pdf");
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={exportCSV}
        className="h-9 px-4 rounded-full bg-white border border-[#E2E8F0] text-xs font-semibold text-[#0F172A] hover:bg-slate-50 transition inline-flex items-center gap-1.5"
      >
        <Download className="w-3.5 h-3.5" /> CSV
      </button>
      <button
        onClick={exportPDF}
        className="h-9 px-4 rounded-full bg-white border border-[#E2E8F0] text-xs font-semibold text-[#0F172A] hover:bg-slate-50 transition inline-flex items-center gap-1.5"
      >
        <FileText className="w-3.5 h-3.5" /> PDF
      </button>
    </div>
  );
}
