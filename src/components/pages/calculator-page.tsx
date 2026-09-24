"use client"

import { PageHero } from "@/components/common/page-hero"
import { AdSlot } from "@/components/common/ad-slot"
import { CalculatorPage as Wizard } from "@/components/calc/calc-wizard"

export function CalculatorPage({ sharedHash }: { sharedHash: string | null }) {
  return (
    <div>
      <PageHero
        eyebrow="Профессиональный калькулятор"
        title="Смета солнечной станции за 6 шагов"
        description="Расчётное ядро работает в браузере: генерация по PSH вашего региона, АКБ по автономии, инвертор по пусковым токам, смета по нормо-часам с минимальным выездом бригады, LCOE и окупаемость. Результат — сразу, контакты необязательны."
      />
      <div className="mx-auto max-w-6xl px-4 pb-10 sm:px-6">
        <Wizard sharedHash={sharedHash} />
      </div>
      <div className="mx-auto max-w-7xl px-4 pb-10 sm:px-6">
        <AdSlot variant="banner" />
      </div>
    </div>
  )
}
