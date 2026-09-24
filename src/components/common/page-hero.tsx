"use client"

import { cn } from "@/lib/utils"

// Заголовок раздела с градиентным акцентом и уголковой иллюстрацией
// (правый верх, «выносной элемент чертежа» — HeroCorner)
export function PageHero({
  eyebrow, title, description, children, corner, className,
}: {
  eyebrow?: string
  title: string
  description?: string
  children?: React.ReactNode
  /** Уголковая иллюстрация раздела (HeroCorner) — правый верх на lg+ */
  corner?: React.ReactNode
  className?: string
}) {
  return (
    <section className={cn("mx-auto max-w-7xl px-4 pb-8 pt-10 sm:px-6 md:pt-14", className)}>
      <div className="flex items-start gap-8">
        <div className="min-w-0 flex-1">
          {eyebrow && (
            <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3.5 py-1 text-xs font-medium uppercase tracking-wider text-primary">
              {eyebrow}
            </p>
          )}
          <h1 className="max-w-3xl text-2xl font-bold leading-tight tracking-tight sm:text-3xl md:text-4xl">
            {title}
          </h1>
          {description && (
            <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-muted-foreground">
              {description}
            </p>
          )}
          {children}
        </div>
        {corner}
      </div>
    </section>
  )
}

// Секция со стандартным отступом
export function Section({
  title, action, children, className, id,
}: {
  title?: string
  action?: React.ReactNode
  children: React.ReactNode
  className?: string
  id?: string
}) {
  return (
    <section id={id} className={cn("mx-auto max-w-7xl px-4 py-8 sm:px-6", className)}>
      {(title || action) && (
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          {title && <h2 className="text-xl font-semibold tracking-tight md:text-2xl">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  )
}
