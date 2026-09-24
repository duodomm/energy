// Дамп контента БД в статический JSON-бандл: public/api-data/*.
// Запуск: bun scripts/build-api-json.ts
// ТЗ раздел 5: публичная часть читает статичный бандл (Cron Worker в проде
// пересобирает его при изменениях), запросы к БД из рантайма — нет.
// Обязательный шаг перед scripts/build-static.sh.

import { mkdirSync, writeFileSync } from "node:fs"
import { PrismaClient } from "@prisma/client"

const db = new PrismaClient()
const OUT = "public/api-data"
mkdirSync(OUT, { recursive: true })
mkdirSync(`${OUT}/articles`, { recursive: true })

async function main() {
  // 1) Глоссарий, FAQ, каталог цен — «как есть» из API-роутов
  const [glossary, faq, catalogItems] = await Promise.all([
    db.glossaryTerm.findMany({ orderBy: { term: "asc" } }),
    db.faqItem.findMany({ orderBy: { sortOrder: "asc" } }),
    db.equipmentCatalog.findMany({ orderBy: [{ category: "asc" }, { id: "asc" }] }),
  ])
  writeFileSync(`${OUT}/glossary.json`, JSON.stringify(glossary))
  const latest = catalogItems.reduce((m, e) => Math.max(m, new Date(e.updated_at).getTime()), 0)
  writeFileSync(
    `${OUT}/catalog.json`,
    JSON.stringify({ items: catalogItems, updatedAt: new Date(latest || Date.now()).toISOString() }),
  )
  console.log(`glossary=${glossary.length} faq=${faq.length} catalog=${catalogItems.length}`)

  // 2) Справочный бандл для калькулятора (форма /api/reference)
  const [regions, mountRates, workNorms] = await Promise.all([
    db.region.findMany({ orderBy: { name: "asc" } }),
    db.mountRate.findMany(),
    db.workNorm.findMany({ orderBy: { code: "asc" } }),
  ])
  const bundle = {
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
    equipment: catalogItems,
    mountRates,
    workNorms,
    priceUpdatedAt: new Date(latest || Date.now()).toISOString(),
  }
  writeFileSync(`${OUT}/reference.json`, JSON.stringify(bundle))
  console.log(`reference: regions=${regions.length} equipment=${catalogItems.length}`)

  // 3) Статьи: список (без body) + полные тела по слагам
  const list = await db.article.findMany({
    where: { published: true },
    orderBy: { updatedAt: "desc" },
    select: {
      slug: true, hub: true, kind: true, title: true, teaser: true,
      author: true, readMinutes: true, views: true, updatedAt: true, caseSpecJson: true,
    },
  })
  writeFileSync(`${OUT}/articles.json`, JSON.stringify(list))
  const full = await db.article.findMany({ where: { published: true } })
  for (const a of full) {
    writeFileSync(`${OUT}/articles/${a.slug}.json`, JSON.stringify(a))
  }
  console.log(`articles: list=${list.length}, full=${full.length}`)

  // 4) Хабы отдельными файлами (клиент может фильтровать и из общего списка)
  const hubs = [...new Set(full.map((a) => a.hub))]
  for (const h of hubs) {
    writeFileSync(`${OUT}/articles-hub-${h}.json`, JSON.stringify(list.filter((a) => a.hub === h)))
  }
  console.log(`hubs: ${hubs.join(", ")}`)
}

main()
  .catch((e) => {
    console.error("dump failed:", e)
    process.exit(1)
  })
  .finally(() => db.$disconnect())
