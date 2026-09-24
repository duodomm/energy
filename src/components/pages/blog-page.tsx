"use client"

// Список статей блога (ТЗ 3.1: /blog — рубрики: технологии, экономика, монтаж, обзоры)

import { useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Clock, CalendarDays, ArrowRight } from "lucide-react"
import { PageHero } from "@/components/common/page-hero"
import { AdSlot } from "@/components/common/ad-slot"
import { navigate } from "@/lib/router"

interface ArticleListItem {
  slug: string; hub: string; kind: string; title: string; teaser: string
  author: string; readMinutes: number; views: number; updatedAt: string
}

const RUBRICS: { key: string; label: string }[] = [
  { key: "", label: "Все" },
  { key: "sun", label: "Технологии" },
  { key: "storage", label: "Накопители" },
  { key: "generator", label: "Генерация" },
  { key: "economics", label: "Экономика" },
  { key: "cases", label: "Кейсы" },
  { key: "reference", label: "Нормативка" },
]

export function BlogPage() {
  const [items, setItems] = useState<ArticleListItem[] | null>(null)
  const [rubric, setRubric] = useState("")

  useEffect(() => {
    fetch("/api/articles")
      .then((r) => r.json())
      .then((d) => setItems(d as ArticleListItem[]))
      .catch(() => setItems([]))
  }, [])

  const filtered = (items ?? []).filter((i) => !rubric || i.hub === rubric)

  return (
    <div>
      <PageHero
        eyebrow="Блог"
        title="Статьи инженеров и экономистов"
        description="Технологии, экономика, монтаж и обзоры — глубокие материалы вместо инфошума. Автор каждой статьи — практик: инженер, сметчик или экономист-снабженец."
      />
      <div className="mx-auto max-w-7xl px-4 pb-10 sm:px-6">
        <div className="mb-6 flex flex-wrap gap-2">
          {RUBRICS.map((r) => (
            <button
              key={r.key}
              type="button"
              onClick={() => setRubric(r.key)}
              className={`rounded-lg border px-3 py-1.5 text-sm transition-colors ${
                rubric === r.key ? "border-primary/50 bg-primary/10 text-primary" : "border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>

        {!items ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => <Skeleton key={i} className="h-44 rounded-2xl" />)}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((a) => (
              <button
                key={a.slug}
                type="button"
                onClick={() => navigate(`#/blog/${a.slug}`)}
                className="card-premium card-premium-hover group flex flex-col p-5 text-left"
              >
                <Badge variant="secondary" className="w-fit bg-primary/12 text-[11px] text-primary">
                  {a.kind === "case" ? "Кейс со сметой" : a.kind === "hub" ? "Материал-столп" : a.kind === "guide" ? "Гид" : "Статья"}
                </Badge>
                <h3 className="mt-3 text-base font-semibold leading-snug">{a.title}</h3>
                <p className="mt-2 line-clamp-3 flex-1 text-sm leading-relaxed text-muted-foreground">{a.teaser}</p>
                <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                  <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" />{a.readMinutes} мин</span>
                  <span className="flex items-center gap-1.5">
                    <CalendarDays className="h-3.5 w-3.5" />
                    {new Date(a.updatedAt).toLocaleDateString("ru-RU")}
                  </span>
                  <ArrowRight className="h-4 w-4 text-primary transition-transform group-hover:translate-x-1" />
                </div>
              </button>
            ))}
          </div>
        )}
        <div className="mt-8"><AdSlot variant="rect" /></div>
      </div>
    </div>
  )
}
