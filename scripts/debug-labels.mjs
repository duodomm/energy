// Отладка placeLabels: почему подписи пропадают. Реплика логики rf-map.tsx.
const D2R = Math.PI / 180
const PHI1 = 52 * D2R, PHI2 = 64 * D2R, LON0 = 100 * D2R, LAT0 = 60 * D2R
const N_CONE = (Math.sin(PHI1) + Math.sin(PHI2)) / 2
const C_CONE = Math.cos(PHI1) ** 2 + 2 * N_CONE * Math.sin(PHI1)
const RHO0 = Math.sqrt(C_CONE - 2 * N_CONE * Math.sin(LAT0)) / N_CONE
function project(lon, lat) {
  const phi = lat * D2R
  const rho = Math.sqrt(Math.max(0, C_CONE - 2 * N_CONE * Math.sin(phi))) / N_CONE
  const th = N_CONE * (lon * D2R - LON0)
  return [rho * Math.sin(th), RHO0 - rho * Math.cos(th)]
}
const K = 730
const PRJ = (lon, lat) => { const [x, y] = project(lon, lat); return [x * K, -y * K] }

// Минимальный GEO (как в компоненте)
const GEO = {
  moskva: { lon: 37.62, lat: 55.75, label: "Москва", major: true, lx: -12, anchor: "end" },
  spb: { lon: 30.34, lat: 59.94, label: "СПб", major: true, lx: -12, anchor: "end" },
  kaliningrad: { lon: 20.51, lat: 54.71, label: "Калининград", lx: 8, ly: 14 },
  murmansk: { lon: 33.08, lat: 68.97, label: "Мурманск", major: true, ly: -8 },
  samara: { lon: 50.11, lat: 53.2, label: "Самара", major: true, ly: 12 },
  kazan: { lon: 49.11, lat: 55.79, label: "Казань", major: true, ly: 12 },
  ufa: { lon: 55.94, lat: 54.74, label: "Уфа", ly: 16 },
  krasnodar: { lon: 38.98, lat: 45.04, label: "Краснодар", major: true, lx: -10, anchor: "end", ly: 16 },
  sochi: { lon: 39.73, lat: 43.6, label: "Сочи", lx: -10, anchor: "end" },
  rostov: { lon: 39.72, lat: 47.23, label: "Ростов", major: true, lx: -10, anchor: "end", ly: -14 },
  volgograd: { lon: 44.52, lat: 48.71, label: "Волгоград", major: true },
  crimea: { lon: 34.1, lat: 44.95, label: "Крым", lx: -10, anchor: "end" },
  ekaterinburg: { lon: 60.6, lat: 56.84, label: "Екатеринбург", major: true, lx: -10, anchor: "end", ly: 12 },
  novosibirsk: { lon: 82.92, lat: 55.03, label: "Новосибирск", major: true, ly: -10 },
  krasnoyarsk: { lon: 92.87, lat: 56.01, label: "Красноярск", major: true },
  irkutsk: { lon: 104.28, lat: 52.28, label: "Иркутск", major: true },
  yakutsk: { lon: 129.73, lat: 62.03, label: "Якутск", major: true },
  vladivostok: { lon: 131.89, lat: 43.12, label: "Владивосток", major: true, lx: -12, anchor: "end", ly: 12 },
  khabarovsk: { lon: 135.08, lat: 48.48, label: "Хабаровск", major: true, lx: -12, anchor: "end" },
  kamchatka: { lon: 158.65, lat: 53.02, label: "Петропавловск", major: true, lx: -12, anchor: "end" },
}

// FULL_VB из реального SVG
const FULL_VB = { x: -547, y: -372, w: 978, h: 557 } // подставим реальные после замера

const CHAR_W = 0.66
const labelBBox = (g, mx, my, fs) => {
  const w = g.label.length * fs * CHAR_W + 3
  const h = fs * 1.15
  const x0 = g.anchor === "end" ? mx + (g.lx ?? 13) - w : mx + (g.lx ?? 13)
  return { x: x0, y: my + (g.ly ?? 3.5) - h * 0.75, w, h }
}
const inter = (a, b) => !(a.x + a.w < b.x || b.x + b.w < a.x || a.y + a.h < b.y || b.y + b.h < a.y)

const fs = 9.5
const obstacles = []
const marks = []
for (const [code, g] of Object.entries(GEO)) {
  const [mx, my] = PRJ(g.lon, g.lat)
  marks.push({ code, g, mx, my })
  const rr = 10
  obstacles.push({ x: mx - rr, y: my - rr, w: rr * 2, h: rr * 2, code })
}
const order = marks.slice().sort((a, b) => {
  const pri = (m) => (m.g.major ? 1 : 2)
  return pri(a) - pri(b) || a.g.lat - b.g.lat
})
for (const m of order) {
  if (!m.g.major) continue
  const bb = labelBBox(m.g, m.mx, m.my, fs)
  if (bb.x < FULL_VB.x + 4) { console.log(m.code, "CULL-X-LEFT", bb.x.toFixed(0), "<", (FULL_VB.x + 4).toFixed(0)); continue }
  if (bb.x + bb.w > FULL_VB.x + FULL_VB.w - 4) { console.log(m.code, "CULL-X-RIGHT"); continue }
  const hit = obstacles.find((o) => inter(bb, o))
  if (hit) { console.log(m.code, "CULL-COLLIDE with", hit.code, JSON.stringify(bb), "vs", JSON.stringify({x: hit.x, y: hit.y, w: hit.w, h: hit.h})); continue }
  obstacles.push(bb)
  console.log(m.code, "PLACED", bb.x.toFixed(0), bb.y.toFixed(0))
}
