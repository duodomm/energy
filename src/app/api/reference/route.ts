import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { withCache } from "@/lib/api-cache"

// GET /api/reference — статичный JSON-бандл справочников для клиентского ядра
// (ТЗ раздел 5: публичная часть читает только бандл/кэш, не D1 на каждый запрос)
export async function GET() {
  try {
    const data = await withCache("ref-bundle", async () => {
      const [regions, equipment, mountRates, workNorms] = await Promise.all([
        db.region.findMany({ orderBy: { name: "asc" } }),
        db.equipmentCatalog.findMany({ orderBy: [{ category: "asc" }, { id: "asc" }] }),
        db.mountRate.findMany(),
        db.workNorm.findMany({ orderBy: { code: "asc" } }),
      ])
      const latest = equipment.reduce(
        (max, e) => Math.max(max, new Date(e.updated_at).getTime()),
        0,
      )
      return {
        regions: regions.map((r) => ({
          code: r.code,
          name: r.name,
          federalOkrug: r.federalOkrug,
          psh: JSON.parse(r.pshJson) as number[],
          tariffFlat: r.tariffFlat,
          tariffDay: r.tariffDay,
          tariffNight: r.tariffNight,
          installK: r.installK,
          snowRegion: r.snowRegion,
          windRegion: r.windRegion,
          climateNote: r.climateNote,
          dieselPrice: r.dieselPrice,
          gasPrice: r.gasPrice,
        })),
        equipment,
        mountRates,
        workNorms,
        priceUpdatedAt: new Date(latest || Date.now()).toISOString(),
      }
    })
    return NextResponse.json(data, {
      headers: { "Cache-Control": "public, max-age=3600, stale-while-revalidate=600" },
    })
  } catch (e) {
    console.error("reference error", e)
    return NextResponse.json({ error: "Справочник временно недоступен" }, { status: 503 })
  }
}
