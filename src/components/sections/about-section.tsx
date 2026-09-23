"use client";

import { SectionHeading } from "@/components/section-heading";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Database, ShieldCheck, BookOpen, Cpu, HelpCircle, GitBranch } from "lucide-react";

const STACK = [
  "Next.js 16 (App Router)",
  "TypeScript 5",
  "Tailwind CSS 4",
  "shadcn/ui + Radix",
  "Prisma ORM + SQLite",
  "Recharts",
  "Framer Motion",
  "Lucide Icons",
];

const SOURCES = [
  {
    name: "Минэнерго России",
    text: "Схема и программа развития ЕЭС, отраслевые доклады о функционировании ВИЭ.",
  },
  {
    name: "АО «Системный оператор»",
    text: "Оперативные данные об установленной мощности и выработке станций ВИЭ.",
  },
  {
    name: "АПВЭ и АСОГ",
    text: "Ассоциации ветроэнергетики и солнечной энергетики: сводки по проектам ДПМ.",
  },
  {
    name: "IRENA",
    text: "Global Renewables Outlook — мировой контекст по мощностям ВИЭ.",
  },
  {
    name: "Отчёты операторов",
    text: "Публикации НоваВинд, Фортум, ВГК, Хевел, РусГидро и других компаний отрасли.",
  },
];

const FAQ = [
  {
    q: "Что такое ДПМ ВИЭ и ДПМ-2?",
    a: "ДПМ ВИЭ (2013–2024) — программа договоров предоставления мощности для объектов возобновляемой энергетики: инвестор получал гарантию возврата инвестиций через повышенную оплату мощности на оптовом рынке. По программе построена почти вся современная ветровая и солнечная генерация России. ДПМ-2 (2025–2035) — продолжение программы с акцентом на стимулирование спроса и локализацию, объём отбора — около 11,8 ГВт новых мощностей.",
  },
  {
    q: "Почему доля ВИЭ в России всего около 1%?",
    a: "Российская энергосистема исторически построена на крупных ГЭС, газовой и угольной генерации с низкой себестоимостью. Программа поддержки ВИЭ стартовала только в 2013 году и сознательно ограничивала объёмы, чтобы не искажать рынок. При этом по крупным ГЭС (58 ГВт) Россия входит в мировые лидеры, а с их учётом доля возобновимой генерации составляет около 19%.",
  },
  {
    q: "Какие виды ВИЭ рассматривает платформа?",
    a: "Пять направлений: ветровая и солнечная энергетика (основные бенефициары ДПМ), малые ГЭС, биоэнергетика (биомасса, биогаз, свалочный газ) и геотермальная энергетика. Крупные ГЭС учитываются отдельно как справочный показатель.",
  },
  {
    q: "Почему в каталоге меньше проектов, чем объектов в отрасли?",
    a: "Каталог — это curated-выборка ключевых и знаковых объектов отрасли, а не полный реестр. Суммарная мощность сегмента в обзорных показателях рассчитана по годовой статистике, а не суммой карточек каталога.",
  },
  {
    q: "Насколько точны данные?",
    a: "Данные агрегированы из открытых источников и носят справочно-аналитический характер: значения округлены, а по отдельным проектам могут отличаться от актуальной отчётности операторов. Платформа создана в демонстрационных и образовательных целях.",
  },
  {
    q: "Что означают три сценария прогноза?",
    a: "Консервативный — минимальная реализация программы ДПМ-2. Базовый — полное исполнение отобранных объёмов ДПМ-2 (11,8 ГВт) с учётом выбытия и внепрограммных проектов. Оптимистичный — целевые ориентиры Энергостратегии-2050: ВИЭ в изолированных районах ДФО, накопители, зелёный водород и корпоративные PPA.",
  },
];

export function AboutSection() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <SectionHeading
        title="О платформе"
        subtitle="Методология, источники данных и ответы на частые вопросы"
      />

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <BookOpen className="h-6 w-6 text-primary" />
            <CardTitle className="mt-2 text-base">Методология</CardTitle>
          </CardHeader>
          <CardContent className="text-sm leading-relaxed text-muted-foreground">
            <p>
              Платформа объединяет три слоя данных: годовые ряды установленной мощности и выработки
              по видам ВИЭ (2013–2025), каталог ключевых объектов генерации с параметрами и
              прогнозные сценарии развития отрасли до 2035 года.
            </p>
            <p className="mt-3">
              Мощности указаны без учёта крупных ГЭС. Доля в энергобалансе рассчитана от общей
              выработки электроэнергии в ЕЭС России (~1150 млрд кВт·ч в год). Топ регионов
              рассчитывается по каталогу ключевых объектов.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <Database className="h-6 w-6 text-primary" />
            <CardTitle className="mt-2 text-base">Источники данных</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3 text-sm">
              {SOURCES.map((s) => (
                <li key={s.name} className="leading-relaxed">
                  <span className="font-semibold text-foreground">{s.name}.</span>{" "}
                  <span className="text-muted-foreground">{s.text}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <ShieldCheck className="h-6 w-6 text-primary" />
            <CardTitle className="mt-2 text-base">Ограничения</CardTitle>
          </CardHeader>
          <CardContent className="text-sm leading-relaxed text-muted-foreground">
            <p>
              Все показатели носят справочно-аналитический характер и округлены. Каталог проектов —
              выборка знаковых объектов, а не полный реестр отрасли (в которой действует более 350
              станций).
            </p>
            <p className="mt-3">
              Прогнозные сценарии основаны на публичных целевых ориентирах и не являются
              инвестиционной рекомендацией. Для принятия решений обращайтесь к первичным
              источникам.
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader>
            <HelpCircle className="h-5 w-5 text-primary" />
            <CardTitle className="mt-1 text-base">Частые вопросы</CardTitle>
            <CardDescription>Ключевые термины и логика расчётов платформы</CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              {FAQ.map((f, i) => (
                <AccordionItem key={i} value={`item-${i}`}>
                  <AccordionTrigger className="text-left text-sm font-semibold">{f.q}</AccordionTrigger>
                  <AccordionContent className="text-sm leading-relaxed text-muted-foreground">
                    {f.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>

        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <Cpu className="h-5 w-5 text-primary" />
              <CardTitle className="mt-1 text-base">Технологический стек</CardTitle>
              <CardDescription>Платформа собрана на современном веб-стеке</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {STACK.map((s) => (
                  <Badge key={s} variant="secondary" className="font-medium">
                    {s}
                  </Badge>
                ))}
              </div>
              <div className="mt-5 flex items-start gap-3 rounded-lg border border-border bg-secondary/40 p-4 text-sm leading-relaxed text-muted-foreground">
                <GitBranch className="mt-0.5 h-4 w-4 shrink-0" />
                <div>
                  Архитектура: одностраничное приложение на Next.js с таб-навигацией, REST API на
                  маршрутах /api, база данных SQLite через Prisma ORM и in-memory кэширование
                  ответов (TTL 5 минут).
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
