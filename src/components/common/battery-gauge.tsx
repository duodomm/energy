"use client"

// Концепт №9 «Приборная панель» (волна 3 С10 «Энергосистема», аксессуар АКБ).
// Неоморфный «прибор» в шаге 4 визарда: аналоговая шкала автономии со стрелкой
// (пружинный easing), цифровое дублирование показаний, LED-ряд глубины
// разряда (DoD) выбранной технологии, верньер-слайдер 0–72 ч — синхронизирован
// с чипами автономии. Все цифры настоящие: из того же computeCalc, что и смета.
//
// Неоморфизм на светлой базе П1: тёплый «алюминий» #ece7dc, двойные тени
// (свет сверху-слева), стрелка — solar-deep, шкала — петроль. WCAG AA:
// подписи muted-foreground, значения foreground.

import { useMemo } from "react"
import { BatteryCharging, Zap } from "lucide-react"
import { computeCalc } from "@/lib/calc/engine"
import type { BatteryTech, CalcInput, RefBundle } from "@/lib/calc/types"

const TECH: Record<Exclude<BatteryTech, "none">, { dod: number; cycles: string; label: string }> = {
  lifepo4: { dod: 0.9, cycles: "6000+ циклов", label: "LiFePO4" },
  nmc: { dod: 0.8, cycles: "3000 циклов", label: "Li-ion NMC" },
  agm: { dod: 0.5, cycles: "600 циклов", label: "AGM" },
  vrfb: { dod: 1.0, cycles: "15000+ циклов", label: "VRFB" },
}

const MAX_H = 72

export function BatteryGauge({
  input,
  bundle,
  onChangeHours,
}: {
  input: CalcInput
  bundle: RefBundle
  onChangeHours: (h: number) => void
}) {
  const hours = input.autonomyHours
  const tech = input.batteryTech

  // Ёмкость — из расчётного ядра (та же цифра пойдёт в смету)
  const batteryKwh = useMemo(() => {
    if (hours === 0 || tech === "none") return 0
    return computeCalc(input, bundle).composition.batteryKwh
  }, [input, bundle, hours, tech])

  const t = tech !== "none" ? TECH[tech] : null
  const pct = Math.min(1, hours / MAX_H)
  const needle = -90 + pct * 180 // −90°…+90°
  const dodPct = t ? Math.round(t.dod * 100) : 0
  const leds = t ? Math.max(1, Math.round(dodPct / 20)) : 0

  if (hours === 0 || tech === "none") {
    return (
      <div className="neu-panel mt-2.5 flex items-center gap-4 p-4">
        <div className="neu-inset flex h-12 w-12 shrink-0 items-center justify-center rounded-full">
          <BatteryCharging className="h-5 w-5 text-muted-foreground" />
        </div>
        <p className="text-sm leading-relaxed text-muted-foreground">
          <b className="text-foreground">АКБ не выбраны.</b> Задайте автономию выше — прибор
          покажет ёмкость, глубину разряда и срок жизни батареи.
        </p>
      </div>
    )
  }

  return (
    <div className="neu-panel mt-2.5 grid gap-4 p-4 sm:p-5 md:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
      {/* Аналоговая шкала автономии */}
      <div className="flex flex-col items-center">
        <svg viewBox="0 0 300 178" className="w-full max-w-[300px]" role="img" aria-label={`Шкала автономии: ${hours} часов`}>
          <text x="150" y="22" textAnchor="middle" className="svg-mono" fontSize="10" letterSpacing="0.14em" fill="#6C7077">
            АВТОНОМИЯ · {t?.label ?? "АКБ"}
          </text>
          <path d="M40 145A110 110 0 0 1 260 145" fill="none" stroke="#D8D2C2" strokeWidth="13" strokeLinecap="round" />
          <path
            d="M40 145A110 110 0 0 1 260 145"
            fill="none"
            stroke="#14657B"
            strokeWidth="13"
            strokeLinecap="round"
            strokeDasharray={`${(pct * 172.8).toFixed(1)} 400`}
            style={{ transition: "stroke-dasharray 0.55s cubic-bezier(.34,1.56,.64,1)" }}
          />
          <g>
            {Array.from({ length: 7 }, (_, i) => {
              const v = i * 12
              const th = ((v / MAX_H) * 180 - 90) * (Math.PI / 180)
              const dx = Math.sin(th)
              const dy = -Math.cos(th)
              const r1 = v % 24 === 0 ? 92 : 97
              return (
                <line
                  key={v}
                  x1={150 + dx * r1}
                  y1={145 + dy * r1}
                  x2={150 + dx * 106}
                  y2={145 + dy * 106}
                  stroke={v >= 48 ? "#B45309" : "#8A94A3"}
                  strokeWidth={v % 24 === 0 ? 2 : 1}
                />
              )
            })}
            {[0, 24, 48, 72].map((v) => {
              const th = ((v / MAX_H) * 180 - 90) * (Math.PI / 180)
              const dx = Math.sin(th)
              const dy = -Math.cos(th)
              return (
                <text
                  key={v}
                  x={150 + dx * 80}
                  y={145 + dy * 80 + 3}
                  textAnchor="middle"
                  className="svg-mono"
                  fontSize="9"
                  fill="#6C7077"
                >
                  {v}
                </text>
              )
            })}
          </g>
          <g
            style={{
              transformOrigin: "150px 145px",
              transform: `rotate(${needle}deg)`,
              transition: "transform 0.55s cubic-bezier(.34,1.56,.64,1)",
            }}
          >
            <line x1="150" y1="145" x2="150" y2="54" stroke="#C2700A" strokeWidth="3.5" strokeLinecap="round" />
          </g>
          <circle cx="150" cy="145" r="11" fill="#F4F0E4" stroke="#B9B2A2" strokeWidth="2" />
          <text x="150" y="130" textAnchor="middle" className="svg-mono" fontSize="30" fontWeight="700" fill="#22272E">
            {hours}
            <tspan fontSize="15" fill="#6C7077"> ч</tspan>
          </text>
        </svg>

        {/* Верньер-слайдер — тот же параметр, что чипы выше */}
        <div className="mt-2 w-full max-w-[300px]">
          <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            <span>Верньер автономии</span>
            <span className="tabular-nums">{hours} / 72 ч</span>
          </div>
          <input
            type="range"
            min={0}
            max={72}
            step={4}
            value={hours}
            onChange={(e) => onChangeHours(Number(e.target.value))}
            className="neu-range mt-2"
            aria-label="Автономия АКБ, часов"
          />
        </div>
      </div>

      {/* Цифровое дублирование + LED DoD */}
      <div className="flex flex-col justify-center gap-3">
        <div className="neu-inset rounded-xl px-4 py-3.5">
          <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            <BatteryCharging className="h-3.5 w-3.5 text-stable" /> Ёмкость батареи
          </p>
          <p className="mt-1 text-2xl font-bold tabular-nums leading-tight">
            {batteryKwh >= 10 ? Math.round(batteryKwh) : Math.round(batteryKwh * 10) / 10}
            <span className="ml-1 text-sm font-medium text-muted-foreground">кВт·ч</span>
          </p>
          <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">
            Считается ядром: C = E · h / (DoD × η) — та же цифра встанет в смету
          </p>
        </div>

        <div className="neu-inset rounded-xl px-4 py-3.5">
          <p className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Глубина разряда (DoD)
            </span>
            <span className="svg-mono text-sm font-bold tabular-nums text-foreground">{dodPct}%</span>
          </p>
          <div className="mt-2.5 flex gap-2">
            {Array.from({ length: 5 }, (_, i) => (
              <span
                key={i}
                className={`neu-led ${i < leds ? "neu-led--on" : ""}`}
                aria-hidden="true"
              />
            ))}
          </div>
          <p className="mt-2.5 text-[11px] leading-relaxed text-muted-foreground">
            {t?.label} · {t?.cycles}. Глубже разряд — меньше циклов: AGM держит 50%,
            LiFePO4 — 90% запаса
          </p>
        </div>

        <div className="flex items-start gap-2.5 rounded-xl border border-border/70 bg-secondary/40 px-4 py-3 text-[11px] leading-relaxed text-muted-foreground">
          <Zap className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
          Проверка по худшему зимнему месяцу включается ниже — если солнца
          не хватит, калькулятор предложит генератор или добавку панелей.
        </div>
      </div>
    </div>
  )
}
