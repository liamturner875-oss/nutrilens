import React from "react";
import { ChevronLeft, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

export const inputCls =
  "w-full h-12 rounded-2xl border border-[#E2E8F0] bg-white px-4 text-[#0F172A] font-medium focus:outline-none focus:ring-2 focus:ring-emerald-400";

export const chip = (active) =>
  cn(
    "px-4 h-11 rounded-full text-sm font-semibold border transition",
    active
      ? "bg-[#0F172A] text-white border-[#0F172A]"
      : "bg-white text-[#64748B] border-[#E2E8F0] hover:bg-slate-50"
  );

export function Field({ label, children }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-[#0F172A] mb-2">{label}</label>
      {children}
    </div>
  );
}

export function NextBtn({ disabled, onClick, label = "Next" }) {
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      className="w-full h-12 rounded-full bg-emerald-500 text-white font-semibold flex items-center justify-center gap-2 hover:bg-emerald-600 disabled:opacity-40 transition"
    >
      {label} <ArrowRight className="w-4 h-4" />
    </button>
  );
}

export function BackBtn({ onClick }) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-1 text-sm font-semibold text-[#64748B] hover:text-[#0F172A]"
    >
      <ChevronLeft className="w-4 h-4" /> Back
    </button>
  );
}
