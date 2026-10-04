import React from "react";
import { Outlet } from "react-router-dom";
import { useProfile } from "@/lib/ProfileContext";
import Onboarding from "@/pages/Onboarding";

export default function OnboardingGate() {
  const { profile, loading } = useProfile();

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-[#F8FAF9]">
        <div className="w-8 h-8 border-4 border-emerald-200 border-t-emerald-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!profile) return <Onboarding />;
  return <Outlet />;
}
