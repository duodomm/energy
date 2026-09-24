"use client"

// Страница статьи: markdown-тело, SEO-поля, FAQ-блок внутри тела,
// для кейсов — кнопка «Воспроизвести в калькуляторе» (caseSpecJson → localStorage)

import { useEffect, useMemo, useState } from "react"
import ReactMarkdown from "react-markdown"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { CalendarDays, Clock, Eye, PlayCircle, ArrowLeft, TrendingUp, Box } from "lucide-react"
import { saveInput, normalizeInput } from "@/lib/calc/share"
import { navigate } from "@/lib/router"
import { AdSlot } from "@/components/common/ad-slot"
import { LeadForm } from "@/components/lead/lead-form"
import { Estate3D } from "@/components/common/estate-3d"
import { trackGoal } from "@/lib/analytics"

interface ArticleData {
  slug: string
  hub: string
  kind: string
  title: string
  teaser: string
  bodyMd: string
  author: string
  readMinutes: number
  views: number
  updatedAt: string
  caseSpecJson: string | null
  seoTitle: string | null
  seoDesc: string | null
}

const HUB_TITLES: Record<string, string> = {
  sun: "Хаб «Солнечная энергетика»",
  storage: "Хаб «Накопители»",
  generator: "Хаб «Генерация»",
  economics: "Хаб «Экономика»",
  cases: "Кейсы",
  reference: "Справочник",
  blog: "Блог",
}

const KIND_LABEL: Record<string, string> = {
  case: "Кейс со сметой",
  hub: "Материал-столп",
  guide: "Экономический гид",
  article: "Статья",
}

export function ArticlePage({ slug }: { slug: string }) {
  const [article, setArticle] = useState<ArticleData | null>(null)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    const raf = requestAnimationFrame(() => {
      setArticle(null)
      setNotFound(false)
      fetch(`/api/articles?slug=${encodeURIComponent(slug)}`)
        .then((r) => (r.ok ? r.json() : Promise.reject(new Error("404"))))
        .then((a) => setArticle(a as ArticleData))
        .catch(() => setNotFound(true))
    })
    return () => cancelAnimationFrame(raf)
  }, [slug])

  // Параметры кейса для 3D-сцены (мощность/тип монтажа из caseSpecJson)
  const caseSpecJson = article?.caseSpecJson ?? null
  const case3d = useMemo(() => {
    if (!caseSpecJson) return null
    try {
      const spec = JSON.parse(caseSpecJson) as { panelKw?: number; installType?: string }
      if (typeof spec.panelKw !== "number") return null
      return {
        kw: Math.min(10, Math.max(2, spec.panelKw)),
        groundFirst: spec.installType === "ground",
      }
    } catch {
      return null
    }
  }, [caseSpecJson])

  const reproduce = () => {
    if (!article?.caseSpecJson) return
    const input = normalizeInput(JSON.parse(article.caseSpecJson) as Record<string, unknown>)
    saveInput(input)
    trackGoal("calc_start", { from: "case", slug: article.slug })
    navigate("#/kalkulyator")
  }

  if (notFound) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-24 text-center">
        <p className="text-lg font-semibold">Статья не найдена</p>
        <Button className="mt-4" variant="outline" onClick={() => navigate("#/blog")}>К списку статей</Button>
      </div>
    )
  }
  if (!article) {
    return (
      <div className="mx-auto max-w-3xl space-y-4 px-4 py-12 sm:px-6">
        <Skeleton className="h-9 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    )
  }

  return (
    <div>
      <article className="mx-auto max-w-3xl px-4 pb-12 pt-10 sm:px-6 md:pt-14">
        <Button variant="ghost" size="sm" className="mb-6 -ml-2 text-muted-foreground" onClick={() => navigate(`#/blog`)}>
          <ArrowLeft className="mr-1.5 h-4 w-4" /> {HUB_TITLES[article.hub] ?? "Блог"}
        </Button>

        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary" className="bg-primary/15 text-primary">{KIND_LABEL[article.kind] ?? "Статья"}</Badge>
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <CalendarDays className="h-3.5 w-3.5" />
            обновлено {new Date(article.updatedAt).toLocaleDateString("ru-RU")}
          </span>
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="h-3.5 w-3.5" /> {article.readMinutes} мин
          </span>
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Eye className="h-3.5 w-3.5" /> {article.views}
          </span>
        </div>

        <h1 className="mt-4 text-2xl font-bold leading-tight tracking-tight md:text-[34px] md:leading-[1.15]">
          {article.title}
        </h1>
        <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">{article.teaser}</p>
        <p className="mt-4 border-l-2 border-primary/50 pl-3 text-sm font-medium text-muted-foreground">
          {article.author}
        </p>

        {article.caseSpecJson && (
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-primary/30 bg-primary/5 p-4">
            <p className="text-sm leading-relaxed">
              <b>Живой пересчёт:</b> цены в смете зафиксированы на дату публикации —
              нажмите кнопку, чтобы пересчитать кейс на актуальный прайс в калькуляторе.
            </p>
            <Button onClick={reproduce} className="bg-gradient-solar text-primary-foreground hover:opacity-95">
              <PlayCircle className="mr-1.5 h-4 w-4" /> Воспроизвести в калькуляторе
            </Button>
          </div>
        )}

        {/* №7: кейс в 3D — «покрутите усадьбу», мощность из сметы кейса */}
        {case3d && (
          <div className="mt-6 rounded-2xl border border-border bg-card p-4 md:p-5">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <p className="flex items-center gap-2 text-sm font-semibold">
                <Box className="h-4 w-4 text-primary" /> Кейс в 3D
              </p>
              <p className="text-[11px] text-muted-foreground">
                модель иллюстрирует компоновку; потяните мышью — усадьба вращается
              </p>
            </div>
            <Estate3D
              initialKw={case3d.kw}
              groundFirst={case3d.groundFirst}
              showCta={false}
              hudTitle={`КЕЙС: СЭС ${String(case3d.kw).replace(".", ",")} КВТ`}
              noteText="Слайдер — «а если панелей больше?»: 16 на скате, дальше — ряд на каркасе. Точная компоновка — кнопкой «Воспроизвести в калькуляторе»."
            />
          </div>
        )}

        <div className="article-md mt-8">
          <ReactMarkdown>{article.bodyMd}</ReactMarkdown>
        </div>

        <div className="mt-10 rounded-2xl border border-border bg-card p-5">
          <p className="flex items-center gap-2 text-sm font-semibold">
            <TrendingUp className="h-4 w-4 text-primary" /> Считаете под свой объект?
          </p>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Калькулятор пересчитает смету под ваш регион и нагрузки; инженер проверит за 24 часа.
          </p>
          <div className="mt-4">
            <LeadForm formId={`article_${article.slug.slice(0, 24)}`} compact submitLabel="Проверить мой расчёт" />
          </div>
        </div>
      </article>
      <div className="mx-auto max-w-7xl px-4 pb-10 sm:px-6">
        <AdSlot variant="rect" />
      </div>
    </div>
  )
}
