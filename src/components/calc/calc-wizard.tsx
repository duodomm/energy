"use client"

// Профессиональный калькулятор — 6 шагов (ТЗ 4.1):
// результат показывается НЕЗАВИСИМО от заполнения контактов (принцип итерации 14 ТЗ)

import { useEffect, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { ChevronLeft, ChevronRight, RotateCcw, Share2, Sparkles, FileDown, Mail } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { computeCalc } from "@/lib/calc/engine"
import { normalizeInput, loadInput, saveInput, buildShareUrl, readShareFromLocation } from "@/lib/calc/share"
import { LOAD_PRESETS } from "@/lib/calc/constants"
import { loadRefBundle } from "@/lib/calc/ref-bundle"
import type { CalcInput, CalcResult, RefBundle } from "@/lib/calc/types"
import { loadAppliances } from "./load-builder"
import { StepObject, StepPower, StepGeneration, StepStorage, StepMount } from "./wizard-steps"
import { SolarHouseCard } from "./solar-house"
import { ResultView } from "./result-view"
import { LeadForm } from "@/components/lead/lead-form"
import { trackGoal } from "@/lib/analytics"
import { navigate } from "@/lib/router"

const STEP_TITLES = ["Объект и режим", "Электроснабжение", "Генерация", "Накопление", "Монтаж", "Контакты"]

export function CalcWizard({
  bundle, initialInput, autoResult = false,
}: {
  bundle: RefBundle
  initialInput?: CalcInput | null
  autoResult?: boolean
}) {
  const [input, setInput] = useState<CalcInput>(() => initialInput ?? defaults())
  const [step, setStep] = useState(1)
  // Расшаренная ссылка (#calc=...): получатель сразу видит смету со схемой,
  // «Изменить параметры» возвращает в визард с восстановленными значениями
  const [showResult, setShowResult] = useState(autoResult)

  const set = (patch: Partial<CalcInput>) => setInput((prev) => ({ ...prev, ...patch }))

  // Результат пересчитывается в браузере (ТЗ: клиентское ядро) — прямо в рендере
  const result: CalcResult | null = showResult ? computeCalc(input, bundle) : null

  const next = () => {
    if (step === 1) trackGoal("calc_start", { object: input.objectType, mode: input.mode })
    trackGoal("calc_step", { step })
    if (step < 6) {
      setStep(step + 1)
      window.scrollTo({ top: 0, behavior: "smooth" })
    } else {
      // Шаг 6: показать результат независимо от контактов
      saveInput(input)
      setShowResult(true)
      trackGoal("calc_complete", { region: input.regionCode, mode: input.mode })
      window.scrollTo({ top: 0, behavior: "smooth" })
    }
  }
  const back = () => {
    if (showResult) {
      setShowResult(false)
      return
    }
    if (step > 1) setStep(step - 1)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }
  const reset = () => {
    setInput(defaults())
    setStep(1)
    setShowResult(false)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const share = () => {
    const url = buildShareUrl(input)
    navigator.clipboard?.writeText(url).then(
      () => toast({ title: "Ссылка скопирована", description: "Stateless-ссылка на расчёт: параметры закодированы в URL, срок жизни не ограничен" }),
      () => toast({ title: "Ссылка", description: url }),
    )
    trackGoal("share_click")
  }

  if (showResult && result) {
    return (
      <div className="mx-auto max-w-3xl space-y-8">
        <div className="no-print flex flex-wrap items-center gap-2.5">
          <Button variant="outline" onClick={back}>
            <ChevronLeft className="mr-1.5 h-4 w-4" /> Изменить параметры
          </Button>
          <Button variant="outline" onClick={share}>
            <Share2 className="mr-1.5 h-4 w-4" /> Поделиться расчётом
          </Button>
          <Button variant="outline" onClick={reset}>
            <RotateCcw className="mr-1.5 h-4 w-4" /> Новый расчёт
          </Button>
          <Button variant="outline" onClick={() => navigate("#/kalkulyator/dacha")}>
            Упростить (дачный)
          </Button>
        </div>
        <ResultView result={result} bundle={bundle} />
      </div>
    )
  }

  // Живой конфигуратор №4: сцена справа (десктоп, sticky) / сверху (мобайл)
  // и обновляется на каждом шаге вместе с формой
  return (
    <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_330px] lg:items-start lg:gap-7 xl:grid-cols-[minmax(0,1fr)_375px]">
      <div className="min-w-0">
      {/* Прогресс */}
      <div className="mb-8">
        <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
          <span className="font-medium text-foreground">{STEP_TITLES[step - 1]}</span>
          <span>Шаг {step} из 6</span>
        </div>
        <div className="calc-progress-bar">
          <div style={{ width: `${(step / 6) * 100}%` }} />
        </div>
        <div className="mt-2.5 hidden gap-1.5 sm:flex">
          {STEP_TITLES.map((t, i) => (
            <button
              key={t}
              type="button"
              onClick={() => i + 1 < step && setStep(i + 1)}
              disabled={i + 1 > step}
              className={`rounded-md px-2 py-1 text-[11px] transition-colors ${
                i + 1 === step ? "bg-primary/15 text-primary" : i + 1 < step ? "text-muted-foreground hover:text-foreground" : "text-muted-foreground/40"
              }`}
              title={i + 1 < step ? "Вернуться (данные сохранены)" : t}
            >
              {i + 1 < step && "✓ "}{t}
            </button>
          ))}
        </div>
      </div>

      {/* Мобильная компактная сцена — конфигуратор виден и на телефоне */}
      <div className="mb-6 lg:hidden">
        <SolarHouseCard input={input} bundle={bundle} compact />
      </div>

      {/* Шаги: смена шага — мягкий сдвиг+фейд 0,2 с (R9); reducedMotion уважается глобально */}
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -24 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
        >
      {step === 1 && <StepObject input={input} set={set} bundle={bundle} />}
      {step === 2 && (
        <StepPower
          input={input}
          set={set}
          appliances={input.appliances}
          setAppliances={(a) => set({ appliances: a })}
        />
      )}
      {step === 3 && <StepGeneration input={input} set={set} bundle={bundle} />}
      {step === 4 && <StepStorage input={input} set={set} bundle={bundle} />}
      {step === 5 && <StepMount input={input} set={set} bundle={bundle} />}
      {step === 6 && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-primary">Шаг 6 из 6 · необязательно</p>
          <h2 className="mt-1.5 text-xl font-semibold tracking-tight md:text-2xl">Контакты для расширенной сметы</h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            Результат откроется в любом случае. С контактами — дополнительно: инженер проверит расчёт
            под ваш объект, PDF-смета с актуальными ценами и расчёт монтажа «под ключ» в течение 24 часов.
          </p>

          <div className="card-premium mt-6 p-5 md:p-6">
            <LeadForm
              formId="calc"
              compact={false}
              submitLabel="Получить точную смету инженером"
              objectType={input.objectType}
              region={input.regionCode}
              scenario={input.mode}
              notePrefix={`Калькулятор: ${input.objectType}, ${input.regionCode}, ${input.mode}`}
            />
          </div>

          <div className="mt-4 flex items-start gap-3 rounded-xl border border-stable/30 bg-stable-soft p-4">
            <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-stable" />
            <p className="text-sm leading-relaxed text-foreground/85">
              <b>Без контактов тоже работаем:</b> смета, графики и экономика откроются сразу.
              Контакты нужны только для PDF и проверки расчёта инженером.
            </p>
          </div>
        </div>
      )}
        </motion.div>
      </AnimatePresence>

      {/* Навигация */}
      <div className="mt-9 flex items-center justify-between gap-3 border-t border-border/70 pt-6">
        <Button variant="ghost" onClick={back} disabled={step === 1 && !showResult}>
          <ChevronLeft className="mr-1.5 h-4 w-4" /> Назад
        </Button>
        <div className="flex items-center gap-2.5">
          {step === 6 && (
            <Button variant="outline" onClick={() => setShowResult(true)}>
              Пропустить — показать результат
            </Button>
          )}
          <Button onClick={next} className="bg-gradient-solar text-primary-foreground hover:opacity-95">
            {step === 6 ? "Показать результат" : "Далее"}
            <ChevronRight className="ml-1.5 h-4 w-4" />
          </Button>
        </div>
      </div>
      </div>

      {/* Живая сцена №4 (десктоп): sticky, обновляется на каждом шаге */}
      <aside className="hidden lg:block">
        <div className="sticky top-20">
          <SolarHouseCard input={input} bundle={bundle} />
          <p className="mt-2.5 text-center text-[11px] leading-snug text-muted-foreground">
            Схема живая: панели, АКБ и смета «от» пересчитываются на каждом шаге
          </p>
        </div>
      </aside>
    </div>
  )
}

function defaults(): CalcInput {
  return normalizeInput({
    objectType: "house",
    mode: "hybrid",
    regionCode: "moskva",
    voltage: "220",
    dailyKwh: 10,
    tariffPlan: "flat",
    consumerType: "household",
    peakKw: 5,
    startK: 3,
    powerMode: "kw",
    panelKw: 5,
    panelClass: "std",
    installType: "roof_slope",
    orientation: "south",
    shading: "none",
    autonomyHours: 8,
    batteryTech: "lifepo4",
    generator: "none",
    cableM: 20,
    switchboard: true,
    loadProfile: [...LOAD_PRESETS.house],
    appliances: loadAppliances("house"),
  })
}

// Страница калькулятора: загрузка бандла + восстановление stateless-ссылки
export function CalculatorPage({ sharedHash }: { sharedHash: string | null }) {
  const [bundle, setBundle] = useState<RefBundle | null>(null)
  const [error, setError] = useState<string | null>(null)
  // Восстановление из URL-хэша #calc=... (stateless, ТЗ 4.3): ленивый init
  const [shared] = useState<CalcInput | null>(() => readShareFromLocation())

  useEffect(() => {
    loadRefBundle()
      .then(setBundle)
      .catch((e) => setError(String(e)))
  }, [])

  if (error) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <p className="text-lg font-semibold">Справочник цен временно недоступен</p>
        <p className="mt-2 text-sm text-muted-foreground">Обновите страницу через минуту или позвоните — рассчитаем голосом.</p>
      </div>
    )
  }
  if (!bundle) {
    return (
      <div className="mx-auto max-w-3xl space-y-4 px-4 py-12">
        <div className="calc-progress-bar"><div style={{ width: "40%" }} /></div>
        <p className="text-sm text-muted-foreground">Загружаем справочник цен и регионов…</p>
      </div>
    )
  }

  return (
    <div className="pb-6">
      {shared && (
        <div className="mx-auto mb-6 flex max-w-3xl items-start gap-3 rounded-xl border border-primary/30 bg-primary/5 p-4">
          <Share2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
          <p className="text-sm leading-relaxed">
            Открыт <b>расшаренный расчёт</b> — параметры восстановлены из ссылки без обращения
            к хранилищам, смета со схемой станции открыта сразу. «Изменить параметры» —
            продолжить расчёт с восстановленными значениями.
          </p>
        </div>
      )}
      <CalcWizard bundle={bundle} initialInput={shared} autoResult={!!shared} />
    </div>
  )
}
