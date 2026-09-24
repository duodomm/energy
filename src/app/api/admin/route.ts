import { NextResponse } from "next/server"
import { db } from "@/lib/db"

// GET /api/admin — сводка для админ-зоны (ТЗ 3.2: обновление справочников,
// просмотр статусов лидов БЕЗ ПДн; доступ — Cloudflare Access в продакшене).
export async function GET() {
  try {
    const [leads, staleEquipment, articleCount, regionCount] = await Promise.all([
      db.lead.findMany({ orderBy: { createdAt: "desc" }, take: 100 }),
      db.equipmentCatalog.findMany(),
      db.article.count(),
      db.region.count(),
    ])
    const now = Date.now()
    const stale = staleEquipment.filter(
      (e) => now - new Date(e.updated_at).getTime() > 14 * 86400000,
    )
    return NextResponse.json({
      leads: leads.map((l) => ({
        id: l.id,
        createdAt: l.createdAt,
        objectType: l.objectType,
        region: l.region,
        scenario: l.scenario,
        capexFrom: l.capexFrom,
        capexTo: l.capexTo,
        formId: l.formId,
        deliveryStatus: l.deliveryStatus,
      })),
      priceHealth: {
        total: staleEquipment.length,
        stale: stale.length,
        oldestDays: Math.floor(
          (now - new Date(staleEquipment.reduce((min, e) => Math.min(min, new Date(e.updated_at).getTime()), Infinity)).getTime() || now) / 86400000,
        ),
      },
      counts: { articles: articleCount, regions: regionCount },
    })
  } catch (e) {
    console.error("admin error", e)
    return NextResponse.json({ error: "Недоступно" }, { status: 503 })
  }
}
