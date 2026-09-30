"use client"

// Главная статья «Вариант 2 — Независимость» (R10, восстановлено после
// пересоздания контейнера). Заголовок и ядро живут в hero главной;
// этот компонент — тело статьи: тизер + мягкий авто-кат продолжения.
//
// Поведение кат-блока (по протоколу R10, без баннера и кнопок «читать»):
// — тизер читается целиком; его нижняя кромка «растворяется» в фон
//   (градиент), клик по зоне растворения — запасной вход в продолжение;
// — при докручивании линии среза до нижних 30% экрана продолжение мягко
//   раскрывается (высота 0,75 с + фейд содержимого);
// — когда читатель уходит вверх за пределы статьи (верх секции ниже
//   вьюпорта), продолжение так же мягко сворачивается;
// — ссылка «в продолжении статьи» из hero шлёт событие home-article:open —
//   раскрываем и мягко скроллим к началу статьи.
// SSR: продолжение присутствует в DOM всегда (SEO), визуально скрыто высотой.

import { useCallback, useEffect, useRef, useState } from "react"
import { ChevronDown } from "lucide-react"

const DUR_MS = 750 // высота 0,75 с — «мягко», без резкости

const STEPS = [
  { n: 1, t: "Посчитайте суточное потребление", d: "Лист приборов с мощностью и часами — уже в калькуляторе.", href: "#/kalkulyator", link: "Открыть калькулятор" },
  { n: 2, t: "Выберите уровень независимости", d: "Резерв, гибрид или автономия — от этого зависит набор оборудования.", href: null, link: null },
  { n: 3, t: "Сверьте солнце своего региона", d: "PSH на 12 месяцев, тарифы, снеговой район — 32 региона РФ.", href: "#/regiony", link: "Справочник регионов" },
  { n: 4, t: "Прикиньте смету «от–до»", d: "Шесть шагов визарда: смета с графиком генерации и экономикой.", href: "#/kalkulyator", link: "Считать станцию" },
  { n: 5, t: "Проверьте расчёт инженером", d: "Сверка с прайсами поставщиков региона — 24 часа, без спама.", href: "#/kontakty?form=1", link: "Оставить контакты" },
  { n: 6, t: "Посмотрите живые кейсы", d: "Пять объектов с полными сметами — от дачи до производства 250 кВт.", href: "#/kejsy", link: "Кейсы" },
]

export function HomeArticle() {
  const sectionRef = useRef<HTMLElement>(null)
  const topRef = useRef<HTMLDivElement>(null)
  const cutRef = useRef<HTMLDivElement>(null)
  const contRef = useRef<HTMLDivElement>(null)

  const [expanded, setExpanded] = useState(false)
  const [height, setHeight] = useState(0) // px; 0 = свёрнуто
  const [auto, setAuto] = useState(false) // после раскрытия высота «auto»

  // ── Раскрытие: измеряем полную высоту и анимируем 0 → H ──
  const expand = useCallback(() => {
    const el = contRef.current
    if (!el) return
    setExpanded(true)
    setAuto(false)
    setHeight(el.scrollHeight)
  }, [])

  // ── Свёртывание: auto → фикс. высота → 0 (двойной rAF до перехода) ──
  const collapse = useCallback(() => {
    const el = contRef.current
    if (!el) return
    setAuto(false)
    setHeight(el.scrollHeight)
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setExpanded(false)
        setHeight(0)
      })
    })
  }, [])

  // Завершение анимации раскрытия → высота «auto» (таблицы/картинки не режутся)
  useEffect(() => {
    if (!expanded) return
    const t = window.setTimeout(() => setAuto(true), DUR_MS + 60)
    return () => window.clearTimeout(t)
  }, [expanded])

  // ── Наблюдатели: авто-раскрытие у линии среза / авто-свёртывание сверху ──
  useEffect(() => {
    if (expanded) {
      // Статья раскрыта: следим за верхом секции. «Не пересекается +
      // rect.top > 0» = читатель ушёл ВЫШЕ статьи — мягко сворачиваем.
      const top = topRef.current
      if (!top) return
      const io = new IntersectionObserver(
        (entries) => {
          const e = entries[0]
          if (e && !e.isIntersecting && e.boundingClientRect.top > 0) collapse()
        },
        { threshold: 0 }
      )
      io.observe(top)
      return () => io.disconnect()
    }
    // Свёрнуто: линия среза входит в зону выше нижних 30% экрана → раскрыть
    const cut = cutRef.current
    if (!cut) return
    const io = new IntersectionObserver(
      (entries) => {
        const e = entries[0]
        if (e && e.isIntersecting) expand()
      },
      { rootMargin: "0px 0px -30% 0px", threshold: 0 }
    )
    io.observe(cut)
    return () => io.disconnect()
  }, [expanded, expand, collapse])

  // ── Вход из hero: «в продолжении статьи» → раскрыть + мягкий скролл ──
  useEffect(() => {
    const onOpen = () => {
      expand()
      const sec = sectionRef.current
      if (sec) {
        requestAnimationFrame(() => {
          const y = sec.getBoundingClientRect().top + window.scrollY - 76
          window.scrollTo({ top: y, behavior: "smooth" })
        })
      }
    }
    window.addEventListener("home-article:open", onOpen)
    return () => window.removeEventListener("home-article:open", onOpen)
  }, [expand])

  const hStyle = expanded ? (auto ? "auto" : `${height}px`) : `${height}px`

  return (
    <section
      ref={sectionRef}
      id="glavnaya-statya"
      aria-labelledby="home-article-title"
      className="mx-auto max-w-3xl px-4 pt-14 sm:px-6"
    >
      {/* Верхний маркер: наблюдатель авто-свёртывания */}
      <div ref={topRef} className="h-0 w-0" aria-hidden="true" />

      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">
        Главная статья · Независимость
      </p>
      <h2 id="home-article-title" className="mt-2 text-2xl font-bold tracking-tight md:text-3xl">
        Продолжение: цена, надёжность и климат
      </h2>

      <div className={`article-md mt-2 ${expanded ? "reading-track" : ""}`}>
        {/* ── Тизер (всегда видим) ── */}
        <p>
          Сеть — это тариф, который растёт: 8&nbsp;% в год в наших расчётных
          сценариях. 6,9&nbsp;₽ за киловатт-час в Москве сегодня — это
          ~14,9&nbsp;₽ через десять лет, если ничего не менять. Собственная
          генерация — другой договор: топливо бесплатно, оборудование
          амортизируется известным графиком, а цена киловатта фиксируется
          в&nbsp;момент покупки. Вопрос ровно один — какой она окажется.
        </p>
        <p>
          Инженерный ответ скучен и надёжен: независимость измеряется
          уровнями, и на каждом из них киловатт считается по одним и тем же
          формулам — LCOE с дисконтированием, реальные цены оборудования,
          нормо-часы монтажа вашего региона. Разница — только в наборе
          железа и в том, что именно страхует система: часы отключения,
          дорогой дневной тариф или полное отсутствие сети.
        </p>

        {/* ── Линия среза + продолжение (мягкий кат) ── */}
        <div className="relative">
          {/* Маркер линии среза: наблюдатель авто-раскрытия */}
          <div ref={cutRef} className="h-0 w-0" aria-hidden="true" />

          <div
            className="overflow-hidden transition-[height] ease-[cubic-bezier(0.22,1,0.36,1)]"
            style={{ height: hStyle, transitionDuration: `${DUR_MS}ms` }}
          >
            <div
              ref={contRef}
              className="transition-opacity ease-out"
              style={{
                opacity: expanded ? 1 : 0,
                transitionDuration: expanded ? "600ms" : "200ms",
                transitionDelay: expanded ? "150ms" : "0ms",
              }}
            >
              <h3>Три уровня независимости — и где вы на самом деле находитесь</h3>
              <p>
                <b>Резерв — часы.</b> Свет не должен гаснуть при отключении:
                гибридный инвертор переводит нагрузку за 10&nbsp;миллисекунд —
                компьютер и котёл не заметят. Для базовой нагрузки дома хватает
                5&nbsp;кВт·ч LiFePO4: холодильник, насос, котёл, роутер и свет
                живут 3–4 часа; дольше — уже задача генератора.
              </p>
              <p>
                <b>Гибрид — сутки.</b> Панели замещают дорогой дневной тариф,
                АКБ заряжаются ночью по 2,7–3,4&nbsp;₽ (двухтарифный арбитраж),
                самопокрытие дома 10&nbsp;кВт достигает 60–90&nbsp;% в год.
                Сеть остаётся страховкой, а не источником.
              </p>
              <p>
                <b>Автономия — годы.</b> Массив считается по зимнему PSH,
                ёмкость — по метели без солнца, генератор страхует длинные
                пасмурные периоды. Отдельная лига — микрогенерация до
                15&nbsp;кВт: излишки можно возвращать в сеть и получать
                компенсацию по зонному тарифу.
              </p>

              <h3>N−1: принцип, который дороже любого железа</h3>
              <p>
                В большой энергетике систему проектируют так, чтобы отказ
                любого <i>одного</i> элемента не оставлял потребителей без
                питания — это и есть N−1. Для дома принцип тот же: сеть,
                солнечный массив, АКБ и генератор — четыре источника, и отказ
                любого из них меняет экономику, но не оставляет объект в
                темноте. Инвертор в ремонте — работает сеть или генератор.
                Неделя пасмурной погоды — дизель подзаряжает АКБ по графику,
                а не «когда сломается». Отсюда и выбор оборудования:
                ремонтопригодность и сервис в регионе важнее красивых цифр
                в паспорте.
              </p>

              <h3>Чек на двадцать лет: жизненный цикл и честный LCOE</h3>
              <p>
                Независимость покупается один раз, а служит десятилетиями.
                Планируйте её как инженер — по графику замен:
              </p>
              <table>
                <thead>
                  <tr>
                    <th>Компонент</th>
                    <th>Срок службы</th>
                    <th>Потери / деградация</th>
                    <th>Плановая замена</th>
                  </tr>
                </thead>
                <tbody>
                  <tr><td>ФЭМ (панели)</td><td>25–30 лет</td><td>−0,5 %/год, ≥ 80 % мощности к 25-му году</td><td>нет</td></tr>
                  <tr><td>Инвертор</td><td>10–15 лет</td><td>КПД 96–97 %</td><td>1–2 раза за 25 лет</td></tr>
                  <tr><td>АКБ LiFePO4</td><td>6000 циклов (10–15 лет)</td><td>до 80 % ёмкости</td><td>1 раз</td></tr>
                  <tr><td>АКБ AGM</td><td>~600 циклов (4–7 лет)</td><td>до 60 % ёмкости</td><td>3–4 раза</td></tr>
                  <tr><td>Дизель-генератор</td><td>10 000–20 000 мото-ч</td><td>ТО каждые 250 ч, капремонт ~5000 ч</td><td>по моточасам</td></tr>
                  <tr><td>Конструкции, кабель</td><td>25+ лет</td><td>коррозия &lt; 2 %</td><td>нет</td></tr>
                </tbody>
              </table>
              <p>
                По движку калькулятора LCOE собственной солнечной генерации —
                4–10&nbsp;₽ за кВт·ч в зависимости от региона и режима. У
                дизеля только топлива уходит 0,27&nbsp;л/кВт·ч × 72&nbsp;₽/л ≈
                19,4&nbsp;₽, а с ТО и капремонтом — 22–25&nbsp;₽. Разница не
                «ощутимая», а трёхкратная — и это главный аргумент за массив,
                а не за генератор.
              </p>

              <h3>Климат России: PSH, зима и СП 20.13330</h3>
              <p>
                Инсоляция по регионам различается сильнее, чем кажется:
                среднегодовой PSH (пиковых солнце-часов) — 3,99 в Краснодаре,
                3,82 в Иркутске, 3,05 в Москве, 2,58 в Мурманске. Зимние
                месяцы в 3–4 раза беднее лета, поэтому автономный массив
                считают по декабрю, а не по среднему. Восток страны удивляет:
                Владивосток с ясной зимой и Приамурье часто «солнечнее»
                Москвы в самый дефицитный сезон.
              </p>
              <p>
                Зима — это ещё и нагрузка на железо: снеговые и ветровые
                районы по СП 20.13330 определяют шаг профиля и крепёж
                массива (Камчатка и Сахалин — VIII снеговой район, это
                другая конструкция, чем Подмосковье). Наклон панелей не ниже
                широты: снег сходит сам, потери на отражение падают, а
                весенняя генерация растёт.
              </p>

              <h3>Путь к своей станции: шесть шагов</h3>
              <ol className="steps-cards my-6 space-y-2.5">
                {STEPS.map((s) => (
                  <li key={s.n} className="card-premium flex gap-3.5 p-4">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-solar text-sm font-bold text-primary-foreground">
                      {s.n}
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{s.t}</p>
                      <p className="mt-0.5 text-[13px] leading-relaxed text-muted-foreground">
                        {s.d}{" "}
                        {s.href && (
                          <a href={s.href} className="whitespace-nowrap text-primary underline decoration-primary/40 underline-offset-2 hover:decoration-primary">
                            {s.link} →
                          </a>
                        )}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
              <p>
                Независимость — это не про «оторваться от сети» и не
                идеология. Это про предсказуемую цену киловатта, свет, который
                не гаснет, и решение, которое принимается один раз и на
                двадцать лет. Считайте до покупки — а не после.
              </p>
            </div>
          </div>

          {/* Зона растворения: градиент в фон поверх нижней кромки тизера.
              Снаружи overflow-контейнера — иначе была бы обрезана. */}
          <button
            type="button"
            aria-label="Раскрыть продолжение статьи"
            onClick={expand}
            tabIndex={expanded ? -1 : 0}
            aria-hidden={expanded}
            className="absolute inset-x-[-4px] -top-[84px] h-[92px] cursor-pointer bg-gradient-to-b from-transparent via-background/85 to-background"
            style={{
              opacity: expanded ? 0 : 1,
              pointerEvents: expanded ? "none" : "auto",
              transition: "opacity 400ms ease",
            }}
          />

          {/* Подсказка у линии среза (уходит при раскрытии) */}
          <div
            className="pointer-events-none flex h-9 items-end justify-center"
            style={{ opacity: expanded ? 0 : 1, transition: "opacity 350ms ease" }}
            aria-hidden="true"
          >
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background/80 px-3 py-1 text-[11px] font-medium text-muted-foreground backdrop-blur-sm">
              <ChevronDown className="h-3.5 w-3.5 animate-bounce text-primary" />
              продолжение откроется здесь само — или по клику
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}
