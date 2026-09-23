import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { cached } from "@/lib/api-cache";

export async function GET() {
  try {
    const data = await cached("projects", compute);
    return NextResponse.json(data);
  } catch (e) {
    console.error("projects error", e);
    return NextResponse.json({ error: "Не удалось загрузить проекты" }, { status: 500 });
  }
}

async function compute() {
  const [projects, regions] = await Promise.all([
    db.project.findMany({ include: { region: true, energyType: true } }),
    db.region.findMany(),
  ]);

  const items = projects
    .sort((a, b) => b.capacityMW - a.capacityMW)
    .map((p) => ({
      id: p.id,
      name: p.name,
      type: p.energyTypeId,
      typeName: p.energyType.shortName,
      region: p.region.name,
      regionId: p.regionId,
      district: p.region.federalDistrict,
      capacityMW: p.capacityMW,
      status: p.status,
      year: p.yearCommissioned ?? p.yearPlanned ?? null,
      isOperatingYear: Boolean(p.yearCommissioned),
      operator: p.operator,
      investmentBlnRub: p.investmentBlnRub,
      description: p.description,
      isFlagship: p.isFlagship,
    }));

  const stats = {
    total: items.length,
    operating: items.filter((p) => p.status === "operating").length,
    construction: items.filter((p) => p.status === "construction").length,
    planned: items.filter((p) => p.status === "planned").length,
    operatingMW: items.filter((p) => p.status === "operating").reduce((s, p) => s + p.capacityMW, 0),
    pipelineMW: items.filter((p) => p.status !== "operating").reduce((s, p) => s + p.capacityMW, 0),
    regions: regions.length,
    investedBlnRub: items.reduce((s, p) => s + (p.investmentBlnRub ?? 0), 0),
  };

  return { items, stats, regions: regions.map((r) => ({ id: r.id, name: r.name, district: r.federalDistrict })) };
}
