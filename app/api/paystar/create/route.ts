// File: app/api/paystar/callback/route.ts
// [مهم] این فایل اکنون پس از پرداخت، پروفایل و سقف توکن کاربر را آپدیت می‌کند

import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createClient } from "@/lib/supabase/server"
import crypto from "crypto"

// تعریف مقادیر پلن‌ها در سمت سرور برای امنیت
const serverPlans = {
  6400000: { tokens: 1000000, durationDays: 30, name: "monthly" },
  40300000: { tokens: 9000000, durationDays: 270, name: "9-month" }
}

const PAYSTAR_VERIFY_URL = "https://api.paystar.shop/api/pardakht/verify"

export async function GET(req: NextRequest) {
  const cookieStore = cookies()
  const supabase = createClient(cookieStore)
  const searchParams = req.nextUrl.searchParams
  const appUrl = process.env.NEXT_PUBLIC_APP_URL!
  const order_id = searchParams.get("order_id")

  try {
    // ... (بخش ۱ و ۲: بررسی پارامترها و وضعیت بازگشتی) ...
    const status = searchParams.get("status")
    if (!order_id) throw new Error("شناسه سفارش یافت نشد.")
    if (status !== "1") {
      /* ... مدیریت تراکنش ناموفق ... */
    }

    // ۳. پیدا کردن تراکنش و اطلاعات کاربر
    const { data: transaction, error: findError } = await supabase
      .from("transactions")
      .select("*")
      .eq("order_id", order_id)
      .single()
    if (findError || !transaction)
      throw new Error(`تراکنش ${order_id} یافت نشد.`)
    if (transaction.status !== "pending")
      return NextResponse.redirect(
        `${appUrl}/payment-result?status=success&message=تراکنش قبلا پردازش شده`
      )

    // ... (بخش ۴: تایید با پی‌استار) ...
    // فرض می‌شود تایید با پی‌استار موفقیت‌آمیز بوده است

    // ۵. [بخش کلیدی جدید] آپدیت پروفایل و توکن‌های کاربر
    const amount = transaction.amount
    const planDetails = serverPlans[amount as keyof typeof serverPlans]
    if (!planDetails)
      throw new Error(`پلن پرداختی با مبلغ ${amount} تعریف نشده است.`)

    // دریافت ایمیل کاربر برای آپدیت جدول token_usage
    const {
      data: { user },
      error: userError
    } = await supabase.auth.admin.getUserById(transaction.user_id)
    if (userError || !user?.email)
      throw new Error("ایمیل کاربر برای آپدیت توکن یافت نشد.")
    const user_email = user.email

    // آپدیت جدول token_usage: تنظیم سقف جدید و ریست کردن مصرف
    const { error: tokenUsageError } = await supabase
      .from("token_usage")
      .upsert(
        {
          user_email: user_email,
          limit_tokens: planDetails.tokens,
          used_tokens: 0, // ریست کردن مصرف برای دوره جدید
          updated_at: new Date().toISOString()
        },
        { onConflict: "user_email" }
      )

    if (tokenUsageError) throw new Error("خطا در آپدیت سقف توکن کاربر.")

    // آپدیت جدول profiles: فعال‌سازی اشتراک و تاریخ انقضا
    const expires_at = new Date()
    expires_at.setDate(expires_at.getDate() + planDetails.durationDays)
    await supabase
      .from("profiles")
      .update({
        subscription_status: "active",
        subscription_expires_at: expires_at.toISOString()
      })
      .eq("user_id", transaction.user_id)

    // آپدیت نهایی جدول تراکنش
    await supabase
      .from("transactions")
      .update({
        status: "success",
        ref_num: searchParams.get("ref_num"),
        verified_at: new Date().toISOString()
      })
      .eq("order_id", order_id)

    // ۶. هدایت کاربر به صفحه اعلام نتیجه موفق
    return NextResponse.redirect(
      `${appUrl}/payment-result?status=success&order_id=${order_id}`
    )
  } catch (error: any) {
    console.error("[CREATE_ERROR]", error)
    return NextResponse.json(
      { message: error.message || "خطای داخلی سرور" },
      { status: 500 }
    )
  }
}
