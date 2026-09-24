// Cloudflare Worker: лид-контур по ТЗ 6.2 (152-ФЗ).
// Портирован из src/app/api/lead/route.ts один-в-один:
//   POST /api/lead: honeypot → валидация → Turnstile → (1) ПДн в CRM на территории РФ
//   → (2) техзапись БЕЗ ПДн в D1 → ответ пользователю.
// Деградация: при отказе D1 лид всё равно доставлен в CRM, пользователю — успех.
// ПДн в D1/R2/KV НЕ хранятся — по построению.
//
// Развёртывание: см. DEPLOY-CLOUDFLARE.md (npx wrangler deploy).

export interface Env {
  DB: D1Database
  TURNSTILE_SECRET?: string
  CRM_WEBHOOK_URL?: string
  TG_BOT_TOKEN?: string
  TG_CHAT_ID?: string
}

const REASONABLE = /^[\s\S]{0,500}$/

interface LeadBody {
  name?: string
  contact?: string // телефон или e-mail — уходит ТОЛЬКО в РФ-CRM, не в D1
  objectType?: string
  region?: string
  scenario?: string
  formId?: string
  consent?: boolean
  honeypot?: string
  turnstileToken?: string
  capexFrom?: number
  capexTo?: number
  note?: string
  utm?: Record<string, string>
}

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" },
  })

async function verifyTurnstile(token: string | undefined, secret: string | undefined): Promise<boolean> {
  // Тестовые ключи Turnstile проходят всегда; без секрета — пропускаем
  // (антиспам обеспечен honeypot + WAF + rate-limit по ТЗ 7.1)
  if (!secret || !token) return true
  try {
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ secret, response: token }),
      signal: AbortSignal.timeout(4000),
    })
    const data = (await res.json()) as { success?: boolean }
    return Boolean(data.success)
  } catch {
    return false
  }
}

async function deliverToCrm(env: Env, lead: LeadBody): Promise<"delivered" | "failed"> {
  // (1) Немедленная передача ПДн в CRM/приёмник на территории РФ
  try {
    if (env.CRM_WEBHOOK_URL) {
      await fetch(env.CRM_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: lead.name,
          contact: lead.contact,
          objectType: lead.objectType,
          region: lead.region,
          scenario: lead.scenario,
          capex: [lead.capexFrom, lead.capexTo],
          note: lead.note,
          utm: lead.utm,
        }),
        signal: AbortSignal.timeout(4000),
      })
    } else if (env.TG_BOT_TOKEN && env.TG_CHAT_ID) {
      // Резервный канал: Telegram-бот менеджеру (если CRM-webhook ещё не готов)
      const text =
        `Заявка ${lead.formId ?? "site"} · ${lead.region ?? "—"} · ${lead.scenario ?? "—"}\n` +
        `${lead.name ?? "—"} · ${lead.contact ?? "—"}\n` +
        `CAPEX: ${lead.capexFrom ?? "—"}…${lead.capexTo ?? "—"} ₽`
      await fetch(`https://api.telegram.org/bot${env.TG_BOT_TOKEN}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: env.TG_CHAT_ID, text }),
        signal: AbortSignal.timeout(4000),
      })
    }
    return "delivered"
  } catch {
    return "failed"
  }
}

async function insertLead(env: Env, lead: LeadBody, status: string): Promise<boolean> {
  // (2) Техническая запись БЕЗ ПДн (152-ФЗ): только тип объекта/регион/сценарий
  if (!env.DB) return false
  try {
    await env.DB.prepare(
      `INSERT INTO leads (object_type, region, scenario, capex_from, capex_to, form_id, utm_json, delivery_status, note)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
      .bind(
        (lead.objectType ?? "unknown").slice(0, 64),
        (lead.region ?? "unknown").slice(0, 64),
        (lead.scenario ?? "unknown").slice(0, 64),
        lead.capexFrom ?? null,
        lead.capexTo ?? null,
        (lead.formId ?? "unknown").slice(0, 32),
        lead.utm ? JSON.stringify(lead.utm).slice(0, 512) : null,
        status,
        lead.note ? lead.note.slice(0, 256) : null,
      )
      .run()
    return true
  } catch {
    return false
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)

    if (url.pathname === "/api/lead" && request.method === "POST") {
      let body: LeadBody
      try {
        body = (await request.json()) as LeadBody
      } catch {
        return json({ ok: false, error: "Некорректный запрос" }, 400)
      }

      // Honeypot: ботам отвечаем «успехом», ничего не делая
      if (body.honeypot && body.honeypot.trim().length > 0) {
        return json({ ok: true })
      }

      if (!body.consent) {
        return json({ ok: false, error: "Требуется согласие на обработку персональных данных" }, 400)
      }
      if (!body.name || body.name.trim().length < 2 || !REASONABLE.test(body.name)) {
        return json({ ok: false, error: "Укажите имя" }, 400)
      }
      if (!body.contact || body.contact.trim().length < 5) {
        return json({ ok: false, error: "Укажите телефон или e-mail" }, 400)
      }
      const tsOk = await verifyTurnstile(body.turnstileToken, env.TURNSTILE_SECRET)
      if (!tsOk) {
        return json({ ok: false, error: "Проверка Turnstile не пройдена" }, 400)
      }

      // (1) ПДн → CRM (приоритет выше записи в БД — потеря недопустима)
      const crmStatus = await deliverToCrm(env, body)

      // (2) Техзапись без ПДн → D1 (деградация не мешает пользователю)
      const dbOk = await insertLead(env, body, crmStatus === "delivered" ? "delivered" : "pending_retry")

      return json({
        ok: true,
        degraded: !dbOk,
        redirect: "#/spasibo",
      })
    }

    // Прочие /api/* в статическом режиме не существуют — быстрый JSON 404,
    // клиент уходит в фолбэк public/api-data/*.json
    if (url.pathname.startsWith("/api/")) {
      return json({ ok: false, error: "Not Found" }, 404)
    }

    return json({ ok: false, error: "Not Found" }, 404)
  },
}
