import React, { useState } from "react";
import { ScanLine } from "lucide-react";
import { useProfile } from "@/lib/ProfileContext";
import StepBasics from "@/components/onboarding/StepBasics";
import StepBody from "@/components/onboarding/StepBody";
import StepGoal from "@/components/onboarding/StepGoal";
import StepResults from "@/components/onboarding/StepResults";

const TITLES = ["Your basics", "Your body", "Your goal", "Your targets"];
const STEPS = [StepBasics, StepBody, StepGoal, StepResults];

export default function Onboarding() {
  const { saveProfile } = useProfile();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState({
    units: "metric",
    age: "",
    sex: "male",
    weight_kg: "",
    height_cm: "",
    goal: "",
    activity_level: "moderate",
    goal_weight_kg: "",
    country: "",
  });

  const next = (patch) => {
    setData((d) => ({ ...d, ...patch }));
    setStep((s) => s + 1);
  };
  const back = () => setStep((s) => s - 1);
  const finish = async () => {
    setSaving(true);
    setError("");
    try {
      await saveProfile(data);
    } catch (e) {
      setError("Couldn't save your profile. Please try again.");
      setSaving(false);
    }
  };

  const Step = STEPS[step];

  return (
    <div className="min-h-screen bg-[#F8FAF9] flex items-center justify-center p-4">
      <div className="w-full max-w-lg rounded-[24px] bg-white border border-[#E2E8F0] p-6 sm:p-8 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center">
            <ScanLine className="w-4 h-4 text-white" />
          </div>
          <span className="font-heading font-extrabold text-lg text-[#0F172A]">MacroLens</span>
        </div>
        <h1 className="font-heading font-extrabold text-2xl text-[#0F172A] mt-4">
          {TITLES[step]}
        </h1>
        <p className="text-sm text-[#64748B] mt-1 mb-4">
          Step {step + 1} of 4 — so your macro targets are truly yours.
        </p>
        <div className="h-1.5 rounded-full bg-slate-100 mb-6">
          <div
            className="h-1.5 rounded-full bg-emerald-500 transition-all"
            style={{ width: `${((step + 1) / 4) * 100}%` }}
          />
        </div>
        {error && <p className="text-sm text-rose-600 mb-4">{error}</p>}
        <Step data={data} onNext={next} onBack={back} onFinish={finish} saving={saving} />
      </div>
    </div>
  );
}
