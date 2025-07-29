// File: app/api/paystar/create/route.ts

import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createClient } from "@/lib/supabase/server"
import crypto from "crypto"

// [اصلاح شده ✅] تعریف پلن‌ها و قیمت‌ها در سمت سرور
// قیمت‌ها باید مبلغ کل پرداختی برای هر پلن باشند
const serverPlans = {
  monthly: { priceRial: 8_400_000, name: "اشتراک ماهانه" },
  yearly: { priceRial: 70_560_000, name: "اشتراک سالانه" } // 7,056,000 تومان
}

// [اصلاح شده ✅] کدهای تخفیف معتبر در سمت سرور
const serverDiscountCodes: Record<
  string,
  { discountPercent: number } | { discountAmountRial: number }
> = {
  SALE30: { discountPercent: 30 }, // 30 درصد تخفیف
  SPECIAL100: { discountAmountRial: 1_000_000 } // ۱۰۰ هزار تومان تخفیف
}

const PAYSTAR_API_URL = "https://api.paystar.shop/api/pardakht/create"

export async function POST(req: Request) {
  const cookieStore = cookies()
  const supabase = createClient(cookieStore)

  try {
    // ۱. دریافت اطلاعات کاربر، شناسه پلن و کد تخفیف
    const {
      data: { user }
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { message: "کاربر شناسایی نشد." },
        { status: 401 }
      )
    }

    const { planId, discountCode } = await req.json()
    if (!planId || !(planId in serverPlans)) {
      return NextResponse.json(
        { message: "پلن اشتراک نامعتبر است." },
        { status: 400 }
      )
    }

    // ۲. محاسبه قیمت نهایی با اعمال کد تخفیف (در صورت وجود و اعتبار)
    const selectedPlan = serverPlans[planId as keyof typeof serverPlans]
    let amount = selectedPlan.priceRial
    let appliedDiscountCode = null

    if (discountCode && discountCode in serverDiscountCodes) {
      appliedDiscountCode = discountCode
      const codeDetails =
        serverDiscountCodes[discountCode as keyof typeof serverDiscountCodes]

      if ("discountPercent" in codeDetails) {
        amount = amount * (1 - codeDetails.discountPercent / 100)
      } else if ("discountAmountRial" in codeDetails) {
        amount = Math.max(5000, amount - codeDetails.discountAmountRial)
      }
    }
    amount = Math.round(amount) // رند کردن مبلغ نهایی

    const description = `خرید ${selectedPlan.name}${appliedDiscountCode ? ` (با کد تخفیف: ${appliedDiscountCode})` : ""}`

    // ۳. آماده‌سازی پارامترهای پرداخت
    const gateway_id = process.env.PAYSTAR_GATEWAY_ID!
    const sign_key = process.env.PAYSTAR_SECRET_KEY!
    const order_id = `user_${user.id.substring(0, 8)}_${Date.now()}`
    const callback = "https://chat.porsino.org/api/paystar/callback"

    // ۴. ثبت اولیه تراکنش در دیتابیس با مبلغ امن و کد تخفیف
    await supabase.from("transactions").insert({
      user_id: user.id,
      order_id: order_id,
      amount: amount,
      status: "pending",
      discount_code: appliedDiscountCode // ذخیره کد تخفیف استفاده شده
    })

    // ۵. ساخت امضا و ارسال درخواست به پی‌استار
    const sign_data = `${amount}#${order_id}#${callback}`
    const sign = crypto
      .createHmac("sha512", sign_key)
      .update(sign_data)
      .digest("hex")

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
