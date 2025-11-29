// app/api/paystar/create/route.ts
import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import crypto from "crypto"
import { createClient as createServerClient } from "@/lib/supabase/server" // برای گرفتن user از سشن
import { createClient as createAdminClient } from "@supabase/supabase-js" // برای درج/آپدیت DB با Service Role

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

// PayStar endpoints
const CREATE_URL = "https://core.paystar.ir/api/pardakht/create"

// ENV
const APP_URL = process.env.APP_URL || "https://chat.porsino.org"
const PAYSTAR_GATEWAY_ID = process.env.PAYSTAR_GATEWAY_ID as string
const PAYSTAR_SIGN_KEY = process.env.PAYSTAR_SIGN_KEY as string
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL as string
const SUPABASE_SERVICE_ROLE_KEY = process.env
  .SUPABASE_SERVICE_ROLE_KEY as string

// قیمت‌های پلن (ریال) — مطابق کسب‌وکار خودت
const PLAN_PRICES_RIAL: Record<string, number> = {
  bio_1m: 3_400_000,
  bio_6m: 16_720_000,
  bio_9m: 22_950_000
}

// تخفیف‌های اختیاری (مثال)
const DISCOUNT_CODES: Record<string, { percent?: number; amount?: number }> = {
  // SUMMER25: { percent: 25 },
  // FIX100K:  { amount: 100_000 },
  SUMMER99: { percent: 99 }
}

// Helpers
function hmac512(secret: string, data: string) {
  return crypto.createHmac("sha512", secret).update(data, "utf8").digest("hex")
}
function genOrderId(userId?: string) {
  const prefix = userId ? `user_${userId.slice(0, 8)}` : "guest"
  return `${prefix}_${Date.now()}_${Math.floor(Math.random() * 1e6)}`
}

export async function POST(req: NextRequest) {
  // اختیاری: محدود کردن origin به دامنه‌ی خودت
  const allowedOrigin = new URL(APP_URL).origin
  const origin = req.headers.get("origin") || ""
  if (origin && origin !== allowedOrigin) {
    return NextResponse.json(
      { message: "Origin نامعتبر است." },
      { status: 403 }
    )
  }

  if (
    !PAYSTAR_GATEWAY_ID ||
    !PAYSTAR_SIGN_KEY ||
    !SUPABASE_URL ||
    !SUPABASE_SERVICE_ROLE_KEY
  ) {
    return NextResponse.json({ message: "ENV ناقص است." }, { status: 500 })
  }

  try {
    // کاربر لاگین‌کرده
    const supa = createServerClient()
    const {
      data: { user }
    } = await supa.auth.getUser()
    if (!user)
      return NextResponse.json({ message: "ابتدا وارد شوید." }, { status: 401 })

    // ورودی از فرانت
    const payload = await req.json().catch(() => ({}))
    let {
      amount,
      planId,
      discountCode,
      order_id: inputOrderId,
      callback_method, // 1 => GET (اختیاری)
      name,
      phone,
      mail,
      description
    } = payload as Record<string, any>

    // اگر amount نیامده، از planId محاسبه کن + تخفیف اختیاری
    if ((!amount || amount < 5000) && planId && PLAN_PRICES_RIAL[planId]) {
      amount = PLAN_PRICES_RIAL[planId]
      if (discountCode) {
        const d = DISCOUNT_CODES[String(discountCode).trim().toUpperCase()]
        if (d) {
          if (d.percent) amount = Math.round(amount * (1 - d.percent / 100))
          if (d.amount) amount = Math.max(5_000, amount - d.amount)
        }
      }
    }
    if (!amount || amount < 5000) {
      return NextResponse.json(
        { message: "مبلغ نامعتبر است." },
        { status: 400 }
      )
    }

    // سفارش و callback (دامنه باید با پنل PayStar یکی باشد)
    const order_id = inputOrderId || genOrderId(user.id)
    const callback = `${APP_URL}/api/paystar/callback`

    // امضای Create: amount#order_id#callback
    const signData = `${amount}#${order_id}#${callback}`
    const sign = hmac512(PAYSTAR_SIGN_KEY, signData)

    // جلوگیری از اسپم pending (اختیاری)
    const admin = createAdminClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    const { data: recent } = await admin
      .from("transactions")
      .select("id, created_at")
      .eq("user_id", user.id)
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(1)
    if (
      recent?.length &&
      Date.now() - new Date(recent[0].created_at).getTime() < 60_000
    ) {
      return NextResponse.json(
        { message: "یک تراکنش در حال پردازش دارید. کمی بعد تلاش کنید." },
        { status: 429 }
      )
    }

    // فراخوانی Create
    const body: any = { amount, order_id, callback, sign }
    if (callback_method !== undefined)
      body.callback_method = Number(callback_method)
    if (name) body.name = String(name)
    if (phone) body.phone = String(phone) // 98912...
    if (mail) body.mail = String(mail)
    if (description) body.description = String(description)

    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 15000)
    const res = await fetch(CREATE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${PAYSTAR_GATEWAY_ID}`
      },
      body: JSON.stringify(body),
      signal: controller.signal,
      cache: "no-store"
    }).catch(e => {
      throw e
    })
    clearTimeout(timer)

    const json = await res.json().catch(() => null)
    if (!res.ok || !json) {
      const text = !res.ok ? await res.text().catch(() => "") : ""
      throw new Error(`HTTP ${res.status} از درگاه: ${text || "پاسخ نامعتبر"}`)
    }
    if (json.status !== 1 || !json.data?.token || !json.data?.ref_num) {
      return NextResponse.json(
        {
          message: json.message || "خطا در ایجاد تراکنش",
          data: json.data ?? null
        },
        { status: 400 }
      )
    }

    const { token, ref_num, order_id: oid, payment_amount } = json.data

    // ذخیره رکورد pending
    const { error: dbErr } = await admin.from("transactions").insert({
      user_id: user.id,
      order_id: oid || order_id,
      ref_num,
      amount,
      plan_id: planId ?? null,
      discount_code: discountCode ?? null,
      status: "pending"
    })
    if (dbErr) console.error("[TX_INSERT_ERROR]", dbErr)

    // لینک پرداخت PayStar
    const payment_url = `https://core.paystar.ir/api/pardakht/payment?token=${token}`

    return NextResponse.json(
      { payment_url, token, ref_num, order_id: oid || order_id },
      { status: 200 }
    )
  } catch (e: any) {
    console.error("[PAYMENT_CREATE_ERROR]", e)
    return NextResponse.json(
      { message: e?.message || "خطای غیرمنتظره" },
      { status: 500 }
    )
  }
}
