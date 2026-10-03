import React, { useState } from "react";
import { Field, inputCls, chip, NextBtn } from "./shared";

export default function StepBasics({ data, onNext }) {
  const [units, setUnits] = useState(data.units || "metric");
  const [age, setAge] = useState(data.age || "");
  const [sex, setSex] = useState(data.sex || "male");
  const valid = Number(age) >= 13 && Number(age) <= 100;

  return (
    <div className="space-y-6">
      <Field label="Measurement units">
        <div className="flex gap-2">
          <button onClick={() => setUnits("metric")} className={chip(units === "metric")}>
            Metric (kg / cm)
          </button>
          <button onClick={() => setUnits("imperial")} className={chip(units === "imperial")}>
            Imperial (lbs / ft)
          </button>
        </div>
      </Field>
      <Field label="Age">
        <input
          type="number"
          value={age}
          onChange={(e) => setAge(e.target.value)}
          placeholder="25"
          className={inputCls}
        />
      </Field>
      <Field label="Sex (used for metabolism)">
        <div className="flex gap-2">
          <button onClick={() => setSex("male")} className={chip(sex === "male")}>Male</button>
          <button onClick={() => setSex("female")} className={chip(sex === "female")}>Female</button>
        </div>
      </Field>
      <NextBtn disabled={!valid} onClick={() => onNext({ units, age: Number(age), sex })} />
    </div>
  );
}
