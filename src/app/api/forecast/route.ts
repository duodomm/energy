import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { cached } from "@/lib/api-cache";
import { WORLD_CONTEXT, REFERENCE } from "@/lib/energy";

export async function GET() {
  try {
    const data = await cached("forecast", compute);
    return NextResponse.json(data);
  } catch (e) {
    console.error("forecast error", e);
    return NextResponse.json({ error: "Не удалось загрузить прогноз" }, { status: 500 });
  }
}

async function compute() {
  const points = await db.forecastPoint.findMany({ orderBy: { year: "asc" } });

  // Фактические данные до 2025 для стыковки с прогнозом
  const yearly = await db.yearlyStat.findMany();
  const latestYear = Math.max(...yearly.map((y) => y.year));
  const actualTotal = yearly.filter((y) => y.year === latestYear).reduce((s, y) => s + y.capacityMW, 0);

  const scenarios = ["conservative", "base", "optimistic"] as const;

  const series = scenarios.map((s) => ({
    scenario: s,
    points: points
      .filter((p) => p.scenario === s)
      .map((p) => ({
        year: p.year,
        capacityMW: p.capacityMW,
        sharePercent: p.sharePercent,
        investmentBlnRub: p.investmentBlnRub,
      })),
  }));

  const assumptions = {
    conservative: {
      title: "Консервативный сценарий",
      capacity2035: "9,0 ГВт",
      color: "#94a3b8",
      text: "Продление ДПМ-2 с сокращёнными объёмами отбора, умеренный рост цен на оборудование. ВИЭ развиваются в основном за счёт уже отобранных проектов.",
    },
    base: {
      title: "Базовый сценарий",
      capacity2035: "14,0 ГВт",
      color: "#059669",
      text: "Полная реализация программы ДПМ-2 (11,8 ГВт отбора мощности на 2025–2035 гг.), плюс внепрограммные промышленные проекты и рост экспорта оборудования.",
    },
    optimistic: {
      title: "Оптимистичный сценарий",
      capacity2035: "18,8 ГВт",
      color: "#f59e0b",
      text: "Целевые ориентиры Энергостратегии-2050: ВИЭ в изолированных энергорайонах ДФО, зелёный водород, накопители энергии и корпоративные PPA-контракты.",
    },
  };

  return {
    latestYear,
    actualTotalMW: actualTotal,
    series,
    assumptions,
    world: WORLD_CONTEXT,
    reference: {
      hydroLargeGW: REFERENCE.hydroLargeGW,
      hydroSharePercent: REFERENCE.hydroSharePercent,
    },
  };
}
