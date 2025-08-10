/* --------------------------------------------------------------------------
 * File: app/api/paystar/create/route.ts
 * Description: (REVISED) Connects product creation with payment.
 * 1. Directly calls the function to create the product in StarShop.
 * 2. Creates the payment transaction with Paystar.
 * -------------------------------------------------------------------------- */
import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createClient } from "@/lib/supabase/server"
import crypto from "crypto"
// [جدید] وارد کردن مستقیم تابع ایجاد محصول
import { createStarShopProduct } from "@/app/api/starshop/create-product/route"

// ۱. تعریف پلن‌ها و کدهای تخفیف در سمت سرور برای امنیت
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
  SUMMER25: { discountPercent: 99 }
}

const PAYSTAR_API_URL = "https://api.paystar.shop/api/pardakht/create"

// [مهم] آدرس کامل و صحیح سایت شما
const APP_BASE_URL = "https://chat.porsino.org"

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

    // ۴. ساخت یک شناسه یکتا که هم برای سفارش و هم برای کد محصول استفاده می‌شود
    const unique_code = `user_${user.id.substring(0, 8)}_${Date.now()}`

    // =======================================================================
    // [بخش اصلاح شده] ۵. ایجاد محصول در فروشگاه استارشاپ قبل از پرداخت
    // =======================================================================
    try {
      // فراخوانی مستقیم تابع به جای استفاده از fetch
      await createStarShopProduct(planId, unique_code)
      console.log(`Product ${unique_code} created successfully in StarShop.`)
    } catch (productError: any) {
      // اگر ایجاد محصول در استارشاپ با خطا مواجه شد، فرآیند را متوقف کن
      console.error("StarShop Product Creation Failed:", productError)
      return NextResponse.json(
        { message: productError.message || "مشکل در ارتباط با سیستم فروشگاه." },
        { status: 500 }
      )
    }
    // =======================================================================
    // [پایان بخش اصلاح شده]
    // =======================================================================

    // ۶. محاسبه امن قیمت نهایی در سرور
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
        )
      }
    }
    finalAmount = Math.round(finalAmount)

    // ۷. آماده‌سازی پارامترها برای درگاه پرداخت
    const gateway_id = process.env.PAYSTAR_GATEWAY_ID
    const sign_key = process.env.PAYSTAR_SECRET_KEY

    if (!gateway_id || !sign_key) {
      console.error(
        "Server configuration error: PAYSTAR_GATEWAY_ID or PAYSTAR_SECRET_KEY is missing."
      )
      throw new Error("پیکربندی سرور ناقص است. لطفاً با پشتیبانی تماس بگیرید.")
    }

    const order_id = unique_code // استفاده از همان کد یکتا به عنوان شناسه سفارش
    const callback_url = `${APP_BASE_URL}/api/paystar/callback`
    const description = `خرید ${selectedPlan.name}${appliedDiscountCode ? ` (کد تخفیف: ${appliedDiscountCode})` : ""}`

    // ۸. ساخت امضای دیجیتال
    const sign_data = `${finalAmount}#${order_id}#${callback_url}`
    const sign = crypto
      .createHmac("sha512", sign_key)
      .update(sign_data)
      .digest("hex")

    // ۹. ارسال درخواست به درگاه پرداخت
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

    // ۱۰. ثبت اولیه تراکنش در دیتابیس
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

    // ۱۱. ارسال لینک پرداخت به کلاینت
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
