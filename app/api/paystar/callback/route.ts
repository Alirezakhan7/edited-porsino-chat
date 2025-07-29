/* --------------------------------------------------------------------------
   File: app/api/paystar/callback/route.ts
   Description: Handles the callback from the Paystar payment gateway. It
                verifies the transaction, and upon success, updates the user's
                subscription status and token limits in Supabase.
   -------------------------------------------------------------------------- */
import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import crypto from "crypto"

// آدرس پایه صحیح برای API تایید تراکنش پی‌استار
const PAYSTAR_VERIFY_URL = "https://api.paystar.shop/api/pardakht/verify"

// مقادیر پلن‌ها برای آپدیت پروفایل کاربر پس از پرداخت موفق
// این مقادیر باید با منطق کلی برنامه شما یکسان باشند.
const serverPlans = {
  monthly: { tokens: 1_000_000, durationDays: 30 },
  yearly: { tokens: 10_000_000, durationDays: 365 }
}

export async function POST(req: NextRequest) {
  const cookieStore = cookies()
  const supabase = createClient(cookieStore)
  const appUrl = process.env.NEXT_PUBLIC_APP_URL!
  let order_id_for_redirect: string | null = null

  try {
    // ۱. دریافت داده‌های بازگشتی از درگاه (ارسال شده به صورت form-data)
    const formData = await req.formData()
    const status = formData.get("status") as string
    const order_id = formData.get("order_id") as string
    const ref_num = formData.get("ref_num") as string
    const card_number = formData.get("card_number") as string // برای ساخت امضای وریفای لازم است
    const tracking_code = formData.get("tracking_code") as string // برای ساخت امضای وریفای لازم است

    order_id_for_redirect = order_id

    // ۲. بررسی پارامترهای ضروری بازگشتی
    if (!order_id || !ref_num) {
      throw new Error("اطلاعات بازگشتی از درگاه پرداخت ناقص است.")
    }

    if (status !== "1") {
      // اگر تراکنش ناموفق بود، وضعیت آن را در دیتابیس بروز کنید
      await supabase
        .from("transactions")
        .update({ status: "failed" })
        .eq("order_id", order_id)
      return NextResponse.redirect(
        `${appUrl}/payment-result?status=failed&message=تراکنش توسط شما لغو شد یا ناموفق بود.`
      )
    }

    // ۳. پیدا کردن تراکنش در دیتابیس
    const { data: transaction, error: findError } = await supabase
      .from("transactions")
      .select("*")
      .eq("order_id", order_id)
      .single()

    if (findError || !transaction) {
      throw new Error(`تراکنش با شناسه سفارش ${order_id} یافت نشد.`)
    }
    if (transaction.status !== "pending") {
      // اگر تراکنش قبلاً پردازش شده، کاربر را به صفحه نتیجه هدایت کنید
      return NextResponse.redirect(
        `${appUrl}/payment-result?status=success&message=این تراکنش قبلاً با موفقیت پردازش شده است.`
      )
    }

    // ۴. تایید نهایی تراکنش با سرویس Verify پی‌استار
    const gateway_id = process.env.PAYSTAR_GATEWAY_ID!
    const sign_key = process.env.PAYSTAR_SECRET_KEY!

    // امضای وریفای ساختار متفاوتی دارد
    const verify_sign_data = `${transaction.amount}#${ref_num}#${card_number}#${tracking_code}`
    const sign = crypto
      .createHmac("sha512", sign_key)
      .update(verify_sign_data)
      .digest("hex")

    const verifyResponse = await fetch(PAYSTAR_VERIFY_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${gateway_id}`
      },
      body: JSON.stringify({ ref_num, amount: transaction.amount, sign }),
      cache: "no-store"
    })

    const verifyResult = await verifyResponse.json()
    if (verifyResult.status !== 1) {
      throw new Error(`خطا در تایید نهایی تراکنش: ${verifyResult.message}`)
    }

    // ۵. فعال‌سازی اشتراک کاربر پس از تایید نهایی
    const planId = transaction.plan_id
    const planDetails = serverPlans[planId as keyof typeof serverPlans]
    if (!planDetails) {
      throw new Error(
        `جزئیات پلن برای شناسه '${planId}' در سرور تعریف نشده است.`
      )
    }

    // دریافت ایمیل کاربر برای آپدیت جدول توکن
    const {
      data: { user }
    } = await supabase.auth.admin.getUserById(transaction.user_id)
    if (!user?.email)
      throw new Error("ایمیل کاربر برای به‌روزرسانی سهمیه توکن یافت نشد.")

    // آپدیت یا ایجاد رکورد در جدول token_usage
    await supabase.from("token_usage").upsert(
      {
        user_email: user.email,
        limit_tokens: planDetails.tokens,
        used_tokens: 0, // ریست کردن توکن‌های مصرفی
        updated_at: new Date().toISOString()
      },
      { onConflict: "user_email" }
    )

    // آپدیت جدول profiles
    const expires_at = new Date()
    expires_at.setDate(expires_at.getDate() + planDetails.durationDays)
    await supabase
      .from("profiles")
      .update({
        subscription_status: "active",
        subscription_expires_at: expires_at.toISOString()
      })
      .eq("user_id", transaction.user_id)

    // ۶. آپدیت نهایی وضعیت تراکنش در دیتابیس
    await supabase
      .from("transactions")
      .update({
        status: "success",
        verified_at: new Date().toISOString(),
        ref_num: ref_num // شما می‌توانید شماره کارت و کد رهگیری را نیز اینجا ذخیره کنید
      })
      .eq("order_id", order_id)

    // ۷. هدایت کاربر به صفحه اعلام نتیجه موفق
    return NextResponse.redirect(
      `${appUrl}/payment-result?status=success&order_id=${order_id}`
    )
  } catch (error: any) {
    console.error("[PAYMENT_CALLBACK_ERROR]", error)
    // در صورت بروز هرگونه خطا، کاربر را به صفحه نتیجه با پیام خطا هدایت کنید
    const query = new URLSearchParams({
      status: "error",
      message: error.message || "یک خطای پیش‌بینی‌نشده رخ داد."
    })
    if (order_id_for_redirect) {
      query.set("order_id", order_id_for_redirect)
    }
    return NextResponse.redirect(`${appUrl}/payment-result?${query.toString()}`)
  }
}
