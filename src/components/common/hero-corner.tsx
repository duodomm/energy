"use client"

// Уголковое фото раздела (правый верх PageHero) — концепция «Тёплый кадр».
// Вместо чертёжных схем: живое фото в фирменном дуотоне (тени — петроль,
// света — янтарный крем, П1 «Янтарный полдень»), растворяющееся к лево-низу
// через радиальную mask-маску — «изображение emerges из фона».
// Атрибут aria-hidden: декоративный элемент, смысл несёт подпись раздела.
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

// Радиальная маска: плотное ядро у правого верха, органичный силуэт
// без жёстких краёв, растворение во все стороны — сильнее всего к лево-низу.
const MASK =
  "radial-gradient(ellipse 70% 76% at 72% 24%, #000 26%, rgba(0,0,0,0.62) 46%, rgba(0,0,0,0.22) 60%, transparent 72%)"

export function HeroCorner({ variant, className }: { variant: CornerVariant; className?: string }) {
  const v = VARIANTS[variant]
  return (
    <div className={cn("hidden shrink-0 lg:block", className)} aria-hidden="true">
      <figure className="relative h-[206px] w-[292px] select-none">
        {/* Дуотон-фото с растворением к лево-низу */}
        <img
          src={v.img}
          alt=""
          width={584}
          height={420}
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover motion-safe:animate-in motion-safe:fade-in motion-safe:duration-700"
          style={{ WebkitMaskImage: MASK, maskImage: MASK }}
        />
        {/* Миниатюрная подпись-этикетка в плотной зоне фото */}
        <figcaption className="svg-mono absolute right-2.5 top-2.5 max-w-[80%] truncate rounded-full border border-[#E8E2D5] bg-[#FAF8F3]/95 px-2.5 py-1 text-[9px] font-medium uppercase tracking-[0.12em] text-[#0F5568] shadow-[0_2px_10px_rgba(34,39,46,0.18)]">
          {v.caption}
        </figcaption>
      </figure>
    </div>
  )
}
