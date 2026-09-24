"use client"

// Кейсы и типовые проекты (ТЗ 3.1: /kejsy — дача, дом, ферма, склад, производство)

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { ArrowRight, Home, Building2, Warehouse, Tractor, Factory, Clock } from "lucide-react"
import { PageHero } from "@/components/common/page-hero"
import { HeroCorner } from "@/components/common/hero-corner"
import { AdSlot } from "@/components/common/ad-slot"
import { navigate } from "@/lib/router"
import { apiGet } from "@/lib/api-static"

interface ArticleListItem {
  slug: string; hub: string; kind: string; title: string; teaser: string
  author: string; readMinutes: number; views: number; updatedAt: string
}

const FILTERS = [
  { key: "", label: "Все кейсы", icon: null },
  { key: "dacha", label: "Дача", icon: Home },
  { key: "dom", label: "Дом", icon: Building2 },
  { key: "ferma", label: "Ферма", icon: Tractor },
  { key: "sklad", label: "Склад", icon: Warehouse },
  { key: "proizvodstvo", label: "Производство", icon: Factory },
]

export function CasesPage() {
  const [items, setItems] = useState<ArticleListItem[] | null>(null)
  const [filter, setFilter] = useState("")

  useEffect(() => {
    apiGet<ArticleListItem[]>("/api/articles?hub=cases", "/api-data/articles-hub-cases.json")
      .then((d) => setItems(d.filter((i) => i.hub === "cases")))
      .catch(() => setItems([]))
  }, [])

  const filtered = useMemo(
    () => (items ?? []).filter((i) => !filter || i.slug.includes(filter)),
    [items, filter],
  )

  return (
    <div>
      <PageHero
        eyebrow="Кейсы и типовые проекты"
        title="Пять объектов, пять полных смет"
        description="Дача 3 кВт, дом 10 кВт, ферма 30 кВт, склад 100 кВт, производство 250 кВт: расшифровка каждой позиции «от–до», генерация по месяцам и честная окупаемость. Каждый кейс воспроизводится в калькуляторе с живыми ценами."
        corner={<HeroCorner variant="cases" />}
      />
      <div className="mx-auto max-w-7xl px-4 pb-10 sm:px-6">
        <div className="mb-6 flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilter(f.key)}
              className={`flex items-center gap-2 rounded-lg border px-3.5 py-2 text-sm transition-colors ${
                filter === f.key ? "border-primary/50 bg-primary/10 text-primary" : "border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {f.icon && <f.icon className="h-4 w-4" />}
              {f.label}
            </button>
          ))}
        </div>

        {!items ? (
          <div className="grid gap-4 md:grid-cols-2">{[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-48 rounded-2xl" />)}</div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {filtered.map((a) => (
              <button
                key={a.slug}
                type="button"
                onClick={() => navigate(`#/blog/${a.slug}`)}
                className="card-premium card-premium-hover group flex flex-col p-5 text-left"
              >
                <div className="flex items-center justify-between">
                  <Badge className="bg-primary/15 text-primary hover:bg-primary/15">Кейс со сметой</Badge>
                  <span className="flex items-center gap-1 text-xs text-muted-foreground"><Clock className="h-3 w-3" />{a.readMinutes} мин чтения</span>
                </div>
                <h3 className="mt-3 text-lg font-semibold leading-snug">{a.title}</h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">{a.teaser}</p>
                <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-primary">
                  Полная смета <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </span>
              </button>
            ))}
          </div>
        )}

        <div className="mt-8 rounded-2xl border border-primary/30 bg-primary/5 p-5">
          <p className="text-sm font-semibold">Свой объект не похож на кейсы?</p>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Профессиональный калькулятор пересчитает любую конфигурацию: кровля/земля, затенение,
            двухтарифный счётчик, генератор, АКБ по вашей автономии.
          </p>
          <Button className="mt-4 bg-gradient-solar text-primary-foreground" onClick={() => navigate("#/kalkulyator")}>
            Открыть калькулятор <ArrowRight className="ml-1.5 h-4 w-4" />
          </Button>
        </div>

        <div className="mt-8"><AdSlot variant="rect" /></div>
      </div>
    </div>
  )
}
