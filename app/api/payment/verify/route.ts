import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createClient } from "@/lib/supabase/server" // مسیر را متناسب با پروژه خود تنظیم کنید
import crypto from "crypto"

const PAYSTAR_API_BASE_URL = "https://core.paystar.ir/api/pardakht"

export async function POST(request: Request) {
  const cookieStore = cookies()
  const supabase = createClient(cookieStore)

  try {
    const { ref_num, order_id, card_number, tracking_code } =
      await request.json()

    // ۱. پیدا کردن تراکنش در دیتابیس بر اساس order_id
    const { data: transaction, error: findError } = await supabase
      .from("transactions")
      .select("*")
      .eq("order_id", order_id)
      .single()

    if (findError || !transaction) {
      throw new Error(`تراکنش با شناسه سفارش ${order_id} در سیستم یافت نشد.`)
    }

    // اگر تراکنش قبلا موفق بوده، دوباره کاری نمی‌کنیم
    if (transaction.status === "success") {
      return NextResponse.json({
        message: "این تراکنش قبلا با موفقیت تایید شده است."
      })
    }

    // ۲. آماده‌سازی و ارسال درخواست تایید به پی‌استار
    const amount = transaction.amount
    const gatewayId = process.env.PAYSTAR_GATEWAY_ID!
    const secretKey = process.env.PAYSTAR_SECRET_KEY!
    const signString = `${amount}#${ref_num}#${card_number}#${tracking_code}`
    const sign = crypto
      .createHmac("sha512", secretKey)
      .update(signString)
      .digest("hex")

    const response = await fetch(`${PAYSTAR_API_BASE_URL}/verify`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${gatewayId}`
      },
      body: JSON.stringify({ ref_num, amount, sign })
    })

    const data = await response.json()

    // ۳. مدیریت پاسخ پی‌استار
    if (data.status !== 1) {
      // اگر تایید ناموفق بود، وضعیت را در دیتابیس 'failed' می‌کنیم
      await supabase
        .from("transactions")
        .update({ status: "failed" })
        .eq("id", transaction.id)
      return NextResponse.json(
        { message: `تراکنش توسط درگاه تایید نشد: ${data.message}` },
        { status: 400 }
      )
    }

    // <<موفقیت آمیز>>
    // ۴. به‌روزرسانی دیتابیس پس از تایید نهایی
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 30) // افزودن 30 روز اشتراک

    // ۴.۱: آپدیت جدول profiles کاربر
    const { error: profileError } = await supabase
      .from("profiles")
      .update({
        subscription_status: "active",
        subscription_expires_at: expiresAt.toISOString()
      })
      .eq("user_id", transaction.user_id)

    if (profileError) {
      // این یک خطای حیاتی است. پول گرفته شده ولی اشتراک فعال نشده
      console.error("[CRITICAL_PROFILE_UPDATE_ERROR]", profileError)
      throw new Error(
        "خطا در فعال‌سازی اشتراک کاربر. لطفا به پشتیبانی اطلاع دهید."
      )
    }

    // ۴.۲: آپدیت نهایی جدول transactions
    await supabase
      .from("transactions")
      .update({ status: "success", verified_at: new Date().toISOString() })
      .eq("id", transaction.id)

    return NextResponse.json({
      message: "پرداخت شما با موفقیت تایید و اشتراک شما فعال شد."
    })
  } catch (error: any) {
    console.error("[PAYMENT_VERIFY_ERROR]", error)
    return NextResponse.json(
      { message: error.message || "خطای داخلی سرور در تایید تراکنش" },
      { status: 500 }
    )
  }
}
