"use client"

// Интерактивная карта РФ (замена «стены регионов»): настоящий силуэт страны
// (Natural Earth 50m, сшивка Чукотки по антимеридиану) в проекции Альберса —
// пропорции как на школьных картах, без «растянутой полосы». 32 маркера-города,
// цвет = среднегодовой PSH (петроль → янтарь: солнечный юг — акцент П1).
// Подписи: 16 крупных городов — всегда, остальные — в зуме округа и по ховеру
// (тултип). Клик — карточка региона; выбор округа — плавный зум viewBox.
//
// CWV: чистый SVG (нет CLS), анимация viewBox на rAF, reduced-motion — мгновенно.

import { useEffect, useRef, useState } from "react"
import type { RefRegion } from "@/lib/calc/types"
import { useReducedMotion } from "@/hooks/use-in-view"
import { trackGoal } from "@/lib/analytics"

// ===== Проекция Альберса (равновеликая коническая, стандартные параллели 52/64) =====
const D2R = Math.PI / 180
const PHI1 = 52 * D2R
const PHI2 = 64 * D2R
const LON0 = 100 * D2R
const LAT0 = 60 * D2R
const N_CONE = (Math.sin(PHI1) + Math.sin(PHI2)) / 2
const C_CONE = Math.cos(PHI1) ** 2 + 2 * N_CONE * Math.sin(PHI1)
const RHO0 = Math.sqrt(C_CONE - 2 * N_CONE * Math.sin(LAT0)) / N_CONE

function project(lon: number, lat: number): [number, number] {
  const phi = lat * D2R
  const rho = Math.sqrt(Math.max(0, C_CONE - 2 * N_CONE * Math.sin(phi))) / N_CONE
  const th = N_CONE * (lon * D2R - LON0)
  return [rho * Math.sin(th), RHO0 - rho * Math.cos(th)]
}

// Масштаб: сырые единицы → пиксели SVG
const K = 730
const PRJ = (lon: number, lat: number) => {
  const [x, y] = project(lon, lat)
  return [x * K, -y * K] as [number, number] // y вниз в SVG
}

// ===== Силуэт РФ: Natural Earth 50m (публичный домен) + сшивка Чукотки по 180°,
// упрощение Дугласа-Пекера. lon > 180 — за антимеридианом (непрерывная развёртка) =====
const OUTLINE: [number, number][] = [
  [130.69,42.30], [130.42,42.73], [131.26,43.38], [130.98,44.84], [131.85,45.33], [133.11,45.13],
  [134.75,47.72], [134.67,48.25], [130.96,47.71], [130.55,48.86], [127.55,49.80], [126.05,52.74],
  [123.61,53.55], [120.09,52.79], [120.66,52.57], [120.68,51.97], [119.26,50.07], [117.87,49.51],
  [114.30,50.27], [110.71,49.14], [108.61,49.32], [106.71,50.31], [103.30,50.20], [102.29,50.59],
  [102.11,51.35], [98.89,52.12], [97.84,51.05], [98.25,50.30], [97.36,49.74], [94.61,50.02],
  [94.25,50.56], [92.35,50.86], [87.42,49.08], [86.68,49.78], [85.23,49.62], [83.36,50.99],
  [81.47,50.74], [80.74,51.29], [79.99,50.77], [77.86,53.27], [76.48,54.02], [76.84,54.44],
  [73.41,53.45], [73.71,54.04], [71.09,54.21], [70.74,55.31], [68.98,55.39], [65.09,54.34],
  [61.23,54.02], [60.98,53.62], [61.53,53.52], [61.20,53.29], [62.08,53.01], [61.05,52.97],
  [60.99,52.34], [60.03,51.93], [61.55,51.32], [60.94,50.70], [59.52,50.49], [57.84,51.09],
  [55.69,50.58], [54.64,51.01], [54.56,50.54], [53.34,51.48], [50.79,51.73], [48.63,50.61],
  [48.76,49.93], [47.43,50.36], [46.66,48.41], [47.29,47.74], [48.17,47.71], [48.96,46.77],
  [48.54,46.61], [49.25,46.29], [47.46,45.68], [46.72,44.56], [47.46,43.56], [47.65,43.88],
  [47.46,43.04], [48.57,41.84], [47.52,41.23], [45.66,42.52], [39.98,43.42], [36.65,45.13],
  [38.49,46.09], [37.77,46.64], [39.27,47.04], [38.20,47.32], [39.78,47.89], [40.08,49.58],
  [37.42,50.41], [35.59,50.37], [35.31,51.04], [34.21,51.26], [34.40,51.78], [33.74,52.34],
  [31.76,52.10], [31.26,53.02], [32.71,53.42], [30.80,54.78], [30.91,55.57], [28.28,56.06],
  [27.64,56.85], [27.43,58.79], [28.06,59.78], [30.17,59.96], [27.80,60.54], [31.54,62.92],
  [29.99,63.74], [30.53,64.08], [29.60,64.97], [30.09,65.79], [29.07,66.89], [29.99,67.67],
  [28.69,68.19], [28.77,68.84], [28.41,68.90], [31.98,69.95], [33.01,69.72], [32.09,69.63],
  [32.38,69.48], [33.45,69.43], [33.14,69.07], [35.86,69.19], [40.97,67.71], [41.19,66.83],
  [38.65,66.07], [31.90,67.16], [34.69,65.95], [34.41,65.40], [35.04,64.44], [37.44,63.81],
  [38.06,64.09], [36.58,64.79], [36.88,65.17], [39.76,64.58], [40.44,64.78], [39.82,65.60],
  [42.21,66.52], [44.10,66.01], [44.43,66.94], [43.78,67.25], [44.20,68.25], [43.33,68.67],
  [45.89,68.48], [46.69,67.85], [44.90,67.41], [46.49,66.80], [47.66,66.98], [47.87,67.58],
  [48.75,67.90], [52.40,68.35], [53.80,69.00], [54.49,68.99], [53.26,68.27], [59.06,69.01],
  [59.10,68.44], [59.73,68.35], [60.93,68.99], [60.17,69.59], [60.91,69.85], [64.19,69.53],
  [68.50,68.35], [69.14,68.95], [66.90,69.55], [67.28,70.74], [66.64,71.08], [68.27,71.68],
  [69.39,72.96], [71.50,72.91], [72.81,72.69], [71.87,71.46], [72.70,70.96], [72.58,68.97],
  [73.59,68.48], [71.37,66.96], [71.54,66.68], [69.01,66.79], [72.07,66.25], [74.77,67.77],
  [74.39,68.42], [75.12,68.86], [76.46,68.98], [77.24,68.47], [77.17,67.78], [78.92,67.59],
  [77.59,67.75], [78.00,68.26], [77.65,68.90], [73.78,69.20], [73.58,69.80], [74.34,70.58],
  [73.09,71.44], [74.99,72.14], [74.79,72.81], [75.60,72.58], [75.28,71.43], [75.73,71.27],
  [79.02,70.95], [76.03,71.91], [78.19,71.91], [77.41,72.11], [78.48,72.39], [83.11,71.72],
  [82.16,70.60], [83.01,70.90], [82.68,70.22], [83.08,70.09], [83.74,70.55], [83.15,71.10],
  [83.53,71.68], [80.83,72.49], [80.58,73.57], [86.89,73.89], [85.79,73.44], [86.68,73.11],
  [85.91,73.39], [87.57,73.81], [86.00,74.32], [87.23,74.36], [85.79,74.65], [87.47,75.01],
  [87.01,75.17], [94.16,75.96], [92.86,75.98], [93.26,76.10], [98.66,76.24], [99.77,76.03],
  [99.54,75.80], [99.83,76.14], [98.81,76.48], [101.60,76.44], [100.91,76.90], [104.18,77.73],
  [106.06,77.39], [104.20,77.10], [107.43,76.93], [106.41,76.51], [111.11,76.72], [113.87,75.86],
  [112.47,75.84], [113.73,75.45], [112.92,75.02], [105.14,72.78], [110.87,73.73], [109.67,73.80],
  [110.26,74.02], [113.03,73.91], [113.49,73.35], [113.13,72.83], [113.66,72.63], [113.22,72.81],
  [113.89,73.35], [113.51,73.50], [114.06,73.58], [118.45,73.59], [118.94,73.48], [118.43,73.25],
  [119.75,72.98], [122.54,72.88], [123.62,73.19], [123.42,73.64], [124.54,73.75], [129.10,73.11],
  [128.60,72.90], [129.25,72.71], [128.42,72.54], [129.28,72.09], [127.73,72.41], [131.16,70.74],
  [132.65,71.93], [133.69,71.43], [136.09,71.62], [137.94,71.13], [138.23,71.60], [139.98,71.49],
  [139.36,71.95], [140.19,72.19], [139.14,72.33], [141.08,72.59], [140.71,72.89], [144.30,72.64],
  [146.25,72.44], [144.29,72.19], [146.83,72.30], [145.08,71.71], [148.40,72.31], [150.02,71.90],
  [148.97,71.69], [150.67,71.46], [150.10,71.23], [151.15,71.37], [152.51,70.83], [159.35,70.79],
  [159.96,70.42], [159.83,69.78], [160.91,69.61], [161.34,68.91], [160.86,68.54], [162.38,69.65],
  [167.86,69.73], [169.61,68.79], [171.00,69.05], [170.16,69.63], [170.49,70.11], [175.92,69.90],
  [184.65,67.68], [185.15,67.35], [185.08,66.62], [185.93,66.23], [186.23,66.43], [185.45,67.09],
  [188.20,66.93], [190.27,66.06], [188.55,65.79], [188.83,65.50], [187.22,65.68], [187.79,65.05],
  [186.93,64.85], [187.62,64.43], [186.84,64.28], [184.56,64.82], [183.91,65.47], [181.59,65.50],
  [181.06,66.03], [181.47,66.40], [180.86,66.38], [180.22,66.02], [180.65,65.52], [179.45,64.82],
  [176.41,65.07], [177.22,64.86], [174.55,64.68], [176.06,64.90], [178.23,64.36], [178.47,63.57],
  [179.57,62.77], [179.12,62.32], [177.02,62.78], [172.86,61.47], [170.35,59.97], [169.23,60.60],
  [166.27,59.86], [166.35,60.48], [164.95,59.84], [163.74,60.03], [161.96,58.08], [163.23,57.79],
  [162.76,57.24], [163.34,56.23], [162.84,56.07], [163.04,56.52], [162.67,56.49], [162.08,56.09],
  [161.72,55.50], [162.11,54.75], [160.07,54.19], [160.03,53.13], [158.47,53.03], [158.10,51.81],
  [156.75,50.97], [155.56,55.20], [155.98,56.70], [156.85,57.29], [156.83,57.78], [158.28,58.01],
  [162.07,60.47], [163.71,60.92], [164.21,62.29], [165.40,62.49], [163.33,62.55], [163.09,61.57],
  [160.17,60.64], [160.38,61.03], [159.79,60.96], [160.31,61.89], [157.08,61.68], [154.29,59.83],
  [154.15,59.53], [155.16,59.19], [151.33,58.88], [152.26,59.22], [149.64,59.77], [148.73,59.26],
  [142.33,59.15], [135.21,54.84], [136.80,54.62], [136.80,53.78], [137.67,54.28], [137.34,54.10],
  [137.83,53.95], [137.25,53.55], [138.53,53.96], [138.45,53.54], [138.66,54.30], [139.71,54.28],
  [141.37,53.29], [140.84,53.09], [141.49,52.18], [140.52,50.80], [140.11,48.42], [135.13,43.53],
  [133.16,42.70], [131.94,43.30], [130.73,42.33],
]

const ISLANDS: [number, number][][] = [
  // Калининград
  [
  [20.96,55.28], [20.59,54.98], [21.19,54.94], [21.24,55.26], [21.39,55.28],
  [22.07,55.06], [22.57,55.06], [22.82,54.87], [22.68,54.56], [22.77,54.36],
  [19.60,54.46], [19.86,54.63], [19.97,54.92], [20.52,54.99], [20.90,55.29],
  ],
  // Крым
  [
  [33.59,46.10], [33.66,46.22], [33.81,46.21], [34.35,46.06], [34.45,45.97],
  [34.69,45.98], [34.80,45.79], [35.00,45.73], [35.46,45.32], [36.01,45.37],
  [36.17,45.45], [36.58,45.39], [36.39,45.07], [35.87,45.01], [35.68,45.10],
  [35.47,45.10], [35.09,44.80], [34.72,44.81], [34.47,44.72], [34.07,44.42],
  [33.76,44.40], [33.45,44.55], [33.61,44.91], [33.56,45.10], [32.92,45.35],
  [32.61,45.33], [32.51,45.40], [33.66,45.95], [33.64,46.03],
  ],
  // Сахалин
  [
  [142.76,54.39], [143.32,52.96], [143.19,51.94], [143.82,50.28], [144.71,48.64],
  [144.05,49.25], [143.10,49.20], [142.56,47.74], [143.22,46.79], [143.49,46.75],
  [143.58,46.36], [143.43,46.03], [143.28,46.56], [142.58,46.70], [142.08,45.92],
  [141.83,46.45], [142.04,47.14], [141.96,47.59], [142.18,48.01], [141.87,48.75],
  [142.14,49.57], [142.07,50.63], [142.21,51.22], [141.72,51.74], [141.66,52.27],
  [141.86,52.79], [141.82,53.34], [142.53,53.45], [142.71,53.90], [142.33,54.28],
  [142.69,54.42],
  ],
  // Новая Земля
  [
  [67.77,76.24], [61.36,75.31], [59.67,74.61], [58.53,74.50], [58.62,74.23],
  [57.77,74.01], [57.76,73.77], [57.31,73.84], [57.54,73.66], [56.63,73.30],
  [54.30,73.35], [53.76,73.77], [54.64,73.96], [55.34,74.42], [56.14,74.50],
  [55.58,74.63], [56.50,74.96], [55.92,75.17], [56.57,75.10], [56.84,75.35],
  [57.61,75.34], [58.06,75.66], [60.94,76.07], [61.20,76.28], [64.46,76.38],
  [67.53,77.01], [68.91,76.76], [68.90,76.57], [68.17,76.28],
  ],
]

// ===== Города 32 регионов: [lon, lat], подпись, крупный ли (приоритет) =====
interface GeoCity {
  lon: number
  lat: number
  label: string
  major?: boolean
  /** предпочитаемая позиция подписи (первый кандидат; остальное подберёт алгоритм) */
  lx?: number
  ly?: number
  anchor?: "start" | "end" | "middle"
}
const GEO: Record<string, GeoCity> = {
  moskva: { lon: 37.62, lat: 55.75, label: "Москва", major: true, lx: -12, anchor: "end" },
  spb: { lon: 30.34, lat: 59.94, label: "СПб", major: true, lx: -12, anchor: "end" },
  kaliningrad: { lon: 20.51, lat: 54.71, label: "Калининград", lx: 8, ly: 14 },
  arkhangelsk: { lon: 40.54, lat: 64.54, label: "Архангельск" },
  vologda: { lon: 39.89, lat: 59.22, label: "Вологда" },
  murmansk: { lon: 33.08, lat: 68.97, label: "Мурманск", major: true, ly: -8 },
  voronezh: { lon: 39.2, lat: 51.67, label: "Воронеж" },
  belgorod: { lon: 36.59, lat: 50.6, label: "Белгород", lx: -10, anchor: "end" },
  "nizhny-novgorod": { lon: 44.0, lat: 56.33, label: "Н.Новгород" },
  samara: { lon: 50.11, lat: 53.2, label: "Самара", major: true, ly: 12 },
  kazan: { lon: 49.11, lat: 55.79, label: "Казань", major: true, ly: 12 },
  ufa: { lon: 55.94, lat: 54.74, label: "Уфа", ly: 16 },
  saratov: { lon: 46.03, lat: 51.53, label: "Саратов", ly: 12 },
  perm: { lon: 56.25, lat: 58.01, label: "Пермь", ly: 12 },
  krasnodar: { lon: 38.98, lat: 45.04, label: "Краснодар", major: true, lx: -10, anchor: "end", ly: 16 },
  sochi: { lon: 39.73, lat: 43.6, label: "Сочи", lx: -10, anchor: "end" },
  rostov: { lon: 39.72, lat: 47.23, label: "Ростов", major: true, lx: -10, anchor: "end", ly: -14 },
  volgograd: { lon: 44.52, lat: 48.71, label: "Волгоград", major: true },
  crimea: { lon: 34.1, lat: 44.95, label: "Крым", lx: -10, anchor: "end" },
  stavropol: { lon: 41.97, lat: 45.04, label: "Ставрополь", ly: -8 },
  grozny: { lon: 45.69, lat: 43.31, label: "Грозный", ly: 12 },
  ekaterinburg: { lon: 60.6, lat: 56.84, label: "Екатеринбург", major: true, lx: -10, anchor: "end", ly: 12 },
  chelyabinsk: { lon: 61.4, lat: 55.16, label: "Челябинск", ly: 12 },
  tyumen: { lon: 65.53, lat: 57.15, label: "Тюмень", ly: -8 },
  yamal: { lon: 68.0, lat: 66.53, label: "Салехард", lx: -10, anchor: "end" },
  novosibirsk: { lon: 82.92, lat: 55.03, label: "Новосибирск", major: true, ly: -10 },
  krasnoyarsk: { lon: 92.87, lat: 56.01, label: "Красноярск", major: true },
  irkutsk: { lon: 104.28, lat: 52.28, label: "Иркутск", major: true },
  yakutsk: { lon: 129.73, lat: 62.03, label: "Якутск", major: true },
  vladivostok: { lon: 131.89, lat: 43.12, label: "Владивосток", major: true, lx: -12, anchor: "end", ly: 12 },
  khabarovsk: { lon: 135.08, lat: 48.48, label: "Хабаровск", major: true, lx: -12, anchor: "end" },
  kamchatka: { lon: 158.65, lat: 53.02, label: "Петропавловск", major: true, lx: -12, anchor: "end" },
}

// Центры округов (подписи, приглушаются вне зума) — на «пустых» местах
const OKRUG_CENTER: Record<string, [number, number]> = {
  ЦФО: [35.5, 58.6],
  СЗФО: [46, 63.8],
  ЮФО: [46.5, 46.2],
  СКФО: [49.5, 43.3],
  ПФО: [51.5, 57.8],
  УФО: [64.5, 61.2],
  СФО: [88, 56.5],
  ДФО: [135, 57.5],
}

// ===== Жадное размещение подписей: без наложений на маркеры и другие подписи =====
// У каждого города — последовательность кандидатных позиций (право → лево →
// диагонали → над/под); берём первую, не конфликтующую с уже поставленными
// подписями и маркерами. Приоритет: выбранный → крупные → остальные.
// Не поместившаяся подпись не рисуется (имя покажет тултип при наведении).
const CHAR_W = 0.66
const labelBBox = (g: GeoCity, mx: number, my: number, fs: number, lx: number, ly: number, anchor: "start" | "end" | "middle") => {
  const w = g.label.length * fs * CHAR_W + 3
  const h = fs * 1.15
  const x0 = anchor === "end" ? mx + lx - w : anchor === "middle" ? mx + lx - w / 2 : mx + lx
  return { x: x0, y: my + ly - h * 0.75, w, h }
}
const intersects = (
  a: { x: number; y: number; w: number; h: number },
  b: { x: number; y: number; w: number; h: number },
) => !(a.x + a.w < b.x || b.x + b.w < a.x || a.y + a.h < b.y || b.y + b.h < a.y)

type Pos = [number, number, "start" | "end" | "middle"]
// [dx, dy, anchor] — кастомная позиция города (если задана), затем стандартные
const FALLBACKS: Pos[] = [
  [13, 3.5, "start"],
  [-13, 3.5, "end"],
  [13, 12, "start"],
  [13, -10, "start"],
  [-13, 12, "end"],
  [-13, -10, "end"],
  [0, -14, "middle"],
  [0, 22, "middle"],
  [13, 22, "start"],
  [-13, 22, "end"],
]

function placeLabels(regions: RefRegion[], selectedCode: string | null, zoomed: boolean) {
  // При зуме viewBox сжимается ~4–5×, поэтому шрифт в единицах карты уменьшаем:
  // визуальный размер подписей остаётся ~28–35 px, а наложений становится меньше
  const fs = zoomed ? 7 : 9.5
  const obstacles: { x: number; y: number; w: number; h: number }[] = []
  const marks: { code: string; g: GeoCity; mx: number; my: number }[] = []
  regions.forEach((r) => {
    const g = GEO[r.code]
    if (!g) return
    const [mx, my] = PRJ(g.lon, g.lat)
    marks.push({ code: r.code, g, mx, my })
    const rr = (selectedCode === r.code ? 13 : 10) * (zoomed ? 0.9 : 1)
    obstacles.push({ x: mx - rr, y: my - rr, w: rr * 2, h: rr * 2 })
  })
  const order = marks.slice().sort((a, b) => {
    const pri = (m: { code: string; g: GeoCity }) =>
      selectedCode === m.code ? 0 : m.g.major ? 1 : 2
    return pri(a) - pri(b) || a.g.lat - b.g.lat
  })
  const placed = new Map<string, { x: number; y: number; w: number; h: number }>()
  for (const m of order) {
    if (!zoomed && !m.g.major && selectedCode !== m.code) continue
    const custom: Pos[] =
      m.g.lx !== undefined || m.g.ly !== undefined || m.g.anchor
        ? [[m.g.lx ?? 13, m.g.ly ?? 3.5, m.g.anchor ?? "start"]]
        : []
    let done = false
    for (const [lx, ly, anchor] of [...custom, ...FALLBACKS]) {
      const bb = labelBBox(m.g, m.mx, m.my, fs, lx, ly, anchor)
      // подпись не должна выходить за карту
      if (bb.x < FULL_VB.x + 4 || bb.x + bb.w > FULL_VB.x + FULL_VB.w - 4) continue
      if (obstacles.some((o) => intersects(bb, o))) continue
      obstacles.push(bb)
      placed.set(m.code, bb)
      done = true
      break
    }
    if (!done) continue
  }
  return placed
}

const toPath = (pts: [number, number][]) =>
  pts.map((p, i) => `${i === 0 ? "M" : "L"}${PRJ(p[0], p[1]).map((v) => v.toFixed(1)).join(" ")}`).join(" ") + " Z"

// viewBox по всем точкам (силуэт + острова + маркеры) с полем под подписи краёв
const ALL_PTS: [number, number][] = [...OUTLINE, ...ISLANDS.flat()]
Object.values(GEO).forEach((g) => ALL_PTS.push([g.lon, g.lat]))
const XS = ALL_PTS.map((p) => PRJ(p[0], p[1])[0])
const YS = ALL_PTS.map((p) => PRJ(p[0], p[1])[1])
const PAD = 26
const FULL_VB = {
  x: Math.min(...XS) - PAD,
  y: Math.min(...YS) - PAD,
  w: Math.max(...XS) - Math.min(...XS) + PAD * 2,
  h: Math.max(...YS) - Math.min(...YS) + PAD * 2,
}

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
            .map((g) => PRJ(g.lon, g.lat))
    let target = FULL_VB
    if (pts.length > 0) {
      const pad = 60
      const x0 = Math.min(...pts.map((p) => p[0])) - pad
      const y0 = Math.min(...pts.map((p) => p[1])) - pad
      const w = Math.max(...pts.map((p) => p[0])) - Math.min(...pts.map((p) => p[0])) + pad * 2
      const h = Math.max(...pts.map((p) => p[1])) - Math.min(...pts.map((p) => p[1])) + pad * 2
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
  const labels = placeLabels(regions, selectedCode, zoomed)

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
        <div className="min-w-[640px]">
          <svg
            ref={svgRef}
            viewBox={`${FULL_VB.x} ${FULL_VB.y} ${FULL_VB.w} ${FULL_VB.h}`}
            className="block w-full"
            style={{ height: "auto" }}
            role="img"
            aria-label="Карта России с 32 городами регионов справочника: цвет маркера — солнечный ресурс"
          >
            {/* Силуэт страны */}
            <path
              d={outlinePath}
              fill="rgba(20,101,123,0.07)"
              stroke="#14657B"
              style={{ strokeWidth: zoomed ? 0.45 : 1.6, transition: "stroke-width 320ms" }}
              strokeLinejoin="round"
            />
            {ISLANDS.map((isl, i) => (
              <path
                key={i}
                d={toPath(isl)}
                fill="rgba(20,101,123,0.07)"
                stroke="#14657B"
                style={{ strokeWidth: zoomed ? 0.45 : 1.5, transition: "stroke-width 320ms" }}
                strokeLinejoin="round"
              />
            ))}
            {/* Крымский мост (пунктир) */}
            {(() => {
              const a = PRJ(36.6, 46.12)
              const b = PRJ(36.6, 45.4)
              return <line x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke="#14657B" strokeWidth={1} strokeDasharray="3 3" opacity={0.6} />
            })()}

            {/* Подписи округов */}
            {Object.entries(OKRUG_CENTER).map(([name, [lon, lat]]) => {
              const [x, y] = PRJ(lon, lat)
              return (
                <text
                  key={name}
                  x={x}
                  y={y}
                  textAnchor="middle"
                  className="svg-mono"
                  fontSize={zoomed ? 4 : 11}
                  letterSpacing={zoomed ? 1 : 2.5}
                  fill="#14657B"
                  stroke="#FAF8F3"
                  strokeWidth={zoomed ? 1.5 : 2.5}
                  paintOrder="stroke"
                  opacity={okrug === "Все" ? 0.6 : name === okrug ? 0.9 : 0.1}
                >
                  {name}
                </text>
              )
            })}

            {/* Маркеры городов-регионов */}
            {regions.map((r) => {
              const g = GEO[r.code]
              if (!g) return null
              const sel = selectedCode === r.code
              const dimmed = okrug !== "Все" && r.federalOkrug !== okrug
              const color = bucketColor(pshAvg(r))
              const [mx, my] = PRJ(g.lon, g.lat)
              return (
                <g
                  key={r.code}
                  transform={`translate(${mx.toFixed(1)} ${my.toFixed(1)})`}
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
                  {/* зона касания — крупнее маркера; при зуме маркеры уменьшаются,
                      чтобы визуальный размер оставался ~12–16 px */}
                  <circle r={16} fill="transparent" style={{ transform: zoomed ? "scale(0.2)" : "scale(1)", transition: "transform 320ms" }} />
                  <circle
                    r={sel ? 11 : 8.5}
                    fill={color}
                    stroke="#FAF8F3"
                    strokeWidth={zoomed ? 0.55 : 1.8}
                    style={{ transform: zoomed ? "scale(0.2)" : "scale(1)", transition: "transform 320ms" }}
                    tabIndex={0}
                    role="button"
                    aria-label={`${r.name}: PSH ${pshAvg(r).toFixed(1)} ч/сут, тариф ${r.tariffFlat} ₽`}
                  />
                  {sel && (
                    <circle r={15.5} fill="none" stroke={color} strokeWidth={zoomed ? 0.4 : 1.3} opacity={0.6} style={{ transform: zoomed ? "scale(0.2)" : "scale(1)", transition: "transform 320ms" }} />
                  )}
                </g>
              )
            })}

            {/* Подписи городов: жадная раскладка без наложений (вне округа — скрыты) */}
            {regions.map((r) => {
              const g = GEO[r.code]
              if (!g) return null
              const bb = labels.get(r.code)
              if (!bb) return null
              const dimmed = okrug !== "Все" && r.federalOkrug !== okrug
              if (dimmed) return null
              return (
                <text
                  key={"lbl-" + r.code}
                  x={bb.x + 1.5}
                  y={bb.y + bb.h - 2}
                  fontSize={zoomed ? 7 : 9.5}
                  className="svg-mono"
                  fill="#22272E"
                  stroke="#FAF8F3"
                  strokeWidth={zoomed ? 2 : 3}
                  paintOrder="stroke"
                  style={{ pointerEvents: "none" }}
                >
                  {g.label}
                </text>
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
        СХЕМА РАЗМЕЩЕНИЯ · {regions.length} ГОРОДА РЕГИОНОВ
        <br />
        <span className="text-[9px]">ПРОЕКЦИЯ АЛЬБЕРСА · БЕРЕГ: NATURAL EARTH 50M</span>
      </div>
      <div className="svg-mono pointer-events-none absolute right-3 bottom-2.5 text-right text-[9.5px] text-muted-foreground">
        МАРКЕР = ГОРОД · ЦВЕТ = СОЛНЕЧНЫЙ РЕСУРС
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
