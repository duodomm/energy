import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { cached } from "@/lib/api-cache";
import { ENERGY_TYPE_IDS } from "@/lib/energy";

export async function GET() {
  try {
    const data = await cached("regions", compute);
    return NextResponse.json(data);
  } catch (e) {
    console.error("regions error", e);
    return NextResponse.json({ error: "Не удалось загрузить регионы" }, { status: 500 });
  }
}

async function compute() {
  const projects = await db.project.findMany({ include: { region: true, energyType: true } });

  type RegionAgg = {
    id: number;
    name: string;
    district: string;
    byType: Record<string, number>;
    total: number;
    operating: number;
    construction: number;
    planned: number;
    projectsCount: number;
    topProject: string | null;
    topProjectType: string | null;
    topProjectCapacity: number;
  };

  const regions = new Map<number, RegionAgg>();

  for (const p of projects) {
    const r = p.region;
    const entry: RegionAgg =
      regions.get(r.id) ??
      {
        id: r.id,
        name: r.name,
        district: r.federalDistrict,
        byType: Object.fromEntries(ENERGY_TYPE_IDS.map((t) => [t, 0])),
        total: 0,
        operating: 0,
        construction: 0,
        planned: 0,
        projectsCount: 0,
        topProject: null,
        topProjectType: null,
        topProjectCapacity: 0,
      };
    entry.byType[p.energyTypeId] += p.capacityMW;
    entry.total += p.capacityMW;
    if (p.status === "operating") entry.operating += p.capacityMW;
    else if (p.status === "construction") entry.construction += p.capacityMW;
    else entry.planned += p.capacityMW;
    entry.projectsCount += 1;
    if (p.capacityMW > entry.topProjectCapacity) {
      entry.topProject = p.name;
      entry.topProjectType = p.energyTypeId;
      entry.topProjectCapacity = p.capacityMW;
    }
    regions.set(r.id, entry);
  }

  // Ведущий вид ВИЭ региона
  const items = [...regions.values()].map((r) => {
    const leading = ENERGY_TYPE_IDS.reduce(
      (best, t) => (r.byType[t] > r.byType[best] ? t : best),
      ENERGY_TYPE_IDS[0]
    );
    const { topProjectCapacity: _drop, ...rest } = r;
    return { ...rest, leadingType: r.byType[leading] > 0 ? leading : null };
  });

  // Сводка по федеральным округам
  const districtsMap = new Map<
    string,
    { district: string; total: number; projectsCount: number; regionsCount: number }
  >();
  for (const r of items) {
    const d =
      districtsMap.get(r.district) ??
      { district: r.district, total: 0, projectsCount: 0, regionsCount: 0 };
    d.total += r.total;
    d.projectsCount += r.projectsCount;
    d.regionsCount += 1;
    districtsMap.set(r.district, d);
  }
  const districts = [...districtsMap.values()].sort((a, b) => b.total - a.total);

  const itemsSorted = items.sort((a, b) => b.total - a.total);

  return {
    totalRegions: items.length,
    totalCapacityMW: items.reduce((s, r) => s + r.total, 0),
    totalProjects: items.reduce((s, r) => s + r.projectsCount, 0),
    districts,
    regions: itemsSorted,
  };
}
