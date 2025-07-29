/* --------------------------------------------------------------------------
   File: app/api/paystar/create/route.ts
   Description: Creates a payment transaction by calculating the final price
                on the server, registering it with Paystar, and saving the
                initial transaction details to Supabase.
   -------------------------------------------------------------------------- */
import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createClient } from "@/lib/supabase/server"
import crypto from "crypto"

// ۱. تعریف پلن‌ها و کدهای تخفیف در سمت سرور برای امنیت
// این مقادیر باید با مقادیر کلاینت هماهنگ باشند.
const serverPlans = {
  monthly: { priceRial: 8_400_000, name: "اشتراک ماهانه" },
  yearly: { priceRial: 70_560_000, name: "اشتراک سالانه" }
}

const serverDiscountCodes: Record<
  string,
  { discountPercent: number } | { discountAmountRial: number }
> = {
  SALE30: { discountPercent: 30 },
  SPECIAL100: { discountAmountRial: 1_000_000 },
  SUMMER25: { discountPercent: 95 }
}

// آدرس پایه صحیح برای API پی‌استار
const PAYSTAR_API_URL = "https://api.paystar.shop/api/pardakht/create"

export async function POST(req: Request) {
  const cookieStore = cookies()
  const supabase = createClient(cookieStore)

  try {
    // ۲. اعتبارسنجی کاربر
    const {
      data: { user }
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { message: "کاربر شناسایی نشد. لطفاً ابتدا وارد شوید." },
        { status: 401 }
      )
    }

    const { planId, discountCode } = await req.json()

    // ۳. اعتبارسنجی پلن ورودی
    if (!planId || !(planId in serverPlans)) {
      return NextResponse.json(
        { message: "پلن اشتراک نامعتبر است." },
        { status: 400 }
      )
    }

    // ۴. محاسبه امن قیمت نهایی در سرور
    const selectedPlan = serverPlans[planId as keyof typeof serverPlans]
    let finalAmount = selectedPlan.priceRial
    let appliedDiscountCode = null

    if (discountCode && discountCode in serverDiscountCodes) {
      appliedDiscountCode = discountCode
      const codeDetails =
        serverDiscountCodes[discountCode as keyof typeof serverDiscountCodes]

      if ("discountPercent" in codeDetails) {
        finalAmount *= 1 - codeDetails.discountPercent / 100
      } else if ("discountAmountRial" in codeDetails) {
        finalAmount = Math.max(
          5000,
          finalAmount - codeDetails.discountAmountRial
        ) // حداقل مبلغ تراکنش طبق مستندات
      }
    }
    finalAmount = Math.round(finalAmount)

    // ۵. آماده‌سازی پارامترها برای ارسال به پی‌استار
    const gateway_id = process.env.PAYSTAR_GATEWAY_ID!
    const sign_key = process.env.PAYSTAR_SECRET_KEY!
    const order_id = `user_${user.id.substring(0, 8)}_${Date.now()}`
    const callback_url = `${process.env.NEXT_PUBLIC_APP_URL}/api/paystar/callback`
    const description = `خرید ${selectedPlan.name}${appliedDiscountCode ? ` (کد تخفیف: ${appliedDiscountCode})` : ""}`

    // ۶. ساخت امضای دیجیتال
    const sign_data = `${finalAmount}#${order_id}#${callback_url}`
    const sign = crypto
      .createHmac("sha512", sign_key)
      .update(sign_data)
      .digest("hex")

    // ۷. ارسال درخواست به درگاه پرداخت
    const response = await fetch(PAYSTAR_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${gateway_id}`
      },
      body: JSON.stringify({
        amount: finalAmount,
        order_id,
        callback: callback_url,
        sign,
        mail: user.email,
        description
      }),
      cache: "no-store"
    })

    const result = await response.json()
    if (result.status !== 1) {
      console.error("Paystar Error:", result.message)
      throw new Error(`خطا در ارتباط با درگاه پرداخت: ${result.message}`)
    }

    // ۸. ثبت اولیه تراکنش در دیتابیس با تمام جزئیات لازم
    const { error: dbError } = await supabase.from("transactions").insert({
      user_id: user.id,
      order_id: order_id,
      ref_num: result.data.ref_num,
      plan_id: planId,
      amount: finalAmount,
      status: "pending",
      discount_code: appliedDiscountCode
    })

    if (dbError) {
      console.error("Supabase Insert Error:", dbError)
      throw new Error("خطا در ثبت اطلاعات تراکنش در دیتابیس.")
    }

    // ۹. ارسال لینک پرداخت به کلاینت برای هدایت کاربر
    const paymentUrl = `https://api.paystar.shop/api/pardakht/payment?token=${result.data.token}`
    return NextResponse.json({ payment_url: paymentUrl })
  } catch (error: any) {
    console.error("[PAYMENT_CREATE_ERROR]", error)
    return NextResponse.json(
      { message: error.message || "یک خطای پیش‌بینی‌نشده در سرور رخ داد." },
      { status: 500 }
    )
  }
}
