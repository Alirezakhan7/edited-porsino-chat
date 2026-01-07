import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

/* -------------------------------------------------------------------------- */
/* CONFIG                                    */
/* -------------------------------------------------------------------------- */
const MERCHANT_ID = process.env.ZARINPAL_MERCHANT_ID
const APP_URL = process.env.APP_URL || "http://localhost:3000"
const CALLBACK_URL = `${APP_URL}/api/zarinpal/verify`

// آدرس‌های نسخه ۴ زرین‌پال
const ZARINPAL_REQUEST_URL =
  "https://payment.zarinpal.com/pg/v4/payment/request.json"
const ZARINPAL_GATEWAY_URL = "https://payment.zarinpal.com/pg/StartPay/"

/* -------------------------------------------------------------------------- */
/* PRICING (قیمت‌ها به ریال)                  */
/* -------------------------------------------------------------------------- */
const serverPlans = {
  bio_1m: { priceRial: 3_400_000, name: "زیست یک‌ماهه" },
  bio_6m: { priceRial: 16_720_000, name: "زیست شش‌ماهه" },
  bio_9m: { priceRial: 22_950_000, name: "زیست نه‌ماهه" }
} as const

// اگر نمی‌خواهید کد تخفیف فعالی باشد، این لیست را خالی کنید
const serverDiscountCodes: Record<
  string,
  { percent?: number; amount?: number }
> = {
  SUMMER99: { percent: 99 }
}

export async function POST(req: Request) {
  if (!MERCHANT_ID) {
    return NextResponse.json(
      { message: "Merchant ID تنظیم نشده است." },
      { status: 500 }
    )
  }

  const supabase = await createClient()

  // ۱. بررسی لاگین
  const {
    data: { user }
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ message: "ابتدا وارد شوید." }, { status: 401 })
  }

  try {
    const { planId, discountCode } = await req.json()

    // ۲. اعتبارسنجی پلن
    if (!planId || !(planId in serverPlans)) {
      return NextResponse.json({ message: "پلن نامعتبر است." }, { status: 400 })
    }
    const selectedPlan = serverPlans[planId as keyof typeof serverPlans]

    // ۳. محاسبه قیمت (ریال)
    let amountRial: number = selectedPlan.priceRial

    if (discountCode) {
      const d = serverDiscountCodes[discountCode.trim().toUpperCase()]
      if (d) {
        if (d.percent)
          amountRial = Math.round(amountRial * (1 - d.percent / 100))
        if (d.amount) amountRial = Math.max(1000, amountRial - d.amount)
      }
    }

    if (amountRial < 1000) {
      return NextResponse.json(
        { message: "مبلغ تراکنش کمتر از حد مجاز است." },
        { status: 400 }
      )
    }

    // ۴. درخواست به زرین‌پال
    // --- استخراج موبایل از ایمیل فیک (مثلاً 0912...@porsino.ir) ---
    const zarinpalMetadata: Record<string, string> = {
      email: user.email || ""
    }

    if (user.email && user.email.includes("@")) {
      // ایمیل را با "@" تکه می‌کنیم و قسمت اول را برمی‌داریم
      const emailParts = user.email.split("@")
      const potentialMobile = emailParts[0]

      // اگر قسمت اول فقط شامل اعداد بود، آن را موبایل فرض کن
      // (مثلاً اگر ایمیل 09391402427@porsino.ir باشد، اینجا 09391402427 استخراج می‌شود)
      if (/^\d+$/.test(potentialMobile)) {
        zarinpalMetadata.mobile = potentialMobile
      }
    }
    // -----------------------------------------------------------

    const payload = {
      merchant_id: MERCHANT_ID,
      amount: amountRial,
      currency: "IRR",
      callback_url: CALLBACK_URL,
      description: `خرید اشتراک ${selectedPlan.name}`,
      metadata: zarinpalMetadata
    }

    const zarinResponse = await fetch(ZARINPAL_REQUEST_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json"
      },
      body: JSON.stringify(payload)
    })

    const zarinResult = await zarinResponse.json()
    const { data, errors } = zarinResult

    if (!data || data.code !== 100) {
      console.error("Zarinpal Request Error:", errors || zarinResult)
      throw new Error(
        "خطا در ارتباط با درگاه پرداخت: " + (errors?.message || "Unknown")
      )
    }

    const authority = data.authority

    // ۵. ذخیره در دیتابیس
    const orderId = `ORD-${Date.now()}`

    const { error: dbError } = await supabase.from("transactions").insert({
      user_id: user.id,
      plan_id: planId,
      amount: amountRial,
      discount_code: discountCode || null,
      order_id: orderId,
      ref_num: authority,
      status: "pending"
    } as any) // جلوگیری از ارور تایپ‌اسکریپت

    if (dbError) {
      console.error("DB Insert Error:", dbError)
      // اینجا خطا را لاگ می‌کنیم اما چون لینک پرداخت گرفته شده، شاید بخواهید کاربر ادامه دهد
      // اما امن‌تر است که خطا دهیم:
      throw new Error("خطا در ثبت سفارش در سیستم")
    }

    // ۶. بازگشت لینک پرداخت
    return NextResponse.json({
      payment_url: `${ZARINPAL_GATEWAY_URL}${authority}`
    })
  } catch (error: any) {
    console.error("Create Payment Error:", error)
    return NextResponse.json(
      { message: error.message || "خطای سرور" },
      { status: 500 }
    )
  }
}
