"use client"

// Быстрый дачный калькулятор — 3 шага (ТЗ 4.4): регион → приборы → контакт.
// Выдача: типовой комплект 1–6 кВт, цена «от–до», кнопка «усложнить расчёт»
// ведёт в профессиональный калькулятор с перенесёнными данными.

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { ChevronLeft, ChevronRight, Zap, Sun, BatteryCharging, ArrowRight, Home } from "lucide-react"
import { loadRefBundle } from "@/lib/calc/ref-bundle"
import { computeCalc } from "@/lib/calc/engine"
import { normalizeInput, loadInput, saveInput } from "@/lib/calc/share"
import { LOAD_PRESETS, APPLIANCE_PRESETS } from "@/lib/calc/constants"
import type { CalcInput, CalcResult, RefBundle } from "@/lib/calc/types"
import { formatRub } from "@/lib/calc/ref-bundle"
import { LeadForm } from "@/components/lead/lead-form"
import { navigate } from "@/lib/router"
import { trackGoal } from "@/lib/analytics"
import { PageHero } from "@/components/common/page-hero"
import { AdSlot } from "@/components/common/ad-slot"
import { cn } from "@/lib/utils"

const APPLIANCE_LIST = [
  { id: "fridge", label: "Холодильник", kwh: 1.0 },
  { id: "pump", label: "Насос скважины", kwh: 1.2, start: true },
  { id: "light", label: "Освещение", kwh: 0.5 },
  { id: "tv", label: "ТВ / роутер", kwh: 0.5 },
  { id: "kettle", label: "Чайник, СВЧ", kwh: 1.0 },
  { id: "tools", label: "Инструмент", kwh: 1.0, start: true },
  { id: "washer", label: "Стиральная машина", kwh: 1.0, start: true },
  { id: "boiler", label: "Бойлер 50 л", kwh: 2.0 },
]

export function DachaCalcPage() {
  const [bundle, setBundle] = useState<RefBundle | null>(null)
  const [step, setStep] = useState(1)
  const [regionCode, setRegionCode] = useState("moskva")
  const [checked, setChecked] = useState<string[]>(["fridge", "pump", "light", "tv", "kettle"])
  const [result, setResult] = useState<CalcResult | null>(null)
  const [contactSent, setContactSent] = useState(false)

  useEffect(() => {
    loadRefBundle().then(setBundle).catch(() => undefined)
    trackGoal("dacha_calc_start")
  }, [])

  const dailyKwh = Math.max(1, APPLIANCE_LIST.filter((a) => checked.includes(a.id)).reduce((s, a) => s + a.kwh, 0))
  const hasStart = APPLIANCE_LIST.some((a) => checked.includes(a.id) && a.start)

  const calc = () => {
    if (!bundle) return
    const input: CalcInput = normalizeInput({
      objectType: "dacha",
      mode: "autonomous",
      regionCode,
      voltage: "220",
      dailyKwh,
      tariffPlan: "flat",
      peakKw: hasStart ? 2.5 : 1.5,
      startK: 3,
      powerMode: "kw",
      panelKw: dailyKwh <= 2 ? 1.1 : dailyKwh <= 3.5 ? 2.2 : dailyKwh <= 5 ? 3.3 : 5.5,
      panelClass: "std",
      installType: "ground",
      orientation: "south",
      shading: "none",
      autonomyHours: 12,
      batteryTech: "lifepo4",
      generator: "none",
      cableM: 15,
      switchboard: true,
      loadProfile: [...LOAD_PRESETS.dacha],
    })
    setResult(computeCalc(input, bundle))
    saveInput(input)
    trackGoal("dacha_calc_complete", { region: regionCode, dailyKwh })
  }

  const goPro = () => {
    // «Усложнить расчёт» с перенесёнными данными (ТЗ 4.4)
    const input = normalizeInput({
      objectType: "dacha", mode: "autonomous", regionCode, dailyKwh,
      peakKw: hasStart ? 2.5 : 1.5, panelKw: dailyKwh <= 2 ? 1.1 : dailyKwh <= 3.5 ? 2.2 : dailyKwh <= 5 ? 3.3 : 5.5,
      autonomyHours: 12, batteryTech: "lifepo4", installType: "ground", cableM: 15,
      appliances: APPLIANCE_PRESETS.dacha,
    })
    saveInput(input)
    navigate("#/kalkulyator")
  }

  if (!bundle) {
    return (
      <div className="mx-auto max-w-2xl space-y-3 px-4 py-16">
        <div className="calc-progress-bar"><div style={{ width: "45%" }} /></div>
        <p className="text-sm text-muted-foreground">Загружаем справочник…</p>
      </div>
    )
  }

  return (
    <div>
      <PageHero
        eyebrow="Дачный калькулятор · 3 шага"
        title="Дачный комплект «под ключ» за минуту"
        description="Отметьте приборы — получите типовой комплект (панели, АКБ, инвертор) и вилку цены. Хотите точности — один клик до профессионального расчёта."
      />
      <div className="mx-auto max-w-2xl px-4 pb-10 sm:px-6">
        {result ? (
          <DachaResult
            result={result}
            onPro={goPro}
            onAgain={() => { setResult(null); setStep(1) }}
            contactSent={contactSent}
            onContactSent={() => setContactSent(true)}
            regionCode={regionCode}
          />
        ) : (
          <div className="card-premium p-5 md:p-7">
            <div className="mb-6">
              <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
                <span className="font-medium text-foreground">{["Регион", "Приборы", "Контакты"][step - 1]}</span>
                <span>Шаг {step} из 3</span>
              </div>
              <div className="calc-progress-bar"><div style={{ width: `${(step / 3) * 100}%` }} /></div>
            </div>

            {step === 1 && (
              <div>
                <Label className="mb-2.5">Где находится дача?</Label>
                <Select value={regionCode} onValueChange={setRegionCode}>
                  <SelectTrigger className="h-12 w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="max-h-80">
                    {bundle.regions.map((r) => (
                      <SelectItem key={r.code} value={r.code}>{r.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                  Регион задаёт солнечный ресурс (PSH), цену монтажа и тип креплений.
                  Считаем автономный комплект — как будто сети нет; есть сеть, станет дешевле.
                </p>
              </div>
            )}

            {step === 2 && (
              <div>
                <Label className="mb-3">Что должно работать?</Label>
                <div className="grid gap-2 sm:grid-cols-2">
                  {APPLIANCE_LIST.map((a) => (
                    <label
                      key={a.id}
                      className={cn(
                        "flex cursor-pointer items-center gap-3 rounded-xl border p-3.5 transition-colors",
                        checked.includes(a.id) ? "border-primary/50 bg-primary/8" : "border-border hover:border-border/80",
                      )}
                    >
                      <Checkbox
                        checked={checked.includes(a.id)}
                        onCheckedChange={(v) =>
                          setChecked(v ? [...checked, a.id] : checked.filter((x) => x !== a.id))
                        }
                      />
                      <span className="flex-1 text-sm">{a.label}</span>
                      <span className="text-xs text-muted-foreground">{a.kwh} кВт·ч/сут</span>
                      {a.start && <Zap className="h-3.5 w-3.5 text-primary" title="Пусковые токи" />}
                    </label>
                  ))}
                </div>
                <p className="mt-4 text-sm text-muted-foreground">
                  Итого: <b className="text-foreground">{dailyKwh} кВт·ч/сутки</b>
                </p>
              </div>
            )}

            {step === 3 && (
              <div>
                <p className="text-sm font-medium">Куда прислать точную смету?</p>
                <p className="mt-1.5 text-sm text-muted-foreground">
                  Результат покажем сразу — контакты нужны только для PDF-сметы
                  и проверки расчёта инженером. Без них тоже покажем, честно.
                </p>
                <div className="mt-5">
                  <LeadForm
                    formId="dacha"
                    compact
                    submitLabel="Показать расчёт и прислать смету"
                    objectType="dacha"
                    region={regionCode}
                    scenario="autonomous"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => { calc(); trackGoal("dacha_calc_complete") }}
                  className="mt-4 text-sm text-muted-underline text-muted-foreground underline underline-offset-4 hover:text-foreground"
                >
                  Пропустить — сразу результат
                </button>
              </div>
            )}

            <div className="mt-8 flex items-center justify-between border-t border-border/70 pt-5">
              <Button variant="ghost" onClick={() => setStep(Math.max(1, step - 1))} disabled={step === 1}>
                <ChevronLeft className="mr-1.5 h-4 w-4" /> Назад
              </Button>
              <Button
                className="bg-gradient-solar text-primary-foreground hover:opacity-95"
                onClick={() => {
                  if (step === 3) { calc(); setContactSent(false) } else setStep(step + 1)
                }}
              >
                {step === 3 ? "Показать результат" : "Далее"}
                <ChevronRight className="ml-1.5 h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
      <div className="mx-auto max-w-7xl px-4 pb-10 sm:px-6">
        <AdSlot variant="banner" />
      </div>
    </div>
  )
}

function DachaResult({
  result, onPro, onAgain, contactSent, onContactSent, regionCode,
}: {
  result: CalcResult
  onPro: () => void
  onAgain: () => void
  contactSent: boolean
  onContactSent: () => void
  regionCode: string
}) {
  const c = result.composition
  const e = result.economy
  return (
    <div className="space-y-5">
      <div className="card-premium border-gradient-solar p-5 md:p-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-primary">Типовой комплект</p>
        <h2 className="mt-1.5 text-2xl font-bold tracking-tight">
          Дача {c.pnom} кВт · {result.region.name}
        </h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <div className="flex items-center gap-3 rounded-xl bg-secondary/40 p-3.5">
            <Sun className="h-6 w-6 shrink-0 text-primary" />
            <div>
              <p className="text-sm font-semibold">{c.panelCount} панелей · {c.pnom} кВт</p>
              <p className="text-xs text-muted-foreground">наземный каркас</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-xl bg-secondary/40 p-3.5">
            <BatteryCharging className="h-6 w-6 shrink-0 text-primary" />
            <div>
              <p className="text-sm font-semibold">АКБ {c.batteryKwh} кВт·ч</p>
              <p className="text-xs text-muted-foreground">LiFePO4, {result.autonomy?.hours} ч автономии</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-xl bg-secondary/40 p-3.5">
            <Zap className="h-6 w-6 shrink-0 text-primary" />
            <div>
              <p className="text-sm font-semibold">Инвертор {c.inverterKw} кВт</p>
              <p className="text-xs text-muted-foreground">220 В, MPPT</p>
            </div>
          </div>
        </div>
        <div className="mt-5 flex flex-wrap items-end justify-between gap-3 border-t border-border/70 pt-4">
          <div>
            <p className="text-xs text-muted-foreground">Инвестиции «от–до»</p>
            <p className="text-2xl font-bold">
              <span className="text-gradient-solar">{formatRub(e.capexFrom)}</span>
              <span className="mx-1.5 text-muted-foreground">—</span>
              <span>{formatRub(e.capexTo)}</span>
            </p>
          </div>
          <div className="text-right text-sm text-muted-foreground">
            <p>Генерация: {result.annualGeneration.toLocaleString("ru-RU")} кВт·ч/год</p>
            <p>Запас на зимние наезды: {result.winterAdvice ? "добрать панели или генератор" : "хватает с запасом"}</p>
          </div>
        </div>
      </div>

      {result.warnings.map((w, i) => (
        <p key={i} className="rounded-xl border border-border bg-secondary/40 p-3.5 text-sm leading-relaxed text-muted-foreground">{w.text}</p>
      ))}

      {!contactSent && (
        <div className="card-premium p-5">
          <p className="text-sm font-medium">Точная смета за 24 часа</p>
          <p className="mb-4 mt-1 text-sm text-muted-foreground">Инженер проверит расчёт и цены поставщиков вашего региона.</p>
          <LeadForm
            formId="dacha_result"
            compact
            submitLabel="Прислать смету инженера"
            objectType="dacha"
            region={regionCode}
            scenario="autonomous"
            capexFrom={e.capexFrom}
            capexTo={e.capexTo}
          />
        </div>
      )}

      <div className="flex flex-wrap gap-2.5">
        <Button variant="outline" onClick={onPro}>
          Усложнить расчёт — профессиональный <ArrowRight className="ml-1.5 h-4 w-4" />
        </Button>
        <Button variant="ghost" onClick={onAgain}>
          <Home className="mr-1.5 h-4 w-4" /> Заново
        </Button>
      </div>
      <p className="text-xs leading-relaxed text-muted-foreground">
        Это оценка по типовому комплекту. Профессиональный калькулятор учтёт кровлю/затенение,
        двухтарифный счётчик, генератор и даст полную смету по нормо-часам.
      </p>
    </div>
  )
}
