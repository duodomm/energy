"use client"

// Справочник (ТЗ 3.1: /spravochnik): глоссарий, нормативка, FAQ,
// каталог цен с индикатором актуальности (ТЗ 5)

import { useEffect, useMemo, useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { BookOpen, ShieldCheck, HelpCircle, FileSpreadsheet, ShieldAlert, CheckCircle2 } from "lucide-react"
import { PageHero } from "@/components/common/page-hero"
import { HeroCorner } from "@/components/common/hero-corner"
import { AdSlot } from "@/components/common/ad-slot"
import { apiGet } from "@/lib/api-static"

interface GlossaryItem { term: string; category: string; definition: string }
interface FaqItem { question: string; answer: string; category: string }
interface CatalogItem {
  category: string; tech: string | null; name: string; unit: string
  spec: string | null; priceFrom: number; priceTo: number; sourceNote: string | null
}

const GLOSSARY_CATS = [
  { key: "", label: "Все" },
  { key: "technology", label: "Технологии" },
  { key: "equipment", label: "Оборудование" },
  { key: "economics", label: "Экономика" },
  { key: "mounting", label: "Монтаж" },
  { key: "norms", label: "Нормативка" },
]

const FAQ_CATS = [
  { key: "", label: "Все" },
  { key: "calculator", label: "Калькулятор" },
  { key: "solar", label: "Солнце" },
  { key: "batteries", label: "АКБ" },
  { key: "economics", label: "Экономика" },
  { key: "legal", label: "Право" },
  { key: "mounting", label: "Монтаж" },
]

const NORMATIVE = [
  { code: "ПУЭ (7-е изд.)", what: "Правила устройства электроустановок: защита, заземление, кабельные трассы, разъединители", where: "разделы 1.7, 2.1, 4.2, 5.1, 7" },
  { code: "СП 20.13330.2016", what: "Нагрузки и воздействия: снеговые районы I–VIII, ветровые I–VII — база расчёта креплений", where: "карты приложений Е и Ж" },
  { code: "ФЗ-471 от 30.12.2019", what: "Микрогенерация: объекты ВИЭ до 15 кВт физлиц, уведомительный порядок, продажа излишков", where: "закон об электроэнергетике, ст. 38¹" },
  { code: "ПП РФ № 861", what: "Техприсоединение и порядок для генерации свыше 15 кВт / юрлиц", where: "постановление правительства" },
  { code: "ГОСТ Р 58882-2020", what: "Автономные и гибридные системы электроснабжения: требования к инверторам, антиостровной защите", where: "сертификация инверторов" },
  { code: "ГОСТ Р МЭК 61730", what: "Безопасность фотоэлектрических модулей: конструкция и испытания", where: "сертификация панелей" },
  { code: "СП 256.1325800", what: "Электроустановки жилых и общественных зданий: узо 30 мА, щиты, селективность", where: "монтаж щитовой" },
  { code: "СО 153-34.21.122", what: "Инструкция по устройству молниезащиты зданий: зоны защиты, УЗИП тип I", where: "страховка и приёмка" },
]

export function ReferencePage() {
  const [glossary, setGlossary] = useState<GlossaryItem[] | null>(null)
  const [faqs, setFaqs] = useState<FaqItem[] | null>(null)
  const [catalog, setCatalog] = useState<{ items: CatalogItem[]; updatedAt: string } | null>(null)
  const [gcat, setGcat] = useState("")
  const [fcat, setFcat] = useState("")

  useEffect(() => {
    apiGet<GlossaryItem[]>("/api/glossary", "/api-data/glossary.json").then(setGlossary).catch(() => setGlossary([]))
    apiGet<FaqItem[]>("/api/faq", "/api-data/faq.json").then(setFaqs).catch(() => setFaqs([]))
    apiGet<{ items: CatalogItem[]; updatedAt: string }>("/api/catalog", "/api-data/catalog.json")
      .then(setCatalog)
      .catch(() => setCatalog(null))
  }, [])

  const gl = useMemo(() => (glossary ?? []).filter((g) => !gcat || g.category === gcat), [glossary, gcat])
  const faq = useMemo(() => (faqs ?? []).filter((f) => !fcat || f.category === fcat), [faqs, fcat])
  const staleDays = catalog ? Math.floor((Date.now() - new Date(catalog.updatedAt).getTime()) / 86400000) : 0

  return (
    <div>
      <PageHero
        eyebrow="Справочник"
        title="Глоссарий, нормативка, FAQ и цены"
        description="42 термина с инженерными определениями, 30 ответов на частые вопросы, выжимка нормативной базы и каталог ценовых диапазонов с датой актуальности."
        corner={<HeroCorner variant="reference" />}
      />
      <div className="mx-auto max-w-7xl px-4 pb-10 sm:px-6">
        <Tabs defaultValue="glossary">
          <TabsList className="mb-6 h-auto flex-wrap">
            <TabsTrigger value="glossary" className="gap-2"><BookOpen className="h-4 w-4" /> Глоссарий</TabsTrigger>
            <TabsTrigger value="norms" className="gap-2"><ShieldCheck className="h-4 w-4" /> Нормативка</TabsTrigger>
            <TabsTrigger value="faq" className="gap-2"><HelpCircle className="h-4 w-4" /> FAQ</TabsTrigger>
            <TabsTrigger value="prices" className="gap-2"><FileSpreadsheet className="h-4 w-4" /> Каталог цен</TabsTrigger>
          </TabsList>

          <TabsContent value="glossary">
            <div className="mb-5 flex flex-wrap gap-1.5">
              {GLOSSARY_CATS.map((c) => (
                <button
                  key={c.key}
                  type="button"
                  onClick={() => setGcat(c.key)}
                  className={`rounded-lg border px-3 py-1.5 text-xs transition-colors ${
                    gcat === c.key ? "border-primary/50 bg-primary/10 text-primary" : "border-border text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
            {!glossary ? (
              <div className="grid gap-3 md:grid-cols-2">{[1, 2, 3, 4, 5, 6].map((i) => <Skeleton key={i} className="h-20 rounded-xl" />)}</div>
            ) : (
              <div className="grid gap-3 md:grid-cols-2">
                {gl.map((g) => (
                  <div key={g.term} className="card-premium p-4">
                    <p className="text-sm font-semibold text-primary">{g.term}</p>
                    <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{g.definition}</p>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="norms">
            <div className="card-premium overflow-hidden">
              <table className="w-full responsive-table">
                <thead>
                  <tr><th>Документ</th><th>Что регулирует</th><th>Где смотреть</th></tr>
                </thead>
                <tbody>
                  {NORMATIVE.map((n) => (
                    <tr key={n.code}>
                      <td data-label="Документ" className="font-medium">{n.code}</td>
                      <td data-label="Что регулирует" className="text-muted-foreground">{n.what}</td>
                      <td data-label="Где смотреть" className="text-xs text-muted-foreground">{n.where}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
              Документы в первоисточниках: «КонсультантПлюс», «Техэксперт», сайты Минэнерго и Росстандарта.
              Раздел микрогенерации пересматривается раз в квартал — подпись актуальности стоит в разделе «Экономика».
            </p>
          </TabsContent>

          <TabsContent value="faq">
            <div className="mb-5 flex flex-wrap gap-1.5">
              {FAQ_CATS.map((c) => (
                <button
                  key={c.key}
                  type="button"
                  onClick={() => setFcat(c.key)}
                  className={`rounded-lg border px-3 py-1.5 text-xs transition-colors ${
                    fcat === c.key ? "border-primary/50 bg-primary/10 text-primary" : "border-border text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
            {!faqs ? (
              <div className="space-y-3">{[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-14 rounded-xl" />)}</div>
            ) : (
              <Accordion type="single" collapsible className="card-premium px-4">
                {faq.map((f, i) => (
                  <AccordionItem key={i} value={`i-${i}`} className="border-border/60">
                    <AccordionTrigger className="text-left text-sm font-medium hover:text-primary [&>svg]:text-muted-foreground">
                      {f.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-sm leading-relaxed text-muted-foreground">
                      {f.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            )}
          </TabsContent>

          <TabsContent value="prices">
            <div className="mb-5 flex items-center justify-between gap-3">
              <p className="text-sm text-muted-foreground">
                Диапазоны обновляются раз в 2 недели (ЭС, автоимпорт прайсов + подтверждение).
              </p>
              {catalog && (
                staleDays > 14 ? (
                  <Badge variant="destructive" className="gap-1.5">
                    <ShieldAlert className="h-3.5 w-3.5" /> Устарел на {staleDays} дн. — цены могли измениться
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-stable" /> Актуален: {new Date(catalog.updatedAt).toLocaleDateString("ru-RU")}
                  </Badge>
                )
              )}
            </div>
            {!catalog ? (
              <div className="space-y-3">{[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-12 rounded-xl" />)}</div>
            ) : (
              <div className="card-premium overflow-hidden">
                <table className="w-full responsive-table">
                  <thead>
                    <tr><th>Позиция</th><th>Спецификация</th><th className="text-right">От</th><th className="text-right">До</th><th>Ед.</th></tr>
                  </thead>
                  <tbody>
                    {catalog.items.map((c) => (
                      <tr key={c.name}>
                        <td data-label="Позиция"><span className="font-medium">{c.name}</span>{c.sourceNote && <span className="block text-[11px] text-muted-foreground">{c.sourceNote}</span>}</td>
                        <td data-label="Спец" className="text-xs text-muted-foreground">{c.spec ?? "—"}</td>
                        <td data-label="От" className="text-right tabular-nums">{c.priceFrom.toLocaleString("ru-RU")}</td>
                        <td data-label="До" className="text-right tabular-nums">{c.priceTo.toLocaleString("ru-RU")}</td>
                        <td data-label="Ед." className="text-xs text-muted-foreground">{c.unit}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
              Индикатор устаревания &gt; 14 дней дублируется на сметах и в админ-зоне (алерт владельцу справочника в Telegram).
            </p>
          </TabsContent>
        </Tabs>
        <div className="mt-8"><AdSlot variant="rect" /></div>
      </div>
    </div>
  )
}
