import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { withCache } from "@/lib/api-cache"

// GET /api/catalog — справочник цен с диапазонами «от–до» и датой актуальности (ТЗ раздел 5)
export async function GET() {
  try {
    const items = await withCache("catalog", () =>
      db.equipmentCatalog.findMany({ orderBy: [{ category: "asc" }, { id: "asc" }] }),
    )
    const latest = items.reduce((max, e) => Math.max(max, new Date(e.updated_at).getTime()), 0)
    return NextResponse.json(
      { items, updatedAt: new Date(latest || Date.now()).toISOString() },
      { headers: { "Cache-Control": "public, max-age=600" } },
    )
  } catch {
    return NextResponse.json({ error: "Каталог недоступен" }, { status: 503 })
  }
}
