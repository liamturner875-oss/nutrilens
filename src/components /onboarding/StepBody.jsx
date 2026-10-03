import React, { useState } from "react";
import { kgToLbs, lbsToKg, cmToFtIn, ftInToCm } from "@/lib/nutrition";
import { Field, inputCls, NextBtn, BackBtn } from "./shared";
import { COUNTRIES, detectCountry } from "@/lib/countries";

export default function StepBody({ data, onNext, onBack }) {
  const imperial = data.units === "imperial";
  const [weight, setWeight] = useState(
    data.weight_kg ? (imperial ? +kgToLbs(data.weight_kg).toFixed(1) : data.weight_kg) : ""
  );
  const h = data.height_cm ? cmToFtIn(data.height_cm) : null;
  const [ft, setFt] = useState(h ? h.ft : "");
  const [inch, setInch] = useState(h ? h.inch : "");
  const [cm, setCm] = useState(data.height_cm || "");
  const [country, setCountry] = useState(data.country || detectCountry() || "");

  const wNum = Number(weight);
  const valid = wNum > 0 && (imperial ? Number(ft) > 0 : Number(cm) > 0) && !!country;

  const submit = () =>
    onNext({
      weight_kg: imperial ? +lbsToKg(wNum).toFixed(1) : wNum,
      height_cm: imperial ? +ftInToCm(ft, inch).toFixed(1) : Number(cm),
      country,
    });

  return (
    <div className="space-y-6">
      <Field label={`Weight (${imperial ? "lbs" : "kg"})`}>
        <input
          type="number"
          step="0.1"
          value={weight}
          onChange={(e) => setWeight(e.target.value)}
          placeholder={imperial ? "160" : "72"}
          className={inputCls}
        />
      </Field>
      <Field label={`Height (${imperial ? "ft / in" : "cm"})`}>
        {imperial ? (
          <div className="flex gap-3">
            <input type="number" value={ft} onChange={(e) => setFt(e.target.value)} placeholder="5" className={inputCls} />
            <input type="number" value={inch} onChange={(e) => setInch(e.target.value)} placeholder="9" className={inputCls} />
          </div>
        ) : (
          <input
            type="number"
            value={cm}
            onChange={(e) => setCm(e.target.value)}
            placeholder="175"
            className={inputCls}
          />
        )}
      </Field>
      <Field label="Country (for local product brands)">
        <select value={country} onChange={(e) => setCountry(e.target.value)} className={inputCls}>
          <option value="">Select your country</option>
          {COUNTRIES.map((c) => (
            <option key={c.code} value={c.code}>
              {c.name}
            </option>
          ))}
        </select>
      </Field>
      <div className="flex items-center justify-between">
        <BackBtn onClick={onBack} />
        <div className="w-32">
          <NextBtn disabled={!valid} onClick={submit} />
        </div>
      </div>
    </div>
  );
}
