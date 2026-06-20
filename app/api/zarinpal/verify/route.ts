import { NextRequest, NextResponse } from "next/server"

const APP_URL = process.env.APP_URL || "http://localhost:3000"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  const url = req.nextUrl
  const status = url.searchParams.get("Status")

  const params = new URLSearchParams()
  params.set("status", status === "OK" ? "success" : "failed")
  params.set("message", "تراکنش در حالت دمو شبیه‌سازی شد")

  return NextResponse.redirect(`${APP_URL}/payment-result?${params.toString()}`)
}
