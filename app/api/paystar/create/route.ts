/* --------------------------------------------------------------------------
    File: app/api/paystar/create/route.ts
    Description: ایجاد تراکنش پرداخت با ارسال سبد خرید (cart) و محاسبه مبلغ در سرور
    -------------------------------------------------------------------------- */
import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createClient } from "@/lib/supabase/server"
import crypto from "crypto"

// پلن‌ها ↔ کد محصول در استارشاپ
const serverPlans = {
  bio_1m: { product_code: "REPLACE_WITH_CODE_1M", name: "زیست یک‌ماهه" },
  bio_6m: { product_code: "REPLACE_WITH_CODE_6M", name: "زیست شش‌ماهه" },
  bio_9m: { product_code: "REPLACE_WITH_CODE_9M", name: "زیست نه‌ماهه" }
} as const

// قیمت‌ها (ریال) — مطابق porsino.org/pricing
const planPricesRial: Record<keyof typeof serverPlans, number> = {
  bio_1m: 3_400_000, // 340,000 تومان
  bio_6m: 16_720_000, // 1,672,000 تومان
  bio_9m: 22_950_000 // 2,295,000 تومان
}

// کدهای تخفیف (اختیاری)
const serverDiscountCodes: Record<
  string,
  { discountPercent?: number; discountAmountRial?: number }
> = {
  SUMMER25: { discountPercent: 99 }
}

const PAYSTAR_API_URL = "https://api.paystar.shop/api/pardakht/create"

export async function POST(req: Request) {
  const cookieStore = cookies()
  const supabase = createClient(cookieStore)
  const app_url_env = process.env.APP_URL || "https://chat.porsino.org"
  const allowedOrigin = new URL(app_url_env).origin
  const origin = req.headers.get("origin")
  if (origin && origin !== allowedOrigin) {
    return NextResponse.json(
      { message: "Origin نامعتبر است." },
      { status: 403 }
    )
  }

  try {
    // احراز هویت
    const {
      data: { user }
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { message: "کاربر شناسایی نشد. لطفاً ابتدا وارد شوید." },
        { status: 401 }
      )
    }

    // فقط planId و discountCode از کلاینت بگیریم (amount را نه!)
    const { planId, discountCode } = (await req.json()) as {
      planId?: keyof typeof serverPlans | string
      discountCode?: string
    }

    if (!planId || !(planId in serverPlans)) {
      return NextResponse.json(
        { message: "پلن اشتراک نامعتبر است." },
        { status: 400 }
      )
    }

    // انتخاب پلن و محاسبه مبلغ در سرور
    const selectedPlan = serverPlans[planId as keyof typeof serverPlans]
    let finalAmount = planPricesRial[planId as keyof typeof serverPlans]

    if (discountCode) {
      const d = serverDiscountCodes[discountCode.trim().toUpperCase()]
      if (d) {
        if (d.discountPercent && d.discountPercent > 0) {
          finalAmount = Math.round(finalAmount * (1 - d.discountPercent / 100))
        }
        if (d.discountAmountRial && d.discountAmountRial > 0) {
          finalAmount = Math.max(5_000, finalAmount - d.discountAmountRial)
        }
      }
    }

    if (!Number.isFinite(finalAmount) || finalAmount < 5_000) {
      return NextResponse.json(
        { message: "مبلغ نهایی نامعتبر است." },
        { status: 400 }
      )
    }

    // [FIX] Check for recent pending transactions BEFORE creating a new one.
    const { data: recentPending, error: checkError } = await supabase
      .from("transactions")
      .select("id, created_at")
      .eq("user_id", user.id)
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(1)

    if (checkError)
      console.error("Error checking recent pending transaction:", checkError)

    if (
      recentPending &&
      recentPending.length > 0 &&
      Date.now() - new Date(recentPending[0].created_at).getTime() < 60_000
    ) {
      return NextResponse.json(
        {
          message: "شما یک تراکنش در حال پردازش دارید. لطفاً ۱ دقیقه صبر کنید."
        },
        { status: 429 }
      )
    }

    // تنظیمات درگاه
    const gateway_id = process.env.PAYSTAR_GATEWAY_ID
    const sign_key = process.env.PAYSTAR_SECRET_KEY
    const app_url = process.env.APP_URL || "https://chat.porsino.org"

    if (!gateway_id || !sign_key) {
      throw new Error(
        "پیکربندی درگاه ناقص است. (PAYSTAR_GATEWAY_ID / PAYSTAR_SECRET_KEY)"
      )
    }

    // سفارش
    const order_id = `user_${user.id.substring(0, 8)}_${Date.now()}`
    const callback_url = `${app_url}/api/paystar/callback`

    // نام پرداخت‌کننده
    const payer_name =
      (user.user_metadata?.full_name as string | undefined) ||
      user.email ||
      "کاربر پرسینو"

    // سبد خرید طبق الزام جدید
    const cart = {
      products: [
        {
          code: selectedPlan.product_code,
          quantity: 1
        }
      ]
    }

    // امضا
    const sign_data = `${finalAmount}#${order_id}#${callback_url}`
    const sign = crypto
      .createHmac("sha512", sign_key)
      .update(sign_data)
      .digest("hex")

    // بدنه درخواست ایجاد تراکنش
    const body = {
      amount: finalAmount,
      order_id,
      callback: callback_url,
      sign,
      mail: user.email,
      payer_name,
      cart
    }

    // درخواست به Paystar
    const response = await fetch(PAYSTAR_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${gateway_id}`
      },
      body: JSON.stringify(body),
      cache: "no-store"
    })

    // اگر شبکه‌ای/HTTP خطا
    if (!response.ok) {
      const text = await response.text().catch(() => "")
      throw new Error(`HTTP ${response.status} از درگاه: ${text || "نامشخص"}`)
    }

    const result = await response.json().catch(() => ({}))

    // [تغییر] اینجا علاوه بر توکن، وجود ref_num را هم چک می‌کنیم
    if (
      result?.status !== 1 ||
      !result?.data?.token ||
      !result?.data?.ref_num
    ) {
      throw new Error(
        `خطا در ایجاد تراکنش: ${result?.message || "پاسخ نامعتبر یا ناقص از درگاه"}`
      )
    }

    // ثبت تراکنش در DB
    const { error: dbError } = await supabase.from("transactions").insert({
      user_id: user.id,
      order_id,
      ref_num: result.data.ref_num,
      plan_id: planId,
      amount: finalAmount,
      status: "pending",
      discount_code: discountCode || null
    })
    if (dbError) throw new Error("خطا در ثبت اطلاعات تراکنش در دیتابیس.")

    // آدرس پرداخت (صفحه واسط/درگاه)
    const paymentUrl = `https://api.paystar.shop/api/pardakht/payment?token=${result.data.token}`
    return NextResponse.json({ payment_url: paymentUrl })
  } catch (error: any) {
    console.error("[PAYMENT_CREATE_ERROR]", error)
    return NextResponse.json(
      { message: "خطا در ایجاد تراکنش. لطفاً دوباره تلاش کنید." },
      { status: 500 }
    )
  }
}
