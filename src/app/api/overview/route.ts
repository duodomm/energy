import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { cached } from "@/lib/api-cache";
import { ENERGY_TYPE_IDS, REFERENCE } from "@/lib/energy";

export async function GET() {
  try {
    const data = await cached("overview", compute);
    return NextResponse.json(data);
  } catch (e) {
    console.error("overview error", e);
    return NextResponse.json({ error: "Не удалось загрузить данные обзора" }, { status: 500 });
  }
}

async function compute() {
  const [yearly, projects] = await Promise.all([
    db.yearlyStat.findMany({ include: { energyType: true }, orderBy: { year: "asc" } }),
    db.project.findMany({ include: { region: true, energyType: true } }),
  ]);

  const latestYear = Math.max(...yearly.map((y) => y.year));
  const prevYear = latestYear - 1;

  // Динамика по годам
  const byYear = new Map<number, Record<string, number>>();
  for (const y of yearly) {
    const row =
      byYear.get(y.year) ??
      Object.fromEntries([...ENERGY_TYPE_IDS.map((t) => [t, 0]), ["total", 0], ["generationTWh", 0]]);
    row[y.energyTypeId] = y.capacityMW;
    row.total += y.capacityMW;
    row.generationTWh += y.generationTWh;
    byYear.set(y.year, row);
  }
  const dynamics = [...byYear.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([year, row]) => ({ year, ...row }));

  // Структура по видам ВИЭ на последний год
  const latestStats = yearly.filter((y) => y.year === latestYear);
  const latestTotal = latestStats.reduce((s, y) => s + y.capacityMW, 0);
  const structure = latestStats.map((y) => ({
    id: y.energyTypeId,
    name: y.energyType.name,
    color: y.energyType.color,
    capacityMW: y.capacityMW,
    generationTWh: y.generationTWh,
    sharePercent: (y.capacityMW / latestTotal) * 100,
  }));

  const prevTotal = dynamics.find((d) => d.year === prevYear)?.total ?? 0;
  const generation = latestStats.reduce((s, y) => s + y.generationTWh, 0);

  // Агрегация по регионам (каталог ключевых объектов)
  const regionAgg = new Map<
    string,
    { region: string; district: string; total: number; operating: number; pipeline: number; count: number }
  >();
  for (const p of projects) {
    const entry = regionAgg.get(p.region.name) ?? {
      region: p.region.name,
      district: p.region.federalDistrict,
      total: 0,
      operating: 0,
      pipeline: 0,
      count: 0,
    };
    entry.total += p.capacityMW;
    if (p.status === "operating") entry.operating += p.capacityMW;
    else entry.pipeline += p.capacityMW;
    entry.count += 1;
    regionAgg.set(p.region.name, entry);
  }
  const topRegions = [...regionAgg.values()]
    .sort((a, b) => b.total - a.total)
    .slice(0, 10)
    .map((r, i) => ({ ...r, rank: i + 1 }));

  const pipeline = projects.filter((p) => p.status !== "operating");
  const flagship = projects
    .filter((p) => p.isFlagship)
    .sort((a, b) => b.capacityMW - a.capacityMW)
    .map((p) => ({
      id: p.id,
      name: p.name,
      type: p.energyTypeId,
      region: p.region.name,
      capacityMW: p.capacityMW,
      status: p.status,
      year: p.yearCommissioned ?? p.yearPlanned ?? null,
      description: p.description,
    }));

  return {
    latestYear,
    kpis: {
      totalCapacityMW: latestTotal,
      capacityGrowthPercent: prevTotal ? ((latestTotal - prevTotal) / prevTotal) * 100 : 0,
      generationTWh: generation,
      sharePercent: (generation / REFERENCE.totalGenerationTWh) * 100,
      shareWithHydroPercent: REFERENCE.hydroSharePercent + (generation / REFERENCE.totalGenerationTWh) * 100,
      objectsEstimate: REFERENCE.objectsEstimate,
      catalogProjects: projects.length,
      investedBlnRub: REFERENCE.investedSince2013,
      jobsEstimate: REFERENCE.jobsEstimate,
      pipelineMW: pipeline.reduce((s, p) => s + p.capacityMW, 0),
      pipelineCount: pipeline.length,
    },
    dynamics,
    structure,
    topRegions,
    flagship,
  };
}
