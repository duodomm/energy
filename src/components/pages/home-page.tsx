"use client"

// Главная страница (ТЗ 3.1), витрина по сочетанию С10 «Энергосистема» (П1):
// фото-hero (№5) + плакатные цифры count-up (№8) + чертёжная сетка (№1) +
// три входа в калькулятор (Дача / Дом / Бизнес) с фотополосами.

import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Sun, Home, Building2, Clock, FileDown, MapPin, Wrench,
  TrendingUp, ArrowRight, CheckCircle2, Phone, BatteryCharging, Sparkles, Ruler,
} from "lucide-react"
import { navigate } from "@/lib/router"
import { trackGoal } from "@/lib/analytics"
import { LeadForm } from "@/components/lead/lead-form"
import { AdSlot } from "@/components/common/ad-slot"
import { CountUp } from "@/components/common/count-up"
import { EnergyFlowStrip } from "@/components/common/energy-flow"
import { Estate3D } from "@/components/common/estate-3d"
import { Reveal } from "@/components/common/reveal"
import { HomeArticle } from "@/components/pages/home-article"

const ENTRIES = [
  {
    icon: Home,
    title: "Дача",
    desc: "Без сети или с перебоями: 1–6 кВт панелей и АКБ. Быстрый расчёт в 3 шага.",
    href: "#/kalkulyator/dacha",
    cta: "Считать дачу",
    stat: "от 0,5 млн ₽",
    photo: "/photos/storage.jpg",
    photoAlt: "Накопитель энергии LiFePO4 в контуре автономного дома",
  },
  {
    icon: Building2,
    title: "Дом",
    desc: "Гибрид с сетью: панель, АКБ, ночной тариф. Резерв отключений за 10 мс.",
    href: "#/kalkulyator",
    cta: "Считать дом",
    stat: "от 1,2 млн ₽",
    photo: "/photos/house-modern.jpg",
    photoAlt: "Современный двухэтажный дом с солнечными панелями на крыше",
  },
  {
    icon: Sun,
    title: "Бизнес",
    desc: "Склад, ферма, цех: подмена дорогого тарифа юрлица. Окупаемость от 4 лет.",
    href: "#/kalkulyator",
    cta: "Считать бизнес",
    stat: "от 6,3 млн ₽ / 100 кВт",
    photo: "/photos/farm-sunset.jpg",
    photoAlt: "Солнечная ферма на закате",
  },
]

const ADVANTAGES = [
  { icon: MapPin, title: "Регионы — по данным", text: "PSH 12 месяцев, тарифы с зонами день/ночь, снеговые и ветровые районы СП 20.13330, ставки монтажа по округам — 32 региона РФ в справочнике." },
  { icon: Wrench, title: "Смета как у сметчика", text: "Нормо-часы по позициям, коэффициенты сложности, минимальный выезд бригады. Никаких «монтаж 100 000 ₽» без расшифровки." },
  { icon: TrendingUp, title: "Экономика без розовых очков", text: "LCOE с дисконтированием и без, две модели окупаемости, двухтарифный арбитраж, микрогенерация до 15 кВт — честные цифры." },
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

const STATS = [
  { value: 32, label: "региона РФ в справочнике", suffix: "" },
  { value: 23, label: "позиции каталога цен", suffix: "" },
  { value: 12, label: "месяцев PSH в расчёте", suffix: "" },
  { value: 24, label: "часа до точной сметы", suffix: "" },
]

export function HomePage() {
  return (
    <div>
      {/* ===== HERO: фото (№5) + плакатная типографика (№8) + чертёжная сетка (№1) ===== */}
      <section className="relative overflow-hidden border-b border-border/60 blueprint-grid">
        <div className="mx-auto max-w-7xl px-4 pb-12 pt-12 sm:px-6 md:pt-20">
          <div className="grid items-center gap-8 lg:grid-cols-[1.02fr_0.98fr] lg:gap-12">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55 }}>
              <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3.5 py-1.5 text-xs font-medium text-primary">
                <Sparkles className="h-3.5 w-3.5" />
                Калькулятор · справочник · смета за 24 часа
              </p>
              <h1 className="max-w-2xl text-3xl font-bold leading-[1.08] tracking-tight sm:text-4xl md:text-5xl">
                Независимость от сети:
                <span className="text-gradient-solar"> как получить свой киловатт</span>
                и узнать его цену
              </h1>
              <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground">
                Панели, накопитель и резерв превращают сеть в страховку, а не в единственный
                источник. Три уровня независимости: резерв — на часы, гибрид — на сутки,
                автономия — на годы. Цена вашего киловатта становится предсказуемой на
                двадцать лет вперёд: считаем по PSH региона, реальным ценам оборудования
                и нормо-часам монтажа — в браузере, без звонков.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Button
                  size="lg"
                  className="bg-gradient-solar shadow-[0_10px_28px_-10px_rgba(232,148,10,0.55)] hover:opacity-95"
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
              <p className="mt-4 text-sm text-muted-foreground">
                <button
                  type="button"
                  className="text-primary underline decoration-primary/40 underline-offset-4 transition-colors hover:decoration-primary"
                  onClick={() => window.dispatchEvent(new CustomEvent("home-article:open"))}
                >
                  в продолжении статьи — цена, надёжность, климат ↓
                </button>
              </p>
            </motion.div>

            {/* Фото-слой витрины: реальный объект, приоритет LCP */}
            <motion.figure
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="relative"
            >
              <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-[0_24px_60px_-28px_rgba(34,39,46,0.35)]">
                <img
                  src="/photos/hero-house.jpg"
                  alt="Современный дом с солнечными панелями на крыше"
                  width={1344}
                  height={768}
                  loading="eager"
                  fetchPriority="high"
                  decoding="async"
                  className="aspect-[7/4] w-full object-cover"
                />
              </div>
              <figcaption className="absolute bottom-3 left-3 rounded-lg border border-scene-border/60 bg-scene/90 px-3 py-1.5 text-[11px] font-medium text-scene-foreground backdrop-blur-sm">
                СЭС 10 кВт · наклонная кровля · юг
              </figcaption>
            </motion.figure>
          </div>

          {/* Плакатная полоса цифр (№8): count-up при появлении */}
          <div className="mt-10 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-border bg-border md:grid-cols-4">
            {STATS.map((s) => (
              <div key={s.label} className="bg-card px-5 py-4">
                <CountUp
                  to={s.value}
                  suffix={s.suffix}
                  className="block text-2xl font-bold tabular-nums tracking-tight text-foreground md:text-3xl"
                />
                <span className="mt-0.5 block border-t-2 border-solar/60 pt-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                  {s.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== Главная статья «Независимость»: тизер + мягкий авто-кат (R10) ===== */}
      <HomeArticle />

      {/* ===== №2 «Энергопоток»: тёмная сцена с canvas-частицами (специя ≤10% площади) ===== */}
      <section className="mx-auto max-w-7xl px-4 pt-10 sm:px-6">
        <div
          className="scene overflow-hidden rounded-2xl border border-scene-border shadow-[0_24px_60px_-30px_rgba(31,37,45,0.5)]"
          aria-label="Демонстрация потока энергии станции"
        >
          <EnergyFlowStrip className="h-56 md:h-64" />
        </div>
        <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">
          Демонстрация физики: днём панели питают дом и заряжают АКБ, вечером дом работает от батареи.
          Реальная генерация считается по PSH и наклону вашего региона — в калькуляторе.
        </p>
      </section>

      {/* Три входа в калькулятор (ТЗ: Дача / Дом / Бизнес) с фотополосами */}
      <section className="mx-auto max-w-7xl px-4 pt-12 sm:px-6">
        <div className="grid gap-4 md:grid-cols-3">
          {ENTRIES.map((e, i) => (
            <motion.button
              key={e.title}
              type="button"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.12 + i * 0.08, duration: 0.4 }}
              onClick={() => navigate(e.href)}
              className="card-premium card-premium-hover group overflow-hidden text-left"
            >
              <img
                src={e.photo}
                alt={e.photoAlt}
                width={1200}
                height={800}
                loading="lazy"
                decoding="async"
                className="h-28 w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
              />
              <div className="p-5">
                <div className="flex items-center justify-between">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
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
              </div>
            </motion.button>
          ))}
        </div>
      </section>

      {/* ===== №7 «3D-усадьба»: живая модель участка ===== */}
      <section className="mx-auto max-w-7xl px-4 pt-12 sm:px-6">
        <Reveal>
        <h2 className="text-2xl font-bold tracking-tight md:text-3xl">Прикиньте станцию в 3D</h2>
        <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-muted-foreground">
          Дом 10×6 м с южным скатом 35°. Двигайте мощность — панели «вырастают» на скате,
          переполнение уходит на наземный каркас; переключите зиму — низкое солнце
          удлинит тени и покажет, почему наклон панелей важен. Сцену можно вращать.
        </p>
        </Reveal>
        <div className="mt-7">
          <Estate3D />
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 pt-8 sm:px-6">
        <AdSlot variant="banner" />
      </div>

      {/* ===== Преимущества ===== */}
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
        <Reveal>
        <h2 className="text-2xl font-bold tracking-tight md:text-3xl">Почему расчётам здесь можно верить</h2>
        <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-muted-foreground">
          Методологию согласовали инженер, сметчик, экономист-снабженец и монтажник.
          Каждый параметр, влияющий на цену, объясняется прямо в калькуляторе.
        </p>
        </Reveal>
        <Reveal className="mt-8">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
        </Reveal>
      </section>

      {/* ===== Как мы работаем: фото инженера + шаги ===== */}
      <section className="border-y border-border/60 bg-card/40">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[0.9fr_1.1fr]">
          <figure className="order-2 lg:order-1">
            <div className="overflow-hidden rounded-2xl border border-border shadow-[0_20px_50px_-26px_rgba(34,39,46,0.32)]">
              <img
                src="/photos/engineer.jpg"
                alt="Инженер-монтажник устанавливает солнечную панель"
                width={1200}
                height={800}
                loading="lazy"
                decoding="async"
                className="aspect-[3/2] w-full object-cover"
              />
            </div>
            <figcaption className="mt-2.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              Проверка расчёта инженером — до подписания договора
            </figcaption>
          </figure>
          <div className="order-1 lg:order-2">
            <h2 className="text-2xl font-bold tracking-tight md:text-3xl">Как мы работаем</h2>
            <div className="mt-8 grid gap-6 md:grid-cols-3">
              {STEPS.map((s) => (
                <div key={s.n} className="relative">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-solar text-base font-bold">
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
        </div>
      </section>

      {/* ===== Мини-кейсы ===== */}
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <Reveal>
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
          </Reveal>
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
