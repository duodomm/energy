// Служебная страница-«полка»: 10 вариантов фото на главную (v01–v10).
// Живёт вне SPA с hash-роутингом по адресу /hero-variants — чтобы владелец
// мог открыть галерею в браузере и выбрать кадр по номеру в чате.
// Кадры приведены к формату главной: 1400×800 (7:4), оптимизированы по весу.
// noindex: страница выбора, не контент для поисковых систем.

import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Фото на главную — 10 вариантов",
  description: "Витрина кадров v01–v10 для главного экрана. Скажите номер — кадр встанет на главную.",
  robots: { index: false, follow: false },
}

type Variant = {
  num: string
  title: string
  note: string
}

const VARIANTS: Variant[] = [
  { num: "v01", title: "Закат", note: "Наземный массив в золотой час — тёплое «благородное» настроение, в тон «Янтарному полдню»" },
  { num: "v02", title: "Вид сверху", note: "Кровля под панелями с высоты — инженерная геометрия, читается как схема монтажа" },
  { num: "v03", title: "Брусовый дом", note: "ФЭС на древесине — живой частный объект, ближе всего к аудитории «дача/усадьба»" },
  { num: "v04", title: "Визуализация", note: "Скандинавский коттедж с массивом — аккуратный «каталожный» кадр, чисто и безлюдно" },
  { num: "v05", title: "Визуализация", note: "Дом с накопителем на стене — сюжет «дом-электростанция», пара к разделу про АКБ" },
  { num: "v06", title: "Двухэтажный", note: "Массив на два ската — масштаб системы, доверие к «серьёзному» проекту" },
  { num: "v07", title: "Панорама", note: "Усадьба целиком с наземным массивом — широкий кадр под большой экран, простор" },
  { num: "v08", title: "Фасад", note: "Одноэтажный дом анфас — фронтальный «архитектурный» ракурс, строгий и спокойный" },
  { num: "v09", title: "Аэросъёмка", note: "Объект с дрона — воздух и контекст участка, современный визуальный язык" },
  { num: "v10", title: "Экодом", note: "Зелёная крыша и солнце — экологичная интонация, тёплая и «не продающая»" },
]

export default function HeroVariantsPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        {/* Шапка страницы */}
        <header className="mb-10">
          <a
            href="/"
            className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-sm text-primary transition-colors hover:bg-accent"
          >
            ← Вернуться на сайт
          </a>
          <h1 className="mt-6 text-3xl font-bold tracking-tight sm:text-4xl">
            Фото на главную —{" "}
            <span className="text-gradient-solar">10 вариантов</span>
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground">
            Все кадры приведены к формату главного экрана (1400×800) и
            оптимизированы по весу. Посмотрите витрину и просто назовите номер
            в чате — например, «ставь v07» — и кадр встанет на главную страницу.
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Формат обращения не важен: v01 … v10 или «второй», «предпоследний» —
            я пойму по описанию.
          </p>
        </header>

        {/* Витрина кадров */}
        <section aria-label="Варианты фото" className="grid grid-cols-1 gap-8 sm:grid-cols-2">
          {VARIANTS.map((v) => (
            <figure
              key={v.num}
              className="group overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="relative aspect-[7/4] overflow-hidden bg-muted">
                <img
                  src={`/hero-variants/${v.num}.jpg`}
                  alt={`Вариант ${v.num} — ${v.title}`}
                  width={1400}
                  height={800}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                />
                <span className="absolute left-3 top-3 rounded-md bg-foreground/80 px-2.5 py-1 text-sm font-semibold text-background backdrop-blur-sm">
                  {v.num}
                </span>
              </div>
              <figcaption className="px-4 py-3">
                <span className="font-semibold text-foreground">
                  {v.num} · {v.title}
                </span>
                <span className="mt-1 block text-sm leading-relaxed text-muted-foreground">
                  {v.note}
                </span>
              </figcaption>
            </figure>
          ))}
        </section>

        {/* Как происходит замена */}
        <footer className="mt-12 rounded-xl border border-border bg-secondary/60 p-6">
          <h2 className="text-lg font-semibold">Как происходит замена</h2>
          <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-relaxed text-muted-foreground">
            <li>Вы называете номер варианта в чате.</li>
            <li>
              Кадр встаёт на главный экран с фирменной обработкой (мягкий дуотон,
              кадр виден полностью) и проверкой веса/скорости загрузки.
            </li>
            <li>Если что-то не понравится — возврат к текущему кадру одной командой.</li>
          </ol>
        </footer>
      </div>
    </main>
  )
}
