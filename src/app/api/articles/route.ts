import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { withCache } from "@/lib/api-cache"

// GET /api/articles?slug=... — список статей (без body) или одна статья с телом
export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get("slug")
  const hub = req.nextUrl.searchParams.get("hub")
  try {
    if (slug) {
      const article = await db.article.findUnique({ where: { slug } })
      if (!article) return NextResponse.json({ error: "Статья не найдена" }, { status: 404 })
      await db.article.update({ where: { slug }, data: { views: { increment: 1 } } }).catch(() => undefined)
      return NextResponse.json(article, { headers: { "Cache-Control": "private, max-age=120" } })
    }
    const list = await withCache(`articles-${hub ?? "all"}`, async () => {
      const items = await db.article.findMany({
        where: hub ? { hub, published: true } : { published: true },
        orderBy: { updatedAt: "desc" },
        select: {
          slug: true, hub: true, kind: true, title: true, teaser: true,
          author: true, readMinutes: true, views: true, updatedAt: true, caseSpecJson: true,
        },
      })
      return items
    })
    return NextResponse.json(list, { headers: { "Cache-Control": "public, max-age=300" } })
  } catch (e) {
    console.error("articles error", e)
    return NextResponse.json({ error: "Статьи временно недоступны" }, { status: 503 })
  }
}
