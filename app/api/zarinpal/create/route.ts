import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

/* -------------------------------------------------------------------------- */
/* CONFIG                                    */
/* -------------------------------------------------------------------------- */
const MERCHANT_ID = process.env.ZARINPAL_MERCHANT_ID
const APP_URL = process.env.APP_URL || "http://localhost:3000"
const CALLBACK_URL = `${APP_URL}/api/zarinpal/verify`

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
    // تغییر مهم: اضافه کردن : number برای اینکه بتوانیم قیمت را تغییر دهیم
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
    const payload = {
      merchant_id: MERCHANT_ID,
      amount: amountRial,
      currency: "IRR",
      callback_url: CALLBACK_URL,
      description: `خرید اشتراک ${selectedPlan.name}`,
      metadata: {
        // اصلاح مهم: تبدیل صریح به String
        mobile: user.user_metadata?.phone
          ? String(user.user_metadata.phone)
          : "",
        email: user.email || ""
      }
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
      console.error("Zarinpal Request Error:", errors)
      throw new Error("خطا در ارتباط با درگاه پرداخت")
    }

    const authority = data.authority

    // ۵. ذخیره در دیتابیس
    const orderId = `ORD-${Date.now()}`

    const { error: dbError } = await supabase.from("transactions").insert({
      user_id: user.id,
      plan_id: planId,
      amount: amountRial, // حالا که amountRial را نامبر کردیم، اینجا مشکلی ندارد
      discount_code: discountCode || null,
      order_id: orderId,
      ref_num: authority,
      status: "pending"
    } as any) // as any برای جلوگیری از خطای mismatch با تایپ دیتابیس

    if (dbError) {
      console.error("DB Error:", dbError)
      // بهتر است اینجا هم خطا پرتاب شود تا فرانت متوجه شود
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
