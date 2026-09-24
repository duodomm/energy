"use client"

// Волна 5: «живые» материалы хабов-«столпов» (/solnce, /nakopiteli,
// /generatory, /teo). Каждый хаб получает: 3 шага «как это работает» с
// бренд-пиктограммами, 4 плакатные цифры (CountUp, концепт №8), дата-виз
// с настоящими данными проекта (PSH/циклы/₽ за кВт·ч/окупаемость),
// широкий дуотон-баннер с фактом и карточки «миф → как на самом деле».
// Цифры сверены со статьями хабов и справочником регионов — вранья нет.

import { ArrowRight } from "lucide-react"
import { CountUp } from "@/components/common/count-up"
import { navigate } from "@/lib/router"
import {
  PictoSunPanel, PictoInverter, PictoBoardHouse,
  PictoCharge, PictoDischarge, PictoTariff,
  PictoGridOff, PictoAutoStart, PictoReturn,
  PictoLcoe, PictoScale, PictoDecide,
  PshCompare, CyclesBars, CostBars, PaybackCurve,
} from "@/components/hub/hub-visuals"

type Step = { picto: React.ComponentType; title: string; text: string }
type Stat = { to: number; decimals?: number; prefix?: string; suffix?: string; label: string }
type Viz = { title: string; linkLabel: string; linkHref: string; render: React.ComponentType; insight: string }
type Banner = { img: string; caption: string; fact: string }
type Myth = { myth: string; truth: string }
type HubContent = {
  stepsTitle: string; steps: Step[]
  statsTitle: string; stats: Stat[]
  viz: Viz; banner: Banner; myths: Myth[]
}

const CONTENT: Record<string, HubContent> = {
  sun: {
    stepsTitle: "Как солнце становится киловатт-часом",
    steps: [
      {
        picto: PictoSunPanel,
        title: "Фотон выбивает электрон",
        text: "Панель — полупроводниковый диод огромной площади: фотоны выбивают электроны, и стринг отдаёт постоянный ток 30–60 В. Массовый КПД — 19–23%, остальное уходит в тепло.",
      },
      {
        picto: PictoInverter,
        title: "Инвертор наводит порядок",
        text: "Постоянный ток превращается в привычные 220/380 В. Гибридные модели заодно заряжают АКБ днём и переключают дом на батарею за 10–20 мс — розетки не мигнут.",
      },
      {
        picto: PictoBoardHouse,
        title: "Щит развязывает и защищает",
        text: "Солнце, сеть, батарея и нагрузки сходятся в щите: реле защиты, УЗО, счётчик. Дальше энергия уходит в котёл, насос и чайник — по обычным проводам.",
      },
    ],
    statsTitle: "Солнце в цифрах",
    stats: [
      { to: 21, suffix: " %", label: "КПД массовых панелей 2026 года — моно PERC и TOPCon" },
      { to: 1200, suffix: " кВт·ч", label: "в год даёт 1 кВт панелей в средней полосе (по стране 850–1400)" },
      { to: 25, suffix: " лет", label: "гарантия мощности у Tier-1: деградация не больше 0,45% в год" },
      { to: 550, suffix: " Вт", label: "типовая панель 2026 года: 550–600 Вт, ячейки 182–210 мм" },
    ],
    viz: {
      title: "Сколько солнца падает на ваш город",
      linkLabel: "Все 32 региона и тарифы",
      linkHref: "#/regiony",
      render: PshCompare,
      insight:
        "Зима — не ноль: в Приангарье декабрь даёт 38% июньской выработки, а во Владивостоке зима — самый солнечный сезон: муссон приносит ясные дни. Полярной ночью живёт Мурманск — там станция сезонная, и это тоже просчитывается заранее.",
    },
    banner: {
      img: "/photos/hub/sun.jpg",
      caption: "ФЭМ · после дождя",
      fact: "Дождь — бесплатная мойка: чистое стекло возвращает 2–10% выработки",
    },
    myths: [
      {
        myth: "В России мало солнца",
        truth: "Годовая выработка 1 кВт панелей — 850–1400 кВт·ч: уровень Германии, лидера ЕС по солнечной генерации. Дело не в солнце, а в честном расчёте под ваш регион.",
      },
      {
        myth: "Зимой панели бесполезны",
        truth: "В мороз панель работает эффективнее — температурный коэффициент играет в плюс. Декабрь средней полосы даёт 25–40% июньской генерации, а снегу мешает наклон 35–40°.",
      },
      {
        myth: "Летом панели «сгорают»",
        truth: "На кровле панель греется до +70 °C и теряет 8–12% мощности — это уже учтено в performance ratio 0,78. Сжигает не солнце, а завышенные ожидания.",
      },
    ],
  },

  storage: {
    stepsTitle: "Сутки станции с накопителем",
    steps: [
      {
        picto: PictoCharge,
        title: "День: излишки — в батарею",
        text: "Солнце закрывает дом целиком, остаток идёт в АКБ: LiFePO4 принимает заряд почти до полного и не «устаёт» от частых циклов.",
      },
      {
        picto: PictoDischarge,
        title: "Вечер: дом кормит батарея",
        text: "С закатом — разряд: свет, котёл, холодильник. Гибридный инвертор переводит нагрузки за 10–20 мс, телевизор не успеет мигнуть.",
      },
      {
        picto: PictoTariff,
        title: "Ночь: зарядка по дешёвому тарифу",
        text: "Если сеть есть, батарея заряжается ночью за 2,3–3,4 ₽/кВт·ч и разряжается вечером, когда киловатт стоит 6–8 ₽. Арбитраж — тихий заработок.",
      },
    ],
    statsTitle: "Накопители в цифрах",
    stats: [
      { to: 6000, suffix: " цикл.", label: "живёт LiFePO4 до 80% ёмкости — вилка 4000–8000" },
      { to: 90, suffix: " %", label: "глубина разряда LiFePO4 — AGM из «10 кВт·ч» даст лишь 5" },
      { to: 16, prefix: "до ", suffix: " лет", label: "службы при одном цикле в день — 11–16 лет по паспортам" },
      { to: 2.3, decimals: 1, suffix: " ₽", label: "ночная зарядка в средней полосе — против 6–8 ₽ вечером" },
    ],
    viz: {
      title: "Сколько живут батареи",
      linkLabel: "Разбор технологий",
      linkHref: "#/blog/nakopiteli-lifepo4-agm-vrfb",
      render: CyclesBars,
      insight:
        "Математика беспощадна: «10 кВт·ч» AGM — это 5 полезных, и умрут они за 2–3 года ежедневных циклов. LiFePO4 при том же цикле в день проживёт 11–16 лет. VRFB — промышленная лига для объектов от 100 кВт·ч.",
    },
    banner: {
      img: "/photos/hub/storage.jpg",
      caption: "Домашний накопитель",
      fact: "Одна и та же полезная энергия через AGM за 5 лет стоит в 2–3 раза дороже лития",
    },
    myths: [
      {
        myth: "Литий-батареи опасны",
        truth: "LiFePO4 — фосфатная химия: не поддерживает горение, штатно переносит прокол и перегрев. BMS с токовой защитой и балансировкой обязателен — и он уже внутри нормальной батареи.",
      },
      {
        myth: "АКБ окупаются всегда",
        truth: "Только при дорогой или ненадёжной сети, либо двухтарифнике с дельтой день/ночь от 2,5 ₽. При одноставочном тарифе около 5 ₽ и пустом днём доме — не окупятся.",
      },
      {
        myth: "Возьму AGM — он дешевле",
        truth: "Дешевле на ценнике, дороже в киловатт-часах: 600 циклов против 6000. AGM оправдан лишь для крошечных задач — сигнализация, сторожка, резерв на пару часов.",
      },
    ],
  },

  generator: {
    stepsTitle: "Когда сеть пропадает",
    steps: [
      {
        picto: PictoGridOff,
        title: "Сеть пропала",
        text: "Гибридный инвертор за 10–20 мс переводит дом на АКБ: сервер, котёл и насос продолжают работать, как будто ничего не случилось.",
      },
      {
        picto: PictoAutoStart,
        title: "АВР заводит генератор",
        text: "Если ненастье затянулось, автоматика ввода резерва запускает генератор через 10–15 с: он подхватывает дом и заодно подзаряжает батарею.",
      },
      {
        picto: PictoReturn,
        title: "Сеть вернулась",
        text: "Генератор пару минут остывает и глохнет; станция возвращается к солнцу и АКБ. Всё это — без единого действия руками: АВР решает сам.",
      },
    ],
    statsTitle: "Резерв в цифрах",
    stats: [
      { to: 10, suffix: " мс", label: "переключение на АКБ — инвертор быстрее, чем моргнёт глаз" },
      { to: 15, suffix: " с", label: "запуск генератора под нагрузкой — автоматика ввода резерва" },
      { to: 250, suffix: " м·ч", label: "между ТО: масло и фильтры — 12–25 тыс ₽ за сервисную замену" },
      { to: 9000, suffix: " м·ч", label: "ресурс дизеля до капремонта — газовый живёт столько же" },
    ],
    viz: {
      title: "Полная цена резервного киловатта",
      linkLabel: "Дизель или газ — разбор",
      linkHref: "#/blog/dizel-ili-gaz-vybor-rezerva",
      render: CostBars,
      insight:
        "Час дизеля кормит дом, но каждый его киловатт-час стоит как четыре сетевых. Поэтому генератор — страховка на 50–200 часов в год, а будни закрывают солнце и батарея. Газ выигрывает везде, где проходит магистраль.",
    },
    banner: {
      img: "/photos/hub/generator.jpg",
      caption: "Резерв · дизель в кожухе",
      fact: "Дизель в кожухе с подогревом заводится в −30 °C: кожух важнее бренда",
    },
    myths: [
      {
        myth: "Дизель надёжнее газа",
        truth: "Ресурс сопоставим — 8–10 тыс. м·ч, но газовый обслуживается вдвое дешевле: нет сажи, масло живёт дольше. Дизель берут запасом тяги, а не «надёжностью».",
      },
      {
        myth: "Поставлю генератор в подвале",
        truth: "Только вне жилых помещений: выхлоп, шум и угарный газ. Кожух или контейнер на улице, выхлоп наружу, ввод через АВР в щите — так требует ПУЭ.",
      },
      {
        myth: "Генератор заменит солнце",
        truth: "Дизельный киловатт-час — 18–27 ₽, солнечный на горизонте 20 лет — 4–10 ₽. Правильная связка: солнце — будни, АКБ — вечера, генератор — длинное ненастье.",
      },
    ],
  },

  economics: {
    stepsTitle: "Как мы считаем деньги, а не лозунги",
    steps: [
      {
        picto: PictoLcoe,
        title: "LCOE вместо «за 3 года»",
        text: "Полная цена киловатт-часа: капзатраты, замены, деградация и дисконтирование, поделённые на «сегодняшние» киловатт-часы за весь срок жизни станции.",
      },
      {
        picto: PictoScale,
        title: "Сравнение с вашей альтернативой",
        text: "Не с нулём, а с тем, что вы платите сейчас: тарифом с ростом около 8% в год, дизелем по 18–27 ₽ или подключением новой линии за 450+ тыс ₽.",
      },
      {
        picto: PictoDecide,
        title: "Решение по точке нуля",
        text: "Калькулятор строит кумулятивный поток и показывает, когда станция выходит в ноль. Вилка «от–до» честнее любой «средней по стране».",
      },
    ],
    statsTitle: "Экономика в цифрах",
    stats: [
      { to: 12.5, decimals: 1, suffix: " лет", label: "точка нуля гибрида 10 кВт в средней полосе — вилка 9–16,5" },
      { to: 8, suffix: " %/год", label: "рост тарифов — главный двигатель окупаемости станции" },
      { to: 74, suffix: " %", label: "самопотребление в типовом домашнем сценарии с АКБ" },
      { to: 3.5, decimals: 1, prefix: "≤ ", suffix: " ₽", label: "выкупная цена излишков для микрогенерации до 15 кВт" },
    ],
    viz: {
      title: "Дорога к точке нуля",
      linkLabel: "Полный разбор с таблицей",
      linkHref: "#/blog/okupaemost-solar-2026",
      render: PaybackCurve,
      insight:
        "Гибрид 10 кВт, средняя полоса: CAPEX 1,6 млн ₽, тариф 5,7 ₽ с ростом 8% в год. Провал на 13-м году — плановая замена инвертора; даже с ней к 20-му году станция приносит +1,13 млн ₽ — не считая независимости от отключений.",
    },
    banner: {
      img: "/photos/hub/economics.jpg",
      caption: "Смета и контроль",
      fact: "Считайте своё, а не «среднее»: Москва 6,9 ₽ → 10,5 лет; юрлицо 11+ ₽ → 6 лет; дизельная зона → 3–5 лет",
    },
    myths: [
      {
        myth: "Окупится за 3 года",
        truth: "Такое бывает только в дизельных зонах Севера с тарифом 20–30 ₽. Средняя полоса — 9–16 лет, юрлица с дорогой сетью — 4–8.",
      },
      {
        myth: "Излишки продам по рознице",
        truth: "Выкупная цена микрогенерации — 1,5–3,5 ₽/кВт·ч, близко к оптовой. Это не бизнес, а способ вернуть деньгами 5–12% годовой выручки счёта.",
      },
      {
        myth: "Тарифы не вырастут",
        truth: "Индексация последних лет — 8–10% ежегодно. Каждый год роста приближает точку нуля примерно на полгода — и это уже посчитано в калькуляторе.",
      },
    ],
  },
}

// ─────────────────────────────────────────────────────────────────────
// БЛОКИ
// ─────────────────────────────────────────────────────────────────────

function H2({ children }: { children: React.ReactNode }) {
  return <h2 className="mb-5 text-xl font-semibold tracking-tight md:text-2xl">{children}</h2>
}

function StepsBlock({ c }: { c: HubContent }) {
  return (
    <section aria-label={c.stepsTitle}>
      <H2>{c.stepsTitle}</H2>
      <div className="grid gap-4 md:grid-cols-3">
        {c.steps.map((s, i) => (
          <article key={s.title} className="card-premium flex gap-4 p-5">
            <div className="neu-inset flex h-[60px] w-[60px] shrink-0 items-center justify-center rounded-xl">
              <s.picto />
            </div>
            <div className="min-w-0">
              <p className="svg-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Шаг {String(i + 1).padStart(2, "0")}
              </p>
              <h3 className="mt-1 text-[15px] font-semibold leading-snug">{s.title}</h3>
              <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">{s.text}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

function StatsBlock({ c }: { c: HubContent }) {
  return (
    <section aria-label={c.statsTitle}>
      <H2>{c.statsTitle}</H2>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {c.stats.map((st) => (
          <div key={st.label} className="card-premium p-5">
            <p className="text-2xl font-bold tabular-nums text-[#B45309] sm:text-3xl">
              <CountUp to={st.to} decimals={st.decimals} prefix={st.prefix} suffix={st.suffix} />
            </p>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{st.label}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

function VizBlock({ c }: { c: HubContent }) {
  const Viz = c.viz.render
  return (
    <section aria-label={c.viz.title}>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-semibold tracking-tight md:text-2xl">{c.viz.title}</h2>
        <button
          type="button"
          onClick={() => navigate(c.viz.linkHref)}
          className="inline-flex items-center gap-1.5 rounded-full border border-border bg-secondary/60 px-3.5 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-secondary"
        >
          {c.viz.linkLabel} <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>
      <div className="card-premium p-5 sm:p-6">
        <Viz />
        <p className="mt-5 border-t border-border/60 pt-4 text-[13px] leading-relaxed text-muted-foreground">
          {c.viz.insight}
        </p>
      </div>
    </section>
  )
}

function BannerBlock({ c }: { c: HubContent }) {
  return (
    <figure className="relative overflow-hidden rounded-2xl border border-border/70">
      <img
        src={c.banner.img}
        alt=""
        width={1200}
        height={400}
        loading="lazy"
        decoding="async"
        className="aspect-[5/2] w-full object-cover sm:aspect-[3/1]"
      />
      <figcaption className="absolute bottom-3 left-3 max-w-[86%] items-center rounded-full border border-[#E8E2D5] bg-[#FAF8F3]/95 px-3.5 py-1.5 text-[11px] leading-snug text-[#0F5568] shadow-[0_2px_10px_rgba(34,39,46,0.18)] sm:bottom-4 sm:left-4 sm:max-w-[75%] sm:text-xs">
        {c.banner.fact}
      </figcaption>
      <span className="svg-mono absolute right-3 top-3 rounded-full border border-[#E8E2D5] bg-[#FAF8F3]/95 px-2.5 py-1 text-[9px] font-medium uppercase tracking-[0.12em] text-[#0F5568] shadow-[0_2px_10px_rgba(34,39,46,0.18)]">
        {c.banner.caption}
      </span>
    </figure>
  )
}

function MythsBlock({ c }: { c: HubContent }) {
  return (
    <section aria-label="Мифы и реальность">
      <H2>Мифы и реальность</H2>
      <div className="grid gap-4 md:grid-cols-3">
        {c.myths.map((m) => (
          <article key={m.myth} className="card-premium p-5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Миф</p>
            <p className="mt-1.5 text-sm font-medium leading-snug text-muted-foreground line-through decoration-[#D2382F]/50">
              {m.myth}
            </p>
            <p className="mt-4 text-[10px] font-semibold uppercase tracking-[0.14em] text-primary">Как на самом деле</p>
            <p className="mt-1.5 text-[13px] leading-relaxed">{m.truth}</p>
          </article>
        ))}
      </div>
    </section>
  )
}

// ─────────────────────────────────────────────────────────────────────
// ЭКСПОРТ: HubExtras — до статей, HubMyths — после
// ─────────────────────────────────────────────────────────────────────

export function HubExtras({ hub }: { hub: string }) {
  const c = CONTENT[hub] ?? CONTENT.sun
  return (
    <div className="flex flex-col gap-10">
      <StepsBlock c={c} />
      <StatsBlock c={c} />
      <VizBlock c={c} />
      <BannerBlock c={c} />
    </div>
  )
}

export function HubMyths({ hub }: { hub: string }) {
  const c = CONTENT[hub] ?? CONTENT.sun
  return <MythsBlock c={c} />
}
