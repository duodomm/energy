"use client"

import { Compass } from "lucide-react"
import { Button } from "@/components/ui/button"
import { navigate } from "@/lib/router"

export function NotFound({ path }: { path: string[] }) {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center px-4 py-16 text-center">
      <Compass className="h-12 w-12 text-primary" />
      <h1 className="mt-6 text-2xl font-bold tracking-tight">Страница не найдена</h1>
      <p className="mt-3 text-sm text-muted-foreground">
        Маршрут /{path.join("/")} не существует. Возможно, статья ещё не опубликована или ссылка устарела.
      </p>
      <div className="mt-7 flex gap-3">
        <Button className="bg-gradient-solar text-primary-foreground" onClick={() => navigate("#/")}>На главную</Button>
        <Button variant="outline" onClick={() => navigate("#/blog")}>К статьям</Button>
      </div>
    </div>
  )
}
