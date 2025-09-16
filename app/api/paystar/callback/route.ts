// app/api/paystar/callback/route.ts
import { NextRequest, NextResponse } from "next/server"
import crypto from "crypto"
import { createClient as createAdminClient } from "@supabase/supabase-js"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

// PayStar endpoints
const VERIFY_URL = "https://core.paystar.ir/api/pardakht/verify"

// ENV
const APP_URL = process.env.APP_URL || "https://your-domain.example"
const PAYSTAR_GATEWAY_ID = process.env.PAYSTAR_GATEWAY_ID as string
const PAYSTAR_SIGN_KEY = process.env.PAYSTAR_SIGN_KEY as string
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL as string
const SUPABASE_SERVICE_ROLE_KEY = process.env
  .SUPABASE_SERVICE_ROLE_KEY as string

// مزایای پلن (اختیاری؛ در صورت نیاز به فعال‌سازی اشتراک/توکن)
const PLAN_BENEFITS: Record<string, { tokens: number; durationDays: number }> =
  {
    bio_1m: { tokens: 1_000_000, durationDays: 30 },
    bio_6m: { tokens: 6_000_000, durationDays: 180 },
    bio_9m: { tokens: 9_000_000, durationDays: 270 }
  }

function hmac512(secret: string, data: string) {
  return crypto.createHmac("sha512", secret).update(data, "utf8").digest("hex")
}
function redirectToResult(q: URLSearchParams) {
  const url = `${APP_URL}/payment-result?${q.toString()}`
  return NextResponse.redirect(url, { status: 302 })
}
async function parseIncoming(req: NextRequest) {
  if (req.method === "GET")
    return Object.fromEntries(req.nextUrl.searchParams.entries())
  const ct = req.headers.get("content-type") || ""
  if (
    ct.includes("multipart/form-data") ||
    ct.includes("application/x-www-form-urlencoded")
  ) {
    const form = await req.formData()
    const o: Record<string, string> = {}
    for (const [k, v] of form.entries()) if (typeof v === "string") o[k] = v
    return o
  }
  try {
    return await req.json()
  } catch {
    return {}
  }
}

export async function GET(req: NextRequest) {
  return handle(req)
}
export async function POST(req: NextRequest) {
  return handle(req)
}

async function handle(req: NextRequest) {
  if (
    !PAYSTAR_GATEWAY_ID ||
    !PAYSTAR_SIGN_KEY ||
    !SUPABASE_URL ||
    !SUPABASE_SERVICE_ROLE_KEY
  ) {
    return redirectToResult(
      new URLSearchParams({ status: "error", message: "ENV ناقص است." })
    )
  }

  const admin = createAdminClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

  try {
    const p = await parseIncoming(req)
    const status = Number(p.status ?? 0)
    const order_id = p.order_id || ""
    const ref_num = p.ref_num || ""
    const card_number = p.card_number || "" // فقط در موفق
    const tracking_code = p.tracking_code || "" // فقط در موفق

    if (!order_id || !ref_num) {
      return redirectToResult(
        new URLSearchParams({
          status: "error",
          message: "پارامتر کال‌بک ناقص است."
        })
      )
    }

    // تراکنش pending را پیدا کن
    const { data: tx, error: txErr } = await admin
      .from("transactions")
      .select("id, user_id, plan_id, amount, status")
      .eq("ref_num", ref_num)
      .maybeSingle()

    if (txErr || !tx) {
      return redirectToResult(
        new URLSearchParams({ status: "error", message: "تراکنش یافت نشد." })
      )
    }

    // اگر خود درگاه گفت ناموفق
    if (status !== 1) {
      await admin
        .from("transactions")
        .update({
          status: "failed",
          provider: "paystar",
          tracking_code: tracking_code || null,
          card_number: card_number || null
        })
        .eq("id", tx.id)

      return redirectToResult(
        new URLSearchParams({ status: "failed", order_id })
      )
    }

    // امضای Verify: amount#ref_num#card_number#tracking_code
    const amount = tx.amount
    const signData = `${amount}#${ref_num}#${card_number}#${tracking_code}`
    const sign = hmac512(PAYSTAR_SIGN_KEY, signData)

    // Verify با timeout ≥ 10s
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 15000)
    const vr = await fetch(VERIFY_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${PAYSTAR_GATEWAY_ID}`
      },
      body: JSON.stringify({ ref_num, amount, sign }),
      signal: controller.signal,
      cache: "no-store"
    }).catch(e => {
      throw e
    })
    clearTimeout(timer)

    const vjson = await vr.json().catch(() => null)
    if (!vjson || vjson.status !== 1) {
      await admin
        .from("transactions")
        .update({ status: "failed" })
        .eq("id", tx.id)
      return redirectToResult(
        new URLSearchParams({ status: "failed", order_id })
      )
    }

    // وریفای OK → موفق
    await admin
      .from("transactions")
      .update({
        status: "success",
        provider: "paystar",
        verified_at: new Date().toISOString(),
        tracking_code: tracking_code || null,
        card_number: card_number || null
      })
      .eq("id", tx.id)

    // (اختیاری) اعمال مزایای پلن: پروفایل/توکن
    const plan = tx.plan_id && PLAN_BENEFITS[tx.plan_id]
    if (plan) {
      // 1) token_usage: limit_tokens را ست کن (used_tokens ریست نشود اگر business این را می‌خواهد)
      await admin.from("token_usage").upsert(
        {
          user_id: tx.user_id, // اگر ستون user_email داری، با ایمیل کار کن
          limit_tokens: plan.tokens,
          updated_at: new Date().toISOString()
        },
        { onConflict: "user_id" }
      )
      // 2) profiles: اشتراک فعال تا durationDays
      const expires = new Date()
      expires.setDate(expires.getDate() + plan.durationDays)
      await admin
        .from("profiles")
        .update({
          subscription_status: "active",
          subscription_expires_at: expires.toISOString()
        })
        .eq("user_id", tx.user_id)
    }

    const q = new URLSearchParams({
      status: "success",
      order_id,
      tracking_code
    })
    return redirectToResult(q)
  } catch (e: any) {
    console.error("[PAYSTAR_CALLBACK_ERROR]", e)
    return redirectToResult(
      new URLSearchParams({ status: "error", message: "خطای غیرمنتظره" })
    )
  }
}
