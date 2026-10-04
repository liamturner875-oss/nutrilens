import React from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import { ScanLine, History as HistoryIcon, LineChart, Flame, Dumbbell } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useMeals } from "@/lib/MealContext";

export default function Layout() {
  const isMobile = useIsMobile();
  const { pathname } = useLocation();
  const { totals, targets } = useMeals();
  const remaining = Math.max(0, targets.calories - (totals.calories || 0));

  const nav = [
    { to: "/", label: "Scan", icon: ScanLine },
    { to: "/progress", label: "Progress", icon: LineChart },
    { to: "/exercise", label: "Workouts", icon: Dumbbell },
    { to: "/history", label: "History", icon: HistoryIcon },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAF9]">
      {/* Desktop header */}
      {!isMobile && (
        <header className="sticky top-0 z-30 glass border-b border-[#E2E8F0]">
          <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-emerald-500 flex items-center justify-center">
                <ScanLine className="w-5 h-5 text-white" />
              </div>
              <span className="font-heading font-extrabold text-xl text-[#0F172A]">MacroLens</span>
            </Link>
            <nav className="flex items-center gap-1">
              {nav.map((n) => {
                const active = pathname === n.to;
                return (
                  <Link
                    key={n.to}
                    to={n.to}
                    className={`flex items-center gap-2 px-4 h-10 rounded-full text-sm font-semibold transition ${
                      active ? "bg-[#0F172A] text-white" : "text-[#64748B] hover:bg-slate-100"
                    }`}
                  >
                    <n.icon className="w-4 h-4" /> {n.label}
                  </Link>
                );
              })}
            </nav>
            <div className="flex items-center gap-2 text-sm">
              <Flame className="w-4 h-4 text-sky-500" />
              <span className="font-semibold text-[#0F172A] tabular-nums">{Math.round(remaining)}</span>
              <span className="text-[#64748B]">cal left today</span>
            </div>
          </div>
        </header>
      )}

      <main className={isMobile ? "pb-24" : "max-w-7xl mx-auto px-6 py-8"}>
        <Outlet />
      </main>

      {/* Mobile bottom bar */}
      {isMobile && (
        <nav className="fixed bottom-0 inset-x-0 z-30 glass border-t border-[#E2E8F0] px-6 h-16 flex items-center justify-around">
          {nav.map((n) => {
            const active = pathname === n.to;
            return (
              <Link
                key={n.to}
                to={n.to}
                className={`flex flex-col items-center gap-0.5 text-[11px] font-semibold ${
                  active ? "text-emerald-600" : "text-[#64748B]"
                }`}
              >
                <n.icon className="w-5 h-5" />
                {n.label}
              </Link>
            );
          })}
        </nav>
      )}
    </div>
  );
}
