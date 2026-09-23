import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { cached } from "@/lib/api-cache";

export async function GET() {
  try {
    const data = await cached("types", compute);
    return NextResponse.json(data);
  } catch (e) {
    console.error("types error", e);
    return NextResponse.json({ error: "Не удалось загрузить виды ВИЭ" }, { status: 500 });
  }
}

async function compute() {
  const [types, yearly, projects] = await Promise.all([
    db.energyType.findMany(),
    db.yearlyStat.findMany({ orderBy: { year: "asc" } }),
    db.project.findMany({ include: { region: true } }),
  ]);

  const latestYear = Math.max(...yearly.map((y) => y.year));

  const items = types
    .sort((a, b) => {
      const capA = yearly.find((y) => y.year === latestYear && y.energyTypeId === a.id)?.capacityMW ?? 0;
      const capB = yearly.find((y) => y.year === latestYear && y.energyTypeId === b.id)?.capacityMW ?? 0;
      return capB - capA;
    })
    .map((t) => {
      const stats = yearly.filter((y) => y.energyTypeId === t.id);
      const latest = stats.find((y) => y.year === latestYear);
      const prev = stats.find((y) => y.year === latestYear - 1);
      const series = stats.map((y) => ({ year: y.year, capacityMW: y.capacityMW, generationTWh: y.generationTWh }));
      const typeProjects = projects.filter((p) => p.energyTypeId === t.id);
      return {
        id: t.id,
        name: t.name,
        shortName: t.shortName,
        description: t.description,
        color: t.color,
        cim: t.cim,
        capacityMW: latest?.capacityMW ?? 0,
        generationTWh: latest?.generationTWh ?? 0,
        growthPercent: prev?.capacityMW ? (((latest?.capacityMW ?? 0) - prev.capacityMW) / prev.capacityMW) * 100 : 0,
        firstYear: series.find((s) => s.capacityMW > 0)?.year ?? null,
        series,
        projectsCount: typeProjects.length,
        operatingMW: typeProjects.filter((p) => p.status === "operating").reduce((s, p) => s + p.capacityMW, 0),
        topProjects: typeProjects
          .sort((a, b) => b.capacityMW - a.capacityMW)
          .slice(0, 3)
          .map((p) => ({
            id: p.id,
            name: p.name,
            region: p.region.name,
            capacityMW: p.capacityMW,
            status: p.status,
            year: p.yearCommissioned ?? p.yearPlanned ?? null,
          })),
      };
    });

  return { latestYear, items };
}
