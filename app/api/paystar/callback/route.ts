// app/api/paystar/callback/route.ts
import { NextRequest, NextResponse } from "next/server"
import { createClient as createAdminClient } from "@supabase/supabase-js"
import crypto from "crypto"

const DP_VERIFY_URL = "https://api.directpay.click/api/pardakht/verify"

// پلان‌ها ⇢ سقف توکن و مدت (مثل قبل)
const serverPlans = {
  bio_1m: { tokens: 1_000_000, durationDays: 30 },
  bio_6m: { tokens: 6_000_000, durationDays: 180 },
  bio_9m: { tokens: 9_000_000, durationDays: 270 }
} as const

function createRedirectResponse(appUrl: string, query: URLSearchParams) {
  const redirectUrl = `${appUrl}/payment-result?${query.toString()}`
  return new NextResponse(
    `<!DOCTYPE html>
    <html><head>
      <meta http-equiv="refresh" content="0; url=${redirectUrl}" />
      <script>window.location.href = "${redirectUrl}";</script>
    </head><body><p>در حال انتقال...</p></body></html>`,
    { headers: { "Content-Type": "text/html" } }
  )
}

async function handleCallback(req: NextRequest) {
  const appUrl = process.env.APP_URL || "https://chat.porsino.org"

  try {
    // ادمین کلاینت (بدون وابستگی به سشن)
    const supabaseAdmin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // خواندن پارامترهای برگشتی DirectPay (GET یا POST)
    let status: string | null,
      order_id: string | null,
      ref_num: string | null,
      card_number: string | null,
      tracking_code: string | null

    if (req.method === "POST") {
      const form = await req.formData()
      status = (form.get("status") as string) ?? null
      order_id = (form.get("order_id") as string) ?? null
      ref_num = (form.get("ref_num") as string) ?? null
      card_number = (form.get("card_number") as string) ?? null
      tracking_code = (form.get("tracking_code") as string) ?? null
    } else {
      const sp = req.nextUrl.searchParams
      status = sp.get("status")
      order_id = sp.get("order_id")
      ref_num = sp.get("ref_num")
      card_number = sp.get("card_number")
      tracking_code = sp.get("tracking_code")
    }

    if (!order_id || !ref_num) {
      const q = new URLSearchParams({
        status: "error",
        message: "پارامترهای بازگشت ناقص است."
      })
      return createRedirectResponse(appUrl, q)
    }

    // یافتن تراکنش
    const { data: transaction, error: findError } = await supabaseAdmin
      .from("transactions")
      .select("*")
      .eq("order_id", order_id)
      .single()
    if (findError || !transaction) {
      const q = new URLSearchParams({
        status: "error",
        message: `تراکنش با شناسه ${order_id} یافت نشد.`
      })
      return createRedirectResponse(appUrl, q)
    }

    // ref_num باید با ذخیره‌شده یکی باشد
    if (transaction.ref_num !== ref_num) {
      await supabaseAdmin
        .from("transactions")
        .update({ status: "failed" })
        .eq("order_id", order_id)
      const q = new URLSearchParams({
        status: "failed",
        message: "مغایرت ref_num"
      })
      return createRedirectResponse(appUrl, q)
    }

    // اگر وضعیت مستقیم ناموفق است
    if (String(status) !== "1") {
      await supabaseAdmin
        .from("transactions")
        .update({ status: "failed" })
        .eq("order_id", order_id)
      const q = new URLSearchParams({
        status: "failed",
        message: "تراکنش ناموفق/لغو شده."
      })
      return createRedirectResponse(appUrl, q)
    }

    // اگر قبلاً بسته شده
    if (transaction.status === "success") {
      const q = new URLSearchParams({
        status: "success",
        message: "این تراکنش قبلاً پردازش شده است."
      })
      return createRedirectResponse(appUrl, q)
    }
    if (transaction.status === "failed") {
      const q = new URLSearchParams({
        status: "failed",
        message: "این تراکنش قبلاً ناموفق شده است."
      })
      return createRedirectResponse(appUrl, q)
    }

    // امضا برای Verify: amount#ref_num#card_number#tracking_code (طبق PDF)
    const sign_key = process.env.DIRECTPAY_SECRET_KEY!
    const sign_data = `${transaction.amount}#${ref_num}#${card_number || ""}#${tracking_code || ""}`
    const sign = crypto
      .createHmac("sha512", sign_key)
      .update(sign_data)
      .digest("hex")

    // Verify با Bearer = DIRECTPAY_GATEWAY_ID (timeout ≥ 10s)
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 15000)
    const verifyRes = await fetch(DP_VERIFY_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.DIRECTPAY_GATEWAY_ID!}`
      },
      body: JSON.stringify({ ref_num, amount: transaction.amount, sign }),
      cache: "no-store",
      signal: controller.signal
    }).catch(e => {
      throw e
    })
    clearTimeout(timer)

    const verifyJson = await verifyRes.json().catch(() => ({}))
    if (verifyJson?.status !== 1) {
      await supabaseAdmin
        .from("transactions")
        .update({ status: "failed" })
        .eq("order_id", order_id)
      const q = new URLSearchParams({
        status: "failed",
        message: verifyJson?.message || "تأیید تراکنش ناموفق"
      })
      return createRedirectResponse(appUrl, q)
    }

    // ↑ وریفای OK — اعمال دسترسی‌ها مثل نسخهٔ قدیمی‌ات
    const planId = transaction.plan_id as keyof typeof serverPlans
    const plan = serverPlans[planId]
    if (!plan) {
      await supabaseAdmin
        .from("transactions")
        .update({ status: "failed" })
        .eq("order_id", order_id)
      const q = new URLSearchParams({
        status: "error",
        message: "پلن نامعتبر در تراکنش."
      })
      return createRedirectResponse(appUrl, q)
    }

    const { data: userObj } = await supabaseAdmin.auth.admin.getUserById(
      transaction.user_id
    )
    const email = userObj?.user?.email
    if (!email) {
      await supabaseAdmin
        .from("transactions")
        .update({ status: "failed" })
        .eq("order_id", order_id)
      const q = new URLSearchParams({
        status: "error",
        message: "ایمیل کاربر پیدا نشد."
      })
      return createRedirectResponse(appUrl, q)
    }

    // token_usage: limit_tokens را ست کن
    await supabaseAdmin.from("token_usage").upsert(
      {
        user_email: email,
        limit_tokens: plan.tokens,
        used_tokens: 0,
        updated_at: new Date().toISOString()
      },
      { onConflict: "user_email" }
    )

    // profiles: فعال‌سازی اشتراک + تمدید
    const expires_at = new Date()
    expires_at.setDate(expires_at.getDate() + plan.durationDays)
    await supabaseAdmin
      .from("profiles")
      .update({
        subscription_status: "active",
        subscription_expires_at: expires_at.toISOString()
      })
      .eq("user_id", transaction.user_id)

    // transactions: موفق + verified_at
    await supabaseAdmin
      .from("transactions")
      .update({ status: "success", verified_at: new Date().toISOString() })
      .eq("order_id", order_id)

    const q = new URLSearchParams({ status: "success", order_id })
    return createRedirectResponse(appUrl, q)
  } catch (error: any) {
    console.error("[DIRECTPAY_CALLBACK_ERROR]", error)
    const q = new URLSearchParams({
      status: "error",
      message: error?.message || "خطای غیرمنتظره"
    })
    return createRedirectResponse(
      process.env.APP_URL || "https://chat.porsino.org",
      q
    )
  }
}

export async function GET(req: NextRequest) {
  return handleCallback(req)
}
export async function POST(req: NextRequest) {
  return handleCallback(req)
}
