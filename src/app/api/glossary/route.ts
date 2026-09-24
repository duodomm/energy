import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { withCache } from "@/lib/api-cache"

export async function GET() {
  try {
    const terms = await withCache("glossary", () =>
      db.glossaryTerm.findMany({ orderBy: { term: "asc" } }),
    )
    return NextResponse.json(terms, { headers: { "Cache-Control": "public, max-age=600" } })
  } catch {
    return NextResponse.json({ error: "Глоссарий недоступен" }, { status: 503 })
  }
}
