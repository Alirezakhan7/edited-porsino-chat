// File: app/api/paystar/create/route.ts
// [مهم] این کد امن شده و قیمت را از منبع داخلی سرور می‌خواند

import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createClient } from "@/lib/supabase/server"
import crypto from "crypto"

// [اصلاح] تعریف پلن‌ها و قیمت‌ها در سمت سرور به عنوان منبع امن حقیقت
const serverPlans = {
  monthly: { priceRial: 6400000, name: "اشتراک یک ماهه" },
  "9-month": { priceRial: 40300000, name: "اشتراک ۹ ماهه" }
}

const PAYSTAR_API_URL = "https://api.paystar.shop/api/pardakht/create"

export async function POST(req: Request) {
  const cookieStore = cookies()
  const supabase = createClient(cookieStore)

  try {
    // ۱. دریافت اطلاعات کاربر و شناسه پلن از کلاینت
    const {
      data: { user }
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { message: "کاربر شناسایی نشد." },
        { status: 401 }
      )
    }

    // به جای مبلغ، شناسه پلن را از کلاینت می‌گیریم
    const { planId } = await req.json()
    if (!planId || !(planId in serverPlans)) {
      return NextResponse.json(
        { message: "پلن اشتراک نامعتبر است." },
        { status: 400 }
      )
    }

    // [اصلاح] دریافت مبلغ و نام پلن از منبع امن سرور
    const selectedPlan = serverPlans[planId as keyof typeof serverPlans]
    const amount = selectedPlan.priceRial
    const description = `خرید ${selectedPlan.name}`

    // ۲. آماده‌سازی پارامترهای پرداخت
    const gateway_id = process.env.PAYSTAR_GATEWAY_ID!
    const sign_key = process.env.PAYSTAR_SECRET_KEY!
    const order_id = `user_${user.id.substring(0, 8)}_${Date.now()}`
    const callback = "https://chat.porsino.org/api/paystar/callback"

    // ۳. ثبت اولیه تراکنش در دیتابیس با مبلغ امن
    await supabase.from("transactions").insert({
      user_id: user.id,
      order_id: order_id,
      amount: amount, // استفاده از مبلغ امن
      status: "pending"
    })

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
