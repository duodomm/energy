import { NextResponse } from "next/server"
import { db } from "@/lib/db"

// GET /api — health-check
export async function GET() {
  try {
    await db.$queryRaw`SELECT 1`
    return NextResponse.json({
      status: "ok",
      service: "altenergo-rf-api",
      db: "connected",
      endpoints: ["/api/reference", "/api/articles", "/api/lead", "/api/admin"],
    })
  } catch {
    return NextResponse.json({ status: "error", db: "unavailable" }, { status: 500 })
  }
}
