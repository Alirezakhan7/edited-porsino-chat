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
      // الف) آپدیت پروفایل (اشتراک)
      const expires = new Date()
      expires.setDate(expires.getDate() + plan.durationDays)

      // اول پروفایل را آپدیت می‌کنیم و همزمان ایمیل کاربر را می‌گیریم
      const { data: updatedProfile, error: profileErr } = await supabase
        .from("profiles")
        .update({
          subscription_status: "active", // مطابق با constraint دیتابیس شما
          subscription_expires_at: expires.toISOString()
        } as any)
        .eq("user_id", transaction.user_id)
        .select("email") // ایمیل را برمی‌گردانیم تا برای توکن استفاده کنیم
        .single()

      if (profileErr) {
        console.error("Profile Update Error:", profileErr)
      }

      // ب) آپدیت توکن (با استفاده از ایمیل)
      // ایمیل را یا از پروفایل می‌گیریم یا اگر نبود سعی می‌کنیم با user_id از auth بگیریم (که اینجا دسترسی مستقیم نداریم پس فرض بر پروفایل است)
      const userEmail = updatedProfile?.email

      if (userEmail) {
        /* نکته مهم: جدول token_usage شما user_id ندارد و user_email کلید یکتا است.
           پس ما باید با ایمیل upsert کنیم.
        */
        await supabase.from("token_usage").upsert(
          {
            user_email: userEmail,
            limit_tokens: plan.tokens,
            updated_at: new Date().toISOString()
            // used_tokens را نمی‌فرستیم تا اگر وجود داشت، ریست نشود (یا اگر می‌خواهید ریست شود، مقدار 0 بفرستید)
          } as any,
          { onConflict: "user_email" } // کلید یکتا در جدول شما
        )
      } else {
        console.error("Email not found for user, skipping token update")
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
