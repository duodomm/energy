"use client"

// Уголковое фото раздела (правый верх PageHero) — концепция «Тёплый кадр».
// Живое фото в фирменном дуотоне (тени — петроль, света — янтарный крем,
// П1 «Янтарный полдень»). Кадр виден ПОЛНОСТЬЮ, но к левой и нижней сторонам
// плавно уходит в 30% прозрачности (α 0,70) — мягкий переход в фон страницы
// без растворения самого изображения. Атрибут aria-hidden: декоративный
// элемент, смысл несёт подпись раздела.
// CWV: 584×420 ≤ 55 КБ, loading=lazy, фикс. размеры (нет CLS), без анимаций.

import { cn } from "@/lib/utils"

export type CornerVariant =
  | "sun" | "battery" | "generator" | "economics" | "regions"
  | "reference" | "cases" | "blog" | "about" | "contacts"

const VARIANTS: Record<CornerVariant, { img: string; caption: string }> = {
  sun: { img: "/photos/corner/sun.jpg", caption: "ФЭМ · 450 Вт" },
  battery: { img: "/photos/corner/battery.jpg", caption: "LiFePO4 · 6000 циклов" },
  generator: { img: "/photos/corner/generator.jpg", caption: "Резерв · автозапуск" },
  economics: { img: "/photos/corner/economics.jpg", caption: "Срок окупаемости" },
  regions: { img: "/photos/corner/regions.jpg", caption: "Инсоляция регионов" },
  reference: { img: "/photos/corner/reference.jpg", caption: "Справочник · термины" },
  cases: { img: "/photos/corner/cases.jpg", caption: "Объекты · смета от–до" },
  blog: { img: "/photos/corner/blog.jpg", caption: "Заметки инженера" },
  about: { img: "/photos/corner/about.jpg", caption: "Команда и метод" },
  contacts: { img: "/photos/corner/contacts.jpg", caption: "Инженер на связи" },
}

// Маска «полный кадр»: фото видно целиком; два линейных градиента дают по 30%
// прозрачности у левой (α 0,70 → 1,0 к 38% ширины) и нижней (α 0,70 → 1,0
// к 38% высоты) сторон. Композитинг intersect перемножает альфы — в углу
// лево-низ виньетка чуть глубже. Браузеры без mask-composite (старый Chrome)
// получают просто полностью видимый кадр — честный fallback.
const MASK_LEFT = "linear-gradient(to right, rgba(0,0,0,0.70), #000 38%)"
const MASK_BOTTOM = "linear-gradient(to top, rgba(0,0,0,0.70), #000 38%)"
const MASKS = `${MASK_LEFT}, ${MASK_BOTTOM}`

export function HeroCorner({ variant, className }: { variant: CornerVariant; className?: string }) {
  const v = VARIANTS[variant]
  return (
    <div className={cn("hidden shrink-0 lg:block", className)} aria-hidden="true">
      <figure className="relative h-[206px] w-[292px] select-none">
        {/* Дуотон-фото: полный кадр, 30% прозрачности у левой/нижней сторон */}
        <img
          src={v.img}
          alt=""
          width={584}
          height={420}
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover motion-safe:animate-in motion-safe:fade-in motion-safe:duration-700"
          style={{
            WebkitMaskImage: MASKS,
            maskImage: MASKS,
            WebkitMaskComposite: "source-in",
            maskComposite: "intersect",
          }}
        />
        {/* Миниатюрная подпись-этикетка в плотной зоне фото */}
        <figcaption className="svg-mono absolute right-2.5 top-2.5 max-w-[80%] truncate rounded-full border border-[#E8E2D5] bg-[#FAF8F3]/95 px-2.5 py-1 text-[9px] font-medium uppercase tracking-[0.12em] text-[#0F5568] shadow-[0_2px_10px_rgba(34,39,46,0.18)]">
          {v.caption}
        </figcaption>
      </figure>
    </div>
  )
}
