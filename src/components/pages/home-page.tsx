"use client"

// Главная страница (ТЗ 3.1): hero с анимацией, три входа в калькулятор
// (Дача / Дом / Бизнес), преимущества, «как мы работаем», мини-кейсы, CTA

import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Sun, Home, Building2, ShieldCheck, Clock, FileDown, MapPin, Wrench,
  TrendingUp, ArrowRight, CheckCircle2, Phone, BatteryCharging, Sparkles, Ruler,
} from "lucide-react"
import { navigate } from "@/lib/router"
import { trackGoal } from "@/lib/analytics"
import { LeadForm } from "@/components/lead/lead-form"
import { AdSlot } from "@/components/common/ad-slot"

const ENTRIES = [
  {
    icon: Home,
    title: "Дача",
    desc: "Без сети или с перебоями: 1–6 кВт панелей и АКБ. Быстрый расчёт в 3 шага.",
    href: "#/kalkulyator/dacha",
    cta: "Считать дачу",
    stat: "от 0,5 млн ₽",
  },
  {
    icon: Building2,
    title: "Дом",
    desc: "Гибрид с сетью: панель, АКБ, ночной тариф. Резерв отключений за 10 мс.",
    href: "#/kalkulyator",
    cta: "Считать дом",
    stat: "от 1,2 млн ₽",
  },
  {
    icon: Sun,
    title: "Бизнес",
    desc: "Склад, ферма, цех: подмена дорогого тарифа юрлица. Окупаемость от 4 лет.",
    href: "#/kalkulyator",
    cta: "Считать бизнес",
    stat: "от 6,3 млн ₽ / 100 кВт",
  },
]

const ADVANTAGES = [
  { icon: MapPin, title: "Регионы — по данным", text: "PSH 12 месяцев, тарифы с зонами день/ночь, снеговые и ветровые районы СП 20.13330, ставки монтажа по округам — 32 региона РФ в справочнике." },
  { icon: Wrench, title: "Смета как у сметчика", text: "Нормо-часы по позициям, коэффициенты сложности, минимальный выезд бригады. Никаких «монтаж 100 000 ₽» без расшифровки." },
  { icon: TrendingUp, title: "Экономика без розовых очков", text: "LCOE с дисконтированием и без, две модели окупаемости, двухтарифный арбитраж, микрогенерация до 15 кВт — честные цифры." },
  { icon: ShieldCheck, title: "152-ФЗ по-взрослому", text: "Персональные данные из форм уходят только в CRM на территории РФ. В базе сайта — технические записи без ПДн." },
]

const STEPS = [
  { n: 1, title: "Считаете сами", text: "Калькулятор в браузере: 6 шагов — объект, нагрузки, панели, АКБ, монтаж. Смета «от–до» с графиками генерации и экономикой." },
  { n: 2, title: "Инженер проверяет", text: "Оставляете контакты — инженер сверяет расчёт с прайсами поставщиков вашего региона и реальными условиями объекта." },
  { n: 3, title: "Точная смета за 24 часа", text: "PDF с позициями, сроками и графиком монтажа. Дальше — аудит объекта и договор, если смета понравилась." },
]

const CASES = [
  { title: "Дача 3,3 кВт, Подмосковье", text: "Автономия вместо бензогенератора: LiFePO4, наземный каркас, зимние наезды.", href: "#/kejsy", metric: "497–901 тыс. ₽" },
  { title: "Дом 10 кВт, Воронеж", text: "Гибрид с двухтарифным счётчиком: АКБ заряжаются ночью по 3,4 ₽.", href: "#/kejsy", metric: "84% самопокрытие" },
  { title: "Склад 100 кВт, МО", text: "Сетевая СЭС на плоской кровле для фармдистрибьютора, балласт.", href: "#/kejsy", metric: "8,5 лет окупаемость" },
]

export function HomePage() {
  return (
    <div>
      {/* ===== HERO ===== */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -right-32 -top-40 h-[480px] w-[480px] rounded-full bg-primary/10 blur-[120px]" />
          <div className="absolute -left-32 top-24 h-[380px] w-[380px] rounded-full bg-orange-500/8 blur-[110px]" />
        </div>
        <div className="mx-auto max-w-7xl px-4 pb-14 pt-16 sm:px-6 md:pt-24">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55 }}>
            <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3.5 py-1.5 text-xs font-medium text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              Калькулятор · справочник · смета за 24 часа
            </p>
            <h1 className="max-w-4xl text-3xl font-bold leading-[1.1] tracking-tight sm:text-4xl md:text-5xl">
              Альтернативная энергетика РФ:
              <br className="hidden md:block" />
              <span className="text-gradient-solar"> считайте до покупки</span>, а не после
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground">
              Профессиональный калькулятор солнечных станций, накопителей и генераторов:
              смета по реальным ценам «от–до», генерация по вашему региону, LCOE и окупаемость —
              в браузере, без звонков. Инженерная проверка расчёта — за 24 часа.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Button
                size="lg"
                className="bg-gradient-solar text-primary-foreground shadow-[0_10px_32px_-10px_rgba(255,106,0,0.7)] hover:opacity-95"
                onClick={() => navigate("#/kalkulyator")}
              >
                <Ruler className="mr-2 h-5 w-5" />
                Рассчитать станцию
              </Button>
              <a href="tel:+74951234567" onClick={() => trackGoal("phone_click")}>
                <Button size="lg" variant="outline">
                  <Phone className="mr-2 h-4 w-4 text-stable" /> Обсудить проект
                </Button>
              </a>
            </div>
          </motion.div>

          {/* Три входа в калькулятор (ТЗ: Дача / Дом / Бизнес) */}
          <div className="mt-12 grid gap-4 md:grid-cols-3">
            {ENTRIES.map((e, i) => (
              <motion.button
                key={e.title}
                type="button"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.12 + i * 0.08, duration: 0.4 }}
                onClick={() => navigate(e.href)}
                className="card-premium card-premium-hover group p-5 text-left"
              >
                <div className="flex items-center justify-between">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/12">
                    <e.icon className="h-6 w-6 text-primary" />
                  </span>
                  <span className="rounded-full bg-secondary px-2.5 py-1 text-[11px] font-medium text-muted-foreground">{e.stat}</span>
                </div>
                <h3 className="mt-4 text-lg font-semibold">{e.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{e.desc}</p>
                <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-primary">
                  {e.cta}
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </span>
              </motion.button>
            ))}
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <AdSlot variant="banner" />
      </div>

      {/* ===== Преимущества ===== */}
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
        <h2 className="text-2xl font-bold tracking-tight md:text-3xl">Почему расчётам здесь можно верить</h2>
        <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-muted-foreground">
          Методологию согласовали инженер, сметчик, экономист-снабженец и монтажник.
          Каждый параметр, влияющий на цену, объясняется прямо в калькуляторе.
        </p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {ADVANTAGES.map((a) => (
            <Card key={a.title} className="card-premium border-border/60">
              <CardContent className="p-5">
                <a.icon className="h-6 w-6 text-primary" />
                <h3 className="mt-3.5 text-base font-semibold">{a.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{a.text}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* ===== Как мы работаем ===== */}
      <section className="border-y border-border/60 bg-card/30">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
          <h2 className="text-2xl font-bold tracking-tight md:text-3xl">Как мы работаем</h2>
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {STEPS.map((s) => (
              <div key={s.n} className="relative">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-solar text-base font-bold text-primary-foreground">
                  {s.n}
                </span>
                <h3 className="mt-4 text-lg font-semibold">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.text}</p>
              </div>
            ))}
          </div>
          <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
            <span className="flex items-center gap-2"><Clock className="h-4 w-4 text-stable" /> 24 часа на смету</span>
            <span className="flex items-center gap-2"><FileDown className="h-4 w-4 text-stable" /> PDF с датой актуальности цен</span>
            <span className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-stable" /> Без спама: один звонок инженера</span>
          </div>
        </div>
      </section>

      {/* ===== Мини-кейсы ===== */}
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-2xl font-bold tracking-tight md:text-3xl">Кейсы с полными сметами</h2>
            <p className="mt-3 max-w-2xl text-[15px] text-muted-foreground">
              Пять объектов — от дачи до производства 250 кВт. Сметы «от–до» с расшифровкой
              каждой позиции и кнопкой «воспроизвести в калькуляторе».
            </p>
          </div>
          <Button variant="outline" onClick={() => navigate("#/kejsy")}>
            Все кейсы <ArrowRight className="ml-1.5 h-4 w-4" />
          </Button>
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {CASES.map((c) => (
            <button key={c.title} type="button" onClick={() => navigate(c.href)} className="card-premium card-premium-hover p-5 text-left">
              <p className="text-xs font-medium uppercase tracking-wider text-primary">{c.metric}</p>
              <h3 className="mt-2 text-base font-semibold">{c.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{c.text}</p>
            </button>
          ))}
        </div>
      </section>

      {/* ===== CTA ===== */}
      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6">
        <div className="card-premium border-gradient-solar overflow-hidden">
          <div className="grid gap-8 p-6 md:grid-cols-2 md:p-9">
            <div>
              <h2 className="text-2xl font-bold tracking-tight md:text-3xl">
                Не хотите считать сами?
              </h2>
              <p className="mt-4 text-[15px] leading-relaxed text-muted-foreground">
                Оставьте контакты — инженер соберёт смету под ваш объект за 24 часа:
                актуальные цены поставщиков, монтаж по нормо-часам региона, экономика и сроки.
                Или посмотрите, как выглядят готовые расчёты, в <a href="#/kejsy" className="text-primary underline underline-offset-2">кейсах</a>.
              </p>
              <div className="mt-6 flex items-center gap-3 text-sm text-muted-foreground">
                <BatteryCharging className="h-5 w-5 text-stable" />
                Солнце · АКБ LiFePO4/VRFB · дизель/газ — подберём связку под задачу
              </div>
              <div className="mt-4 flex flex-wrap gap-2.5">
                <Button variant="outline" onClick={() => navigate("#/regiony")}>
                  <MapPin className="mr-1.5 h-4 w-4" /> PSH и тарифы моего региона
                </Button>
                <Button variant="outline" onClick={() => navigate("#/teo")}>
                  <TrendingUp className="mr-1.5 h-4 w-4" /> Экономика и окупаемость
                </Button>
              </div>
            </div>
            <div className="rounded-2xl border border-border/70 bg-background/60 p-5">
              <LeadForm formId="home_cta" compact submitLabel="Получить смету за 24 часа" />
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
