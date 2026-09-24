"use client"

// Хабы-«столпы» (ТЗ 3.1): /solnce, /nakopiteli, /generatory, /teo.
// Лендинг хаба: hero, ключевые статьи хаба, быстрые входы в калькулятор.

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Sun, BatteryCharging, Fuel, TrendingUp, ArrowRight, Clock, Calculator, MapPin, BookOpen } from "lucide-react"
import { PageHero } from "@/components/common/page-hero"
import { AdSlot } from "@/components/common/ad-slot"
import { navigate } from "@/lib/router"

interface ArticleListItem {
  slug: string; hub: string; kind: string; title: string; teaser: string
  author: string; readMinutes: number; views: number; updatedAt: string
}

const HUB_META: Record<string, {
  eyebrow: string; title: string; description: string
  icon: typeof Sun; color: string
  quick: { label: string; href: string }[]
}> = {
  sun: {
    eyebrow: "Хаб «Солнечная энергетика»",
    title: "Панели, инверторы, схемы и монтаж",
    description: "Как солнце превращается в киловатт-часы в российском климате: PSH регионов, выбор панелей и инверторов, снеговые и ветровые нагрузки СП 20.13330.",
    icon: Sun, color: "#FFB020",
    quick: [
      { label: "Калькулятор СЭС", href: "#/kalkulyator" },
      { label: "Регионы и PSH", href: "#/regiony" },
      { label: "Кейсы", href: "#/kejsy" },
    ],
  },
  storage: {
    eyebrow: "Хаб «Накопители энергии»",
    title: "LiFePO4, NMC, AGM и VRFB",
    description: "Ёмкость по автономии, глубина разряда, КПД туда-обратно и реальные сроки службы. Двухтарифный арбитраж ночным тарифом и когда АКБ не нужны вовсе.",
    icon: BatteryCharging, color: "#2DD4A8",
    quick: [
      { label: "Калькулятор с АКБ", href: "#/kalkulyator" },
      { label: "Экономика гибрида", href: "#/teo" },
      { label: "Глоссарий", href: "#/spravochnik" },
    ],
  },
  generator: {
    eyebrow: "Хаб «Генерация: газ и дизель»",
    title: "Резерв, АВР и расчёт топлива",
    description: "Дизель против газа по цене кВт·ч с ресурсом и ТО, автоматический ввод резерва по ПУЭ, связка генератора с солнечным гибридом через dry contact.",
    icon: Fuel, color: "#FF6A00",
    quick: [
      { label: "Расчёт с генератором", href: "#/kalkulyator" },
      { label: "Дизель или газ — гид", href: "#/blog/dizel-ili-gaz-vybor-rezerva" },
      { label: "Нормативка ПУЭ", href: "#/spravochnik" },
    ],
  },
  economics: {
    eyebrow: "Хаб «Экономика»",
    title: "LCOE, окупаемость, тарифы, микрогенерация",
    description: "Две модели окупаемости, дисконтирование без обмана, тарифы по регионам с зонами день/ночь, порядок продажи излишков до 15 кВт по ФЗ-471.",
    icon: TrendingUp, color: "#2DD4A8",
    quick: [
      { label: "LCOE-калькулятор", href: "#/kalkulyator-lcoe" },
      { label: "Микрогенерация ≤15 кВт", href: "#/blog/mikrogeneraciya-15kvt-prodazha-izlishkov" },
      { label: "Тарифы регионов", href: "#/regiony" },
    ],
  },
}

export function HubPage({ hub }: { hub: string; slug?: string | null }) {
  const meta = HUB_META[hub] ?? HUB_META.sun
  const [items, setItems] = useState<ArticleListItem[] | null>(null)

  useEffect(() => {
    fetch(`/api/articles?hub=${hub}`)
      .then((r) => r.json())
      .then((d) => setItems(d as ArticleListItem[]))
      .catch(() => setItems([]))
  }, [hub])

  return (
    <div>
      <PageHero
        eyebrow={meta.eyebrow}
        title={meta.title}
        description={meta.description}
      >
        <div className="mt-6 flex flex-wrap gap-2.5">
          {meta.quick.map((q) => (
            <Button key={q.href} variant="outline" size="sm" onClick={() => navigate(q.href)}>
              <Calculator className="mr-1.5 h-3.5 w-3.5 text-primary" /> {q.label}
            </Button>
          ))}
        </div>
      </PageHero>

      <div className="mx-auto max-w-7xl px-4 pb-10 sm:px-6">
        <AdSlot variant="banner" />

        <h2 className="mb-5 mt-8 text-xl font-semibold tracking-tight md:text-2xl">Материалы хаба</h2>
        {!items ? (
          <div className="grid gap-4 md:grid-cols-2">{[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-40 rounded-2xl" />)}</div>
        ) : items.length === 0 ? (
          <p className="text-sm text-muted-foreground">Материалы готовятся к публикации.</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {items.map((a) => (
              <button
                key={a.slug}
                type="button"
                onClick={() => navigate(`#/blog/${a.slug}`)}
                className="card-premium card-premium-hover group flex flex-col p-5 text-left"
              >
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="bg-primary/12 text-[11px] text-primary">
                    {a.kind === "case" ? "Кейс со сметой" : a.kind === "hub" ? "Материал-столп" : a.kind === "guide" ? "Гид" : "Статья"}
                  </Badge>
                  <span className="flex items-center gap-1 text-xs text-muted-foreground"><Clock className="h-3 w-3" />{a.readMinutes} мин</span>
                </div>
                <h3 className="mt-3 text-base font-semibold leading-snug">{a.title}</h3>
                <p className="mt-2 line-clamp-3 flex-1 text-sm leading-relaxed text-muted-foreground">{a.teaser}</p>
                <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-primary">
                  Читать <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </span>
              </button>
            ))}
          </div>
        )}

        <div className="mt-10 grid gap-3 sm:grid-cols-3">
          <Button variant="outline" onClick={() => navigate("#/kalkulyator")} className="justify-start">
            <Sun className="mr-2 h-4 w-4 text-primary" /> Рассчитать станцию
          </Button>
          <Button variant="outline" onClick={() => navigate("#/regiony")} className="justify-start">
            <MapPin className="mr-2 h-4 w-4 text-primary" /> Регионы и тарифы
          </Button>
          <Button variant="outline" onClick={() => navigate("#/spravochnik")} className="justify-start">
            <BookOpen className="mr-2 h-4 w-4 text-primary" /> Термины и нормативка
          </Button>
        </div>
      </div>
    </div>
  )
}
