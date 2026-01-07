import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

/* -------------------------------------------------------------------------- */
/* CONFIG                                    */
/* -------------------------------------------------------------------------- */
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

const MERCHANT_ID = process.env.ZARINPAL_MERCHANT_ID
const ZARINPAL_VERIFY_URL =
  "https://payment.zarinpal.com/pg/v4/payment/verify.json"
const APP_URL = process.env.APP_URL || "http://localhost:3000"

const PLAN_BENEFITS: Record<string, { tokens: number; durationDays: number }> =
  {
    bio_1m: { tokens: 1_000_000, durationDays: 30 },
    bio_6m: { tokens: 6_000_000, durationDays: 180 },
    bio_9m: { tokens: 9_000_000, durationDays: 270 }
  }

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  const url = req.nextUrl
  const authority = url.searchParams.get("Authority")
  const status = url.searchParams.get("Status")

  const redirectToResult = (
    resultStatus: "success" | "failed",
    msg?: string,
    refId?: string
  ) => {
    const params = new URLSearchParams()
    params.set("status", resultStatus)
    if (msg) params.set("message", msg)
    if (refId) params.set("order_id", refId)
    return NextResponse.redirect(
      `${APP_URL}/payment-result?${params.toString()}`
    )
  }

  if (!MERCHANT_ID || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return redirectToResult("failed", "تنظیمات سمت سرور ناقص است.")
  }

  if (status !== "OK") {
    return redirectToResult("failed", "عملیات پرداخت توسط کاربر لغو شد.")
  }

  // استفاده از Service Role برای دسترسی ادمین
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

  try {
    // ۱. یافتن تراکنش
    const { data: transaction, error: fetchErr } = await supabase
      .from("transactions")
      .select("*")
      .eq("ref_num", authority)
      .eq("status", "pending")
      .single()

    if (fetchErr || !transaction) {
      return redirectToResult(
        "failed",
        "تراکنش یافت نشد یا قبلاً پردازش شده است."
      )
    }

    // ۲. وریفای زرین‌پال
    const verifyResponse = await fetch(ZARINPAL_VERIFY_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json"
      },
      body: JSON.stringify({
        merchant_id: MERCHANT_ID,
        amount: transaction.amount,
        authority: authority
      })
    })

    const verifyJson = await verifyResponse.json()
    const { data } = verifyJson

    if (!data || (data.code !== 100 && data.code !== 101)) {
      await supabase
        .from("transactions")
        .update({ status: "failed" } as any)
        .eq("id", transaction.id)
      return redirectToResult("failed", "تایید پرداخت ناموفق بود.")
    }

    const refId = data.ref_id

    // ۳. ثبت تراکنش موفق
    await supabase
      .from("transactions")
      .update({
        status: "success",
        ref_num: String(refId),
        verified_at: new Date().toISOString()
      } as any)
      .eq("id", transaction.id)

    // ۴. اعمال مزایا (شارژ اکانت)
    const plan = PLAN_BENEFITS[transaction.plan_id]

    if (plan) {
      // الف) آپدیت پروفایل (فعال کردن اشتراک زمانی)
      const expires = new Date()
      expires.setDate(expires.getDate() + plan.durationDays)

      await supabase
        .from("profiles")
        .update({
          subscription_status: "active",
          subscription_expires_at: expires.toISOString()
        } as any)
        .eq("user_id", transaction.user_id)

      // ب) آپدیت توکن (بخش اصلاح شده و مطمئن)
      // تغییر اصلی اینجاست: دریافت ایمیل مستقیم از Auth (جایی که fake email ذخیره شده)
      const { data: userData } = await supabase.auth.admin.getUserById(
        transaction.user_id
      )

      // این همان ایمیل (مثلاً 0912...@porsino.ir) است
      const userAuthEmail = userData.user?.email

      if (userAuthEmail) {
        // آپدیت جدول token_usage با استفاده از ایمیل واقعی کاربر
        await supabase.from("token_usage").upsert(
          {
            user_email: userAuthEmail, // کلید اصلی جدول توکن
            limit_tokens: plan.tokens,
            updated_at: new Date().toISOString()
            // used_tokens را نمی‌فرستیم تا مصرف قبلی کاربر حفظ شود
          } as any,
          { onConflict: "user_email" }
        )
      } else {
        console.error(
          "Critical: User email not found in Auth for ID:",
          transaction.user_id
        )
      }
    }

    return redirectToResult(
      "success",
      "پرداخت با موفقیت انجام شد.",
      String(refId)
    )
  } catch (err) {
    console.error("Verify System Error:", err)
    return redirectToResult("failed", "خطای غیرمنتظره در سیستم.")
  }
}
