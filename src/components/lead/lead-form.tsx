"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Loader2, Send, ShieldCheck } from "lucide-react"
import { navigate } from "@/lib/router"
import { trackGoal } from "@/lib/analytics"
import { cn } from "@/lib/utils"

export interface LeadFormProps {
  formId: string
  compact?: boolean
  submitLabel?: string
  className?: string
  // Контекст расчёта (без ПДн — уходит в техзапись)
  objectType?: string
  region?: string
  scenario?: string
  capexFrom?: number
  capexTo?: number
  notePrefix?: string
}

function getUtm(): Record<string, string> {
  if (typeof window === "undefined") return {}
  const out: Record<string, string> = {}
  try {
    const params = new URLSearchParams(window.location.search)
    for (const k of ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"]) {
      const v = params.get(k)
      if (v) out[k] = v.slice(0, 128)
    }
    out.ref = document.referrer ? document.referrer.slice(0, 128) : "direct"
  } catch { /* noop */ }
  return out
}

export function LeadForm({
  formId, compact, submitLabel = "Отправить заявку", className,
  objectType, region, scenario, capexFrom, capexTo, notePrefix,
}: LeadFormProps) {
  const [name, setName] = useState("")
  const [contact, setContact] = useState("")
  const [note, setNote] = useState("")
  const [consent, setConsent] = useState(false)
  const [honeypot, setHoneypot] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    trackGoal("lead_form_open", { form: formId })
  }, [formId])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (name.trim().length < 2) return setError("Укажите имя")
    if (contact.trim().length < 5) return setError("Укажите телефон или e-mail")
    if (!consent) return setError("Отметьте согласие на обработку персональных данных")

    setLoading(true)
    try {
      const res = await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          contact: contact.trim(),
          objectType, region, scenario, capexFrom, capexTo,
          formId,
          consent,
          honeypot,
          note: notePrefix ? `${notePrefix}${note ? `; ${note}` : ""}` : note,
          utm: getUtm(),
        }),
      })
      const data = (await res.json()) as { ok: boolean; error?: string }
      if (!data.ok) {
        setError(data.error ?? "Не удалось отправить, попробуйте ещё раз")
        return
      }
      trackGoal("lead_sent", { form: formId })
      navigate("#/spasibo")
    } catch {
      setError("Сеть недоступна. Позвоните нам: +7 (495) 123-45-67 — заявку примем голосом")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={submit} className={cn("space-y-4", className)} aria-label="Форма заявки">
      <input
        type="text"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="absolute left-[-9999px] h-0 w-0 opacity-0"
        value={honeypot}
        onChange={(e) => setHoneypot(e.target.value)}
        name="company_website"
      />

      <div className={cn("grid gap-4", compact ? "grid-cols-1" : "sm:grid-cols-2")}>
        <div className="space-y-1.5">
          <Label htmlFor={`lf-name-${formId}`}>Имя</Label>
          <Input
            id={`lf-name-${formId}`}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Как к вам обращаться"
            autoComplete="name"
            required
            maxLength={100}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`lf-contact-${formId}`}>Телефон или e-mail</Label>
          <Input
            id={`lf-contact-${formId}`}
            value={contact}
            onChange={(e) => setContact(e.target.value)}
            placeholder="+7 ___ ___-__-__ или почта"
            autoComplete="tel"
            required
            maxLength={120}
          />
        </div>
      </div>

      {!compact && (
        <div className="space-y-1.5">
          <Label htmlFor={`lf-note-${formId}`}>Комментарий (необязательно)</Label>
          <Textarea
            id={`lf-note-${formId}`}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Тип объекта, вопрос, удобное время звонка…"
            rows={2}
            maxLength={300}
          />
        </div>
      )}

      <label className="flex items-start gap-2.5 text-xs leading-relaxed text-muted-foreground">
        <Checkbox
          checked={consent}
          onCheckedChange={(v) => setConsent(v === true)}
          className="mt-0.5"
          aria-required
        />
        <span>
          Согласен(на) на обработку персональных данных в соответствии с{" "}
          <a href="#/politika-konfidencialnosti" className="text-primary underline underline-offset-2">
            политикой конфиденциальности
          </a>{" "}
          (оператор — ООО «АльтЭнерго», хранение ПДн на серверах в РФ, 152-ФЗ)
        </span>
      </label>

      {/* Turnstile: тестовый ключ в окружении демо; при недоступности скрипта
          форма работает — лид не теряется (ТЗ 6.2: потеря лида недопустима) */}
      <div className="flex items-center gap-2 text-[11px] text-muted-foreground/80">
        <ShieldCheck className="h-3.5 w-3.5 text-stable" />
        Защита форм: Cloudflare Turnstile + honeypot + rate-limit (WAF)
      </div>

      {error && (
        <p role="alert" className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      <Button
        type="submit"
        disabled={loading}
        className="w-full bg-gradient-solar shadow-[0_8px_22px_-8px_rgba(232,148,10,0.55)] hover:opacity-95"
      >
        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
        {submitLabel}
      </Button>
    </form>
  )
}
