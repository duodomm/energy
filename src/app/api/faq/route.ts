import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { withCache } from "@/lib/api-cache"

export async function GET() {
  try {
    const items = await withCache("faq", () =>
      db.faqItem.findMany({ orderBy: { sortOrder: "asc" } }),
    )
    return NextResponse.json(items, { headers: { "Cache-Control": "public, max-age=600" } })
  } catch {
    return NextResponse.json({ error: "FAQ недоступен" }, { status: 503 })
  }
}
