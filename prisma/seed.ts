import { PrismaClient } from "@prisma/client"

const db = new PrismaClient()

import { REGIONS } from "./data/regions"
import { EQUIPMENT, MOUNT_RATES, WORK_NORMS, TARIFFS } from "./data/equipment"
import { CASE_ARTICLES } from "./data/articles-cases"
import { HUB_ARTICLES } from "./data/articles-hubs"
import { GUIDE_ARTICLES } from "./data/articles-guides"
import { GLOSSARY, FAQS } from "./data/reference"

async function main() {
  console.log("Seed start…")

  // Очистка
  await db.lead.deleteMany()
  await db.article.deleteMany()
  await db.region.deleteMany()
  await db.equipmentCatalog.deleteMany()
  await db.mountRate.deleteMany()
  await db.workNorm.deleteMany()
  await db.tariff.deleteMany()
  await db.glossaryTerm.deleteMany()
  await db.faqItem.deleteMany()

  // Регионы
  await db.region.createMany({
    data: REGIONS.map((r) => ({
      code: r.code,
      name: r.name,
      federalOkrug: r.federalOkrug,
      pshJson: JSON.stringify(r.psh),
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
  })
  console.log(`Regions: ${REGIONS.length}`)

  // Каталог оборудования
  await db.equipmentCatalog.createMany({
    data: EQUIPMENT.map((e) => ({
      category: e.category,
      tech: e.tech ?? null,
      name: e.name,
      unit: e.unit,
      spec: e.spec ?? null,
      priceFrom: e.priceFrom,
      priceTo: e.priceTo,
      sourceNote: e.sourceNote ?? null,
    })),
  })
  console.log(`Equipment: ${EQUIPMENT.length}`)

  // Ставки монтажа и нормы
  await db.mountRate.createMany({ data: MOUNT_RATES })
  await db.workNorm.createMany({
    data: WORK_NORMS.map((w) => ({
      code: w.code,
      workName: w.workName,
      normHours: w.normHours,
      unit: w.unit,
      complexityK: w.complexityK,
    })),
  })
  console.log(`Mount rates: ${MOUNT_RATES.length}, work norms: ${WORK_NORMS.length}`)

  // Тарифы поставщиков
  await db.tariff.createMany({
    data: TARIFFS.map((t) => ({
      region: t.region,
      provider: t.provider,
      tariffFlat: t.tariffFlat,
      tariffDay: t.tariffDay,
      tariffNight: t.tariffNight,
      note: t.note ?? null,
    })),
  })
  console.log(`Tariffs: ${TARIFFS.length}`)

  // Статьи
  const articles = [...CASE_ARTICLES, ...HUB_ARTICLES, ...GUIDE_ARTICLES]
  for (const a of articles) {
    await db.article.create({
      data: {
        slug: a.slug,
        hub: a.hub,
        kind: a.kind,
        title: a.title,
        teaser: a.teaser,
        bodyMd: a.bodyMd,
        author: a.author,
        readMinutes: a.readMinutes,
        seoTitle: a.seoTitle ?? null,
        seoDesc: a.seoDesc ?? null,
        caseSpecJson: a.caseSpecJson ?? null,
      },
    })
  }
  console.log(`Articles: ${articles.length}`)

  // Глоссарий и FAQ
  await db.glossaryTerm.createMany({ data: GLOSSARY })
  await db.faqItem.createMany({ data: FAQS })
  console.log(`Glossary: ${GLOSSARY.length}, FAQ: ${FAQS.length}`)

  // Демо-лиды (технические записи без ПДн)
  await db.lead.createMany({
    data: [
      {
        objectType: "dacha", region: "moskva", scenario: "autonomous",
        capexFrom: 520000, capexTo: 845000,
        formId: "calc", deliveryStatus: "delivered",
        utmJson: JSON.stringify({ utm_source: "yandex", utm_campaign: "sun_dacha" }),
      },
      {
        objectType: "house", region: "voronezh", scenario: "hybrid",
        capexFrom: 1180000, capexTo: 2240000,
        formId: "calc", deliveryStatus: "delivered",
        utmJson: JSON.stringify({ utm_source: "google", utm_campaign: "hybrid_house" }),
      },
      {
        objectType: "warehouse", region: "moskva", scenario: "grid",
        capexFrom: 6900000, capexTo: 12200000,
        formId: "exit", deliveryStatus: "pending_retry",
        utmJson: JSON.stringify({ utm_source: "direct" }),
      },
    ],
  })
  console.log("Demo leads: 3")

  console.log("Seed done.")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => db.$disconnect())
