// File: app/api/paystar/callback/route.ts
// وظیفه: دریافت پاسخ از پی‌استار، تایید نهایی تراکنش و هدایت کاربر

import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createClient } from "@/lib/supabase/server"
import crypto from "crypto"

const PAYSTAR_VERIFY_URL = "https://api.paystar.shop/api/pardakht/verify"

export async function GET(req: NextRequest) {
  const cookieStore = cookies()
  const supabase = createClient(cookieStore)
  const searchParams = req.nextUrl.searchParams
  const appUrl = process.env.NEXT_PUBLIC_APP_URL!

  const order_id = searchParams.get("order_id")

  try {
    // ۱. خواندن پارامترهای بازگشتی از URL
    const status = searchParams.get("status")
    const ref_num = searchParams.get("ref_num")
    const card_number = searchParams.get("card_number")
    const tracking_code = searchParams.get("tracking_code")

    if (!order_id) throw new Error("شناسه سفارش یافت نشد.")
    if (status !== "1") {
      await supabase
        .from("transactions")
        .update({ status: "failed" })
        .eq("order_id", order_id)
      return NextResponse.redirect(
        `${appUrl}/payment-result?status=failed&message=تراکنش ناموفق بود یا توسط شما لغو شد`
      )
    }
    if (!ref_num || !card_number || !tracking_code) {
      throw new Error("اطلاعات بازگشتی از درگاه ناقص است.")
    }

    // ۲. پیدا کردن تراکنش در دیتابیس
    const { data: transaction, error: findError } = await supabase
      .from("transactions")
      .select("*")
      .eq("order_id", order_id)
      .single()

    if (findError || !transaction)
      throw new Error(`تراکنش با شناسه ${order_id} یافت نشد.`)
    if (transaction.status !== "pending") {
      return NextResponse.redirect(
        `${appUrl}/payment-result?status=success&message=این تراکنش قبلا پردازش شده است`
      )
    }

    // ۳. ارسال درخواست تایید نهایی به پی‌استار
    const amount = transaction.amount
    const sign_key = process.env.PAYSTAR_SECRET_KEY!
    const sign_data = `${amount}#${ref_num}#${card_number}#${tracking_code}`
    const sign = crypto
      .createHmac("sha512", sign_key)
      .update(sign_data)
      .digest("hex")

    const response = await fetch(PAYSTAR_VERIFY_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.PAYSTAR_GATEWAY_ID!}`
      },
      body: JSON.stringify({ ref_num, amount, sign }),
      cache: "no-store"
    })

    const result = await response.json()
    if (result.status !== 1) {
      throw new Error(`تایید تراکنش ناموفق بود: ${result.message}`)
    }

    // ۴. تراکنش موفق! آپدیت دیتابیس
    await supabase
      .from("transactions")
      .update({
        status: "success",
        ref_num: ref_num,
        verified_at: new Date().toISOString()
      })
      .eq("order_id", order_id)

    // ۵. هدایت کاربر به صفحه اعلام نتیجه موفق
    return NextResponse.redirect(
      `${appUrl}/payment-result?status=success&order_id=${order_id}`
    )
  } catch (error: any) {
    console.error("[CALLBACK_ERROR]", error)
    if (order_id) {
      // آپدیت وضعیت به failed بدون فیلد description
      await supabase
        .from("transactions")
        .update({ status: "failed" })
        .eq("order_id", order_id)
    }
    return NextResponse.redirect(
      `${appUrl}/payment-result?status=failed&message=${encodeURIComponent(error.message)}`
    )
  }
}
