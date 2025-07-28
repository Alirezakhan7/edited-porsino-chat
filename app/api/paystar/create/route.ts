// File: app/api/paystar/create/route.ts
// وظیفه: ساخت تراکنش در دیتابیس محلی و دریافت لینک پرداخت از پی‌استار

import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createClient } from "@/lib/supabase/server"
import crypto from "crypto"

const PAYSTAR_API_URL = "https://api.paystar.shop/api/pardakht/create"

export async function POST(req: Request) {
  const cookieStore = cookies()
  const supabase = createClient(cookieStore)

  try {
    // ۱. دریافت اطلاعات کاربر و مبلغ
    const {
      data: { user }
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { message: "کاربر شناسایی نشد." },
        { status: 401 }
      )
    }
    const { amount, description = "خرید اشتراک" } = await req.json()
    if (!amount || amount < 5000) {
      return NextResponse.json(
        { message: "مبلغ نامعتبر است." },
        { status: 400 }
      )
    }

    // ۲. آماده‌سازی پارامترهای پرداخت
    const gateway_id = process.env.PAYSTAR_GATEWAY_ID!
    const sign_key = process.env.PAYSTAR_SECRET_KEY!
    const order_id = `user_${user.id.substring(0, 8)}_${Date.now()}`

    // [اصلاح] آدرس بازگشت به صورت دستی تنظیم شده است
    const callback = "https://porsino.org/api/paystar/callback"

    // ۳. ثبت اولیه تراکنش در دیتابیس (بدون فیلد description)
    const { error: dbError } = await supabase.from("transactions").insert({
      user_id: user.id,
      order_id: order_id,
      amount: amount,
      status: "pending"
    })

    if (dbError) {
      console.error("[DB_ERROR]", dbError)
      throw new Error("خطا در ثبت اولیه تراکنش در پایگاه داده.")
    }

    // ۴. ساخت امضا برای ارسال به پی‌استار
    const sign_data = `${amount}#${order_id}#${callback}`
    const sign = crypto
      .createHmac("sha512", sign_key)
      .update(sign_data)
      .digest("hex")

    // ۵. ارسال درخواست به پی‌استار
    const response = await fetch(PAYSTAR_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${gateway_id}`
      },
      body: JSON.stringify({
        amount,
        order_id,
        callback,
        sign,
        mail: user.email,
        description
      }),
      cache: "no-store"
    })

    const result = await response.json()
    if (result.status !== 1) {
      throw new Error(`پی‌استار خطا داد: ${result.message}`)
    }

    // ۶. برگرداندن لینک پرداخت به کلاینت
    const paymentUrl = `https://api.paystar.shop/api/pardakht/payment?token=${result.data.token}`
    return NextResponse.json({ payment_url: paymentUrl })
  } catch (error: any) {
    console.error("[CREATE_ERROR]", error)
    return NextResponse.json(
      { message: error.message || "خطای داخلی سرور" },
      { status: 500 }
    )
  }
}
