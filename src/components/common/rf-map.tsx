"use client"

// Интерактивная карта РФ (замена «стены регионов»): стилизованный силуэт
// страны (чертёжная подача С10: сетка-миллиметровка, моно-подписи) + 32
// маркера-региона. Цвет маркера — среднегодовой PSH (петроль → янтарь:
// солнечные регионы получают акцент П1). Клик — карточка региона на
// странице; выбор округа — плавный зум viewBox на его субъекты.
//
// Геометрия: упрощённая береговая линия (схема, не картография): Аляскинская
// проекция не нужна — линейная развёртка «псевдо-проекция» честно подписана
// в углу. CWV: чистый SVG (нет CLS), анимация viewBox на rAF с паузой для
// prefers-reduced-motion, подписи появляются только в зуме (без пачки текста).

import { useEffect, useRef, useState } from "react"
import type { RefRegion } from "@/lib/calc/types"
import { useReducedMotion } from "@/hooks/use-in-view"
import { trackGoal } from "@/lib/analytics"

// ===== География 32 регионов справочника: [долгота, широта], короткая подпись =====
const GEO: Record<string, { lon: number; lat: number; label: string }> = {
  moskva: { lon: 37.62, lat: 55.75, label: "Москва" },
  spb: { lon: 30.34, lat: 59.94, label: "СПб" },
  kaliningrad: { lon: 20.51, lat: 54.71, label: "Калининград" },
  arkhangelsk: { lon: 40.54, lat: 64.54, label: "Архангельск" },
  vologda: { lon: 39.89, lat: 59.22, label: "Вологда" },
  murmansk: { lon: 33.08, lat: 68.97, label: "Мурманск" },
  voronezh: { lon: 39.2, lat: 51.67, label: "Воронеж" },
  belgorod: { lon: 36.59, lat: 50.6, label: "Белгород" },
  "nizhny-novgorod": { lon: 44.0, lat: 56.33, label: "Н.Новгород" },
  samara: { lon: 50.11, lat: 53.2, label: "Самара" },
  kazan: { lon: 49.11, lat: 55.79, label: "Казань" },
  ufa: { lon: 55.94, lat: 54.74, label: "Уфа" },
  saratov: { lon: 46.03, lat: 51.53, label: "Саратов" },
  perm: { lon: 56.25, lat: 58.01, label: "Пермь" },
  krasnodar: { lon: 38.98, lat: 45.04, label: "Краснодар" },
  sochi: { lon: 39.73, lat: 43.6, label: "Сочи" },
  rostov: { lon: 39.72, lat: 47.23, label: "Ростов" },
  volgograd: { lon: 44.52, lat: 48.71, label: "Волгоград" },
  crimea: { lon: 34.1, lat: 44.95, label: "Крым" },
  stavropol: { lon: 41.97, lat: 45.04, label: "Ставрополь" },
  grozny: { lon: 45.69, lat: 43.31, label: "Грозный" },
  ekaterinburg: { lon: 60.6, lat: 56.84, label: "Екатеринбург" },
  chelyabinsk: { lon: 61.4, lat: 55.16, label: "Челябинск" },
  tyumen: { lon: 65.53, lat: 57.15, label: "Тюмень" },
  yamal: { lon: 68.0, lat: 66.53, label: "ЯНАО" },
  novosibirsk: { lon: 82.92, lat: 55.03, label: "Новосибирск" },
  krasnoyarsk: { lon: 92.87, lat: 56.01, label: "Красноярск" },
  irkutsk: { lon: 104.28, lat: 52.28, label: "Иркутск" },
  yakutsk: { lon: 129.73, lat: 62.03, label: "Якутск" },
  vladivostok: { lon: 131.89, lat: 43.12, label: "Владивосток" },
  khabarovsk: { lon: 135.08, lat: 48.48, label: "Хабаровск" },
  kamchatka: { lon: 158.65, lat: 53.02, label: "Камчатка" },
}

// Центры округов (для подписей)
const OKRUG_CENTER: Record<string, [number, number]> = {
  ЦФО: [38.5, 55.6],
  СЗФО: [44, 62.5],
  ЮФО: [43, 46.5],
  СКФО: [44.3, 43.9],
  ПФО: [50.5, 55],
  УФО: [63, 60],
  СФО: [88, 55.5],
  ДФО: [135, 58],
}

// ===== Упрощённый силуэт России (схема, ~90 опорных точек [долгота, широта]) =====
const OUTLINE: [number, number][] = [
  [28.0, 59.9], [29.7, 60.3], [30.4, 62.3], [29.4, 64.3], [30.4, 66.3], [29.2, 68.4], [28.9, 69.3],
  [31.1, 69.75], [34.8, 69.7], [38.3, 69.0], [41.2, 68.3],
  [40.2, 66.6], [36.8, 66.4], [34.2, 66.1], [36.4, 64.6], [40.2, 64.3], [43.4, 65.3],
  [44.4, 66.3], [43.4, 68.4], [45.6, 68.5], [47.2, 68.1], [52.2, 68.3], [54.2, 69.0], [57.6, 68.7], [60.6, 69.5],
  [64.2, 69.0], [66.6, 69.4], [67.4, 70.9], [69.6, 72.6], [72.6, 72.7], [73.6, 71.0], [71.6, 69.6],
  [73.4, 68.8], [75.6, 70.2], [78.2, 71.2], [79.6, 72.7], [80.6, 71.7], [82.2, 70.8],
  [84.2, 71.8], [86.8, 73.1], [90.0, 74.0], [95.2, 75.3], [100.4, 76.5], [104.3, 77.65],
  [108.2, 76.0], [110.8, 74.6], [114.2, 73.8], [120.2, 73.4], [124.2, 73.1], [127.6, 73.2],
  [130.2, 71.6], [135.2, 71.2], [140.2, 71.4], [145.2, 70.6], [150.2, 70.1], [155.2, 69.8],
  [162.2, 69.8], [169.2, 69.9], [175.4, 69.4], [180.2, 68.7], [185.2, 67.4], [190.3, 66.05],
  [188.4, 64.6], [185.8, 63.3], [182.0, 64.4], [179.4, 63.4], [175.0, 62.0], [172.0, 61.0],
  [168.4, 60.4], [164.8, 59.1], [162.6, 56.6], [161.5, 54.5], [160.2, 52.5], [156.75, 50.9],
  [155.8, 52.4], [155.5, 54.5], [156.3, 56.8], [157.0, 58.6],
  [159.6, 60.0], [158.2, 61.4], [155.0, 60.0], [152.2, 59.4], [149.6, 58.9], [147.0, 59.4], [143.2, 59.1],
  [138.6, 58.4], [136.7, 55.0], [137.2, 54.0], [141.6, 53.0],
  [140.9, 51.0], [139.0, 49.0], [137.6, 49.5], [135.6, 47.5], [134.0, 46.4], [132.2, 45.0], [131.9, 43.4], [130.6, 42.6],
  [130.5, 42.3], [128.6, 42.5], [128.2, 45.5], [131.2, 47.6], [133.6, 48.3], [134.6, 48.4], [135.6, 48.6], [134.6, 49.6], [133.2, 49.6], [132.6, 50.4], [131.2, 51.6],
  [128.2, 52.1], [127.2, 53.6], [124.6, 53.3], [121.2, 53.3], [119.2, 51.5], [117.6, 49.6], [115.0, 49.9], [112.0, 49.8], [108.6, 49.6], [104.0, 50.2], [101.0, 50.4], [98.0, 50.5],
  [96.6, 50.2], [94.6, 50.6], [91.0, 50.2], [89.6, 49.5],
  [85.0, 50.5], [82.6, 51.0], [80.6, 51.1], [79.0, 52.6], [76.0, 54.1], [73.6, 54.3], [70.6, 55.1], [69.2, 55.4],
  [68.0, 55.4], [66.6, 54.8], [65.0, 54.2], [62.0, 54.2], [61.0, 53.3], [58.6, 51.3],
  [55.0, 50.5], [52.2, 51.3], [49.0, 51.1], [47.2, 50.2], [48.6, 46.4], [47.2, 45.5],
  [46.6, 43.9], [46.9, 43.0], [46.0, 42.4], [44.0, 42.3], [42.0, 42.7], [40.5, 43.3],
  [39.5, 43.5], [38.2, 44.4], [37.8, 44.75], [36.6, 45.35],
  [37.5, 45.5], [38.4, 46.7], [39.2, 47.25], [38.2, 47.35], [37.4, 47.1], [35.4, 47.9], [35.3, 50.1],
  [33.4, 51.3], [32.4, 52.1], [31.6, 53.1], [31.2, 53.9], [30.5, 54.8], [29.2, 55.8], [27.8, 56.4], [27.0, 57.0], [27.4, 58.4], [28.15, 59.35],
]

const ISLANDS: [number, number][][] = [
  // Калининградский эксклав
  [[19.9, 54.35], [20.5, 55.05], [22.6, 55.15], [22.8, 54.75], [22.0, 54.35], [21.0, 54.25]],
  // Крым (мост — пунктиром ниже)
  [[33.6, 44.4], [34.8, 44.6], [36.4, 45.05], [36.6, 45.35], [35.9, 46.08], [34.6, 46.15], [33.4, 45.6], [32.5, 45.35], [33.05, 44.95]],
  // Сахалин
  [[142.1, 46.1], [143.3, 49.4], [141.9, 52.3], [142.1, 54.0], [143.3, 54.4], [143.9, 53.1], [141.8, 50.2], [141.5, 46.8]],
  // Новая Земля
  [[53.4, 70.7], [55.4, 71.9], [57.8, 73.3], [63.2, 75.0], [66.6, 76.2], [65.6, 75.4], [61.0, 74.0], [56.4, 71.9], [53.9, 70.7]],
]

// ===== Проекция: линейная, «псевдо-проекция» (х = долгота, y = широта) =====
const PX = (lon: number) => (lon - 18) * 5.3
const PY = (lat: number) => (78.8 - lat) * 7.4
const FULL_VB = { x: -8, y: -8, w: 937, h: 296 }

const toPath = (pts: [number, number][]) =>
  pts.map((p, i) => `${i === 0 ? "M" : "L"}${PX(p[0]).toFixed(1)} ${PY(p[1]).toFixed(1)}`).join(" ") + " Z"

// Шкала PSH (среднегодовой, ч/сут): петроль → светлый → янтарь (солнечный юг)
const BUCKETS: { max: number; color: string; label: string }[] = [
  { max: 2.4, color: "#33566B", label: "≤ 2,4" },
  { max: 2.8, color: "#3E6E86", label: "2,4–2,8" },
  { max: 3.2, color: "#5C93A8", label: "2,8–3,2" },
  { max: 3.6, color: "#9CB3BD", label: "3,2–3,6" },
  { max: Infinity, color: "#E8940A", label: "> 3,6" },
]
const bucketColor = (avg: number) => BUCKETS.find((b) => avg <= b.max)?.color ?? BUCKETS[0].color

const pshAvg = (r: RefRegion) => r.psh.reduce((a, b) => a + b, 0) / 12

interface Tip {
  code: string
  x: number
  y: number
  wrapW: number
}

export function RfMap({
  regions,
  selectedCode,
  onSelect,
  okrug,
}: {
  regions: RefRegion[]
  selectedCode: string | null
  onSelect: (code: string) => void
  okrug: string
}) {
  const wrapRef = useRef<HTMLDivElement | null>(null)
  const svgRef = useRef<SVGSVGElement | null>(null)
  const rafRef = useRef(0)
  const reduced = useReducedMotion()
  const [tip, setTip] = useState<Tip | null>(null)
  const [zoomed, setZoomed] = useState(false)

  // Зум по округу: плавная анимация viewBox (rAF), reduced-motion — мгновенно
  useEffect(() => {
    const svg = svgRef.current
    if (!svg) return
    const pts =
      okrug === "Все"
        ? []
        : regions
            .filter((r) => r.federalOkrug === okrug)
            .map((r) => GEO[r.code])
            .filter(Boolean)
    let target = FULL_VB
    if (pts.length > 0) {
      const xs = pts.map((p) => PX(p.lon))
      const ys = pts.map((p) => PY(p.lat))
      const pad = 55
      const x0 = Math.min(...xs) - pad
      const y0 = Math.min(...ys) - pad
      const w = Math.max(...xs) - Math.min(...xs) + pad * 2
      const h = Math.max(...ys) - Math.min(...ys) + pad * 2
      target = { x: x0, y: y0, w, h }
    }
    const from = svg.viewBox.baseVal
    const start = { x: from.x, y: from.y, w: from.width, h: from.height }
    cancelAnimationFrame(rafRef.current)
    if (reduced) {
      svg.setAttribute("viewBox", `${target.x} ${target.y} ${target.w} ${target.h}`)
    } else {
      const t0 = performance.now()
      const dur = 320
      const step = (now: number) => {
        const k = Math.min(1, (now - t0) / dur)
        const e = 1 - Math.pow(1 - k, 3)
        const cur = {
          x: start.x + (target.x - start.x) * e,
          y: start.y + (target.y - start.y) * e,
          w: start.w + (target.w - start.w) * e,
          h: start.h + (target.h - start.h) * e,
        }
        svg.setAttribute("viewBox", `${cur.x} ${cur.y} ${cur.w} ${cur.h}`)
        if (k < 1) rafRef.current = requestAnimationFrame(step)
      }
      rafRef.current = requestAnimationFrame(step)
    }
    const rafState = requestAnimationFrame(() => setZoomed(okrug !== "Все"))
    return () => {
      cancelAnimationFrame(rafRef.current)
      cancelAnimationFrame(rafState)
    }
  }, [okrug, regions, reduced])

  const outlinePath = toPath(OUTLINE)
  const tipRegion = tip ? regions.find((r) => r.code === tip.code) : null

  const enterMarker = (e: React.MouseEvent, code: string) => {
    const wrap = wrapRef.current
    if (!wrap) return
    const wr = wrap.getBoundingClientRect()
    const tr = (e.currentTarget as SVGElement).getBoundingClientRect()
    setTip({ code, x: tr.left + tr.width / 2 - wr.left, y: tr.top - wr.top, wrapW: wr.width })
  }

  return (
    <div ref={wrapRef} className="relative">
      {/* Скролл на узких экранах: карта двигается пальцем */}
      <div className="overflow-x-auto">
        <div className="min-w-[660px]">
          <svg
            ref={svgRef}
            viewBox={`${FULL_VB.x} ${FULL_VB.y} ${FULL_VB.w} ${FULL_VB.h}`}
            className="block w-full"
            style={{ height: "auto" }}
            role="img"
            aria-label="Карта России с 32 регионами справочника: цвет маркера — солнечный ресурс"
          >
            {/* Силуэт страны */}
            <path
              d={outlinePath}
              fill="rgba(20,101,123,0.07)"
              stroke="#14657B"
              strokeWidth={1.6}
              strokeLinejoin="round"
            />
            {ISLANDS.map((isl, i) => (
              <path
                key={i}
                d={toPath(isl)}
                fill="rgba(20,101,123,0.07)"
                stroke="#14657B"
                strokeWidth={1.5}
                strokeLinejoin="round"
              />
            ))}
            {/* Крымский мост (пунктир) */}
            <line
              x1={PX(36.6)} y1={PY(45.35)} x2={PX(36.6)} y2={PY(46.1)}
              stroke="#14657B" strokeWidth={1} strokeDasharray="3 3" opacity={0.6}
            />

            {/* Подписи округов */}
            {Object.entries(OKRUG_CENTER).map(([name, [lon, lat]]) => (
              <text
                key={name}
                x={PX(lon)}
                y={PY(lat)}
                textAnchor="middle"
                className="svg-mono"
                fontSize={10}
                letterSpacing={2.5}
                fill="#14657B"
                opacity={okrug === "Все" ? 0.5 : name === okrug ? 0.85 : 0.12}
              >
                {name}
              </text>
            ))}

            {/* Маркеры регионов */}
            {regions.map((r) => {
              const g = GEO[r.code]
              if (!g) return null
              const sel = selectedCode === r.code
              const dimmed = okrug !== "Все" && r.federalOkrug !== okrug
              const color = bucketColor(pshAvg(r))
              return (
                <g
                  key={r.code}
                  transform={`translate(${PX(g.lon).toFixed(1)} ${PY(g.lat).toFixed(1)})`}
                  opacity={dimmed ? 0.18 : 1}
                  style={{ cursor: "pointer" }}
                  onMouseEnter={(e) => enterMarker(e, r.code)}
                  onMouseLeave={() => setTip(null)}
                  onClick={() => {
                    onSelect(r.code)
                    trackGoal("region_map_interact", { region: r.code })
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault()
                      onSelect(r.code)
                      trackGoal("region_map_interact", { region: r.code })
                    }
                  }}
                >
                  {/* зона касания — крупнее маркера */}
                  <circle r={16} fill="transparent" />
                  <circle
                    r={sel ? 11 : 8.5}
                    fill={color}
                    stroke="#FAF8F3"
                    strokeWidth={1.8}
                    tabIndex={0}
                    role="button"
                    aria-label={`${r.name}: PSH ${pshAvg(r).toFixed(1)} ч/сут, тариф ${r.tariffFlat} ₽`}
                  />
                  {sel && (
                    <circle r={15.5} fill="none" stroke={color} strokeWidth={1.3} opacity={0.6} />
                  )}
                  {zoomed && !dimmed && (
                    <text
                      x={14}
                      y={4}
                      fontSize={10}
                      className="svg-mono"
                      fill="#22272E"
                      stroke="#FAF8F3"
                      strokeWidth={3}
                      paintOrder="stroke"
                      style={{ pointerEvents: "none" }}
                    >
                      {g.label}
                    </text>
                  )}
                </g>
              )
            })}
          </svg>
        </div>
      </div>

      {/* HTML-тултип поверх SVG (не масштабируется вместе с viewBox) */}
      {tipRegion && tip && (
        <div
          className="pointer-events-none absolute z-10 w-52 rounded-xl border border-border bg-card/95 p-3 shadow-lg backdrop-blur-sm"
          style={{
            left: Math.min(Math.max(tip.x, 108), Math.max(108, tip.wrapW - 108)),
            top: Math.max(tip.y, 92),
            transform: "translate(-50%, -100%)",
          }}
          role="status"
        >
          <p className="text-xs font-semibold leading-snug">{tipRegion.name}</p>
          <p className="mt-1 text-[11px] text-muted-foreground">
            {tipRegion.federalOkrug} · PSH {pshAvg(tipRegion).toFixed(1)} ч/сут ·{" "}
            {Math.min(...tipRegion.psh).toFixed(1)}…{Math.max(...tipRegion.psh).toFixed(1)}
          </p>
          <p className="text-[11px] text-muted-foreground">
            Тариф {tipRegion.tariffFlat} ₽ · снег {tipRegion.snowRegion} / ветер {tipRegion.windRegion}
          </p>
          <p className="mt-1 text-[10px] text-primary">клик — карточка региона ↓</p>
        </div>
      )}

      {/* Чертёжные подписи-углы */}
      <div className="svg-mono pointer-events-none absolute left-3 top-2.5 text-[10px] leading-relaxed text-muted-foreground">
        СХЕМА РАЗМЕЩЕНИЯ · {regions.length} РЕГИОНОВ
        <br />
        <span className="text-[9px]">ПСЕВДО-ПРОЕКЦИЯ · ГЕОМЕТРИЯ УПРОЩЁННАЯ</span>
      </div>
      <div className="svg-mono pointer-events-none absolute right-3 bottom-2.5 text-right text-[9.5px] text-muted-foreground">
        МАРКЕР = РЕГИОН · ЦВЕТ = СОЛНЕЧНЫЙ РЕСУРС
      </div>
    </div>
  )
}

export function RfMapLegend() {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
      <span className="svg-mono text-[10px] uppercase tracking-wider text-muted-foreground">
        PSH, ч/сут (среднегод.)
      </span>
      {BUCKETS.map((b) => (
        <span key={b.label} className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: b.color }} />
          {b.label}
        </span>
      ))}
    </div>
  )
}
