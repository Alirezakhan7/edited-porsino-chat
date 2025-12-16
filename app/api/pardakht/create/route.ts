// app/api/pardakht/create/route.ts
import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import crypto from "crypto"

// پلن‌ها ↔ کد محصول (در صورت نیاز برای آنالیتیکس)
const serverPlans = {
  bio_1m: { product_code: "REPLACE_WITH_CODE_1M", name: "زیست یک‌ماهه" },
  bio_6m: { product_code: "REPLACE_WITH_CODE_6M", name: "زیست شش‌ماهه" },
  bio_9m: { product_code: "REPLACE_WITH_CODE_9M", name: "زیست نه‌ماهه" }
} as const

// قیمت‌ها (ریال) — مطابق pricing فعلی‌ات
const planPricesRial: Record<keyof typeof serverPlans, number> = {
  bio_1m: 3_400_000,
  bio_6m: 16_720_000,
  bio_9m: 22_950_000
}

// کدهای تخفیف (اختیاری)
const serverDiscountCodes: Record<
  string,
  { discountPercent?: number; discountAmountRial?: number }
> = {
  SUMMER25: { discountPercent: 99 }
}

// DirectPay
const DP_CREATE_URL = "https://api.directpay.click/api/pardakht/create"

export async function POST(req: Request) {
  console.log("[ENV_CHECK]", {
    GATEWAY_ID: process.env.DIRECTPAY_GATEWAY_ID,
    SECRET_KEY: process.env.DIRECTPAY_SECRET_KEY ? "✅ موجوده" : "❌ نیست",
    APP_URL: process.env.APP_URL
  })

  const supabase = await createClient()
  const db = supabase.schema("public")

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
      return NextResponse.json({ message: "ابتدا وارد شوید." }, { status: 401 })
    }

    // فقط planId و discountCode از کلاینت
    const { planId, discountCode } = (await req.json()) as {
      planId?: keyof typeof serverPlans | string
      discountCode?: string
    }

    if (!planId || !(planId in serverPlans)) {
      return NextResponse.json({ message: "پلن نامعتبر است." }, { status: 400 })
    }

    // planId را برای TS و insert کاملاً narrow می‌کنیم
    const safePlanId = planId as keyof typeof serverPlans

    // محاسبه مبلغ در سرور
    let finalAmount = planPricesRial[safePlanId]
    if (discountCode) {
      const d = serverDiscountCodes[discountCode.trim().toUpperCase()]
      if (d) {
        if (d.discountPercent) {
          finalAmount = Math.round(finalAmount * (1 - d.discountPercent / 100))
        }
        if (d.discountAmountRial) {
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

    // جلوگیری از اسپم (pending اخیر)
    const { data: recentPending, error: recentErr } = await db
      .from("transactions")
      .select("id, created_at")
      .eq("user_id", user.id)
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(1)

    if (recentErr) throw new Error(recentErr.message)

    const createdAt = recentPending?.[0]?.created_at
    if (createdAt) {
      const elapsed = Date.now() - new Date(createdAt).getTime()
      if (elapsed < 60_000) {
        return NextResponse.json(
          { message: "یک تراکنش در حال پردازش دارید. لطفاً ۱ دقیقه صبر کنید." },
          { status: 429 }
        )
      }
    }

    // پیکربندی DirectPay
    const gateway_id = process.env.DIRECTPAY_GATEWAY_ID
    const sign_key = process.env.DIRECTPAY_SECRET_KEY
    const app_url = app_url_env

    if (!gateway_id || !sign_key) {
      throw new Error(
        "پیکربندی درگاه ناقص است. (DIRECTPAY_GATEWAY_ID / DIRECTPAY_SECRET_KEY)"
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

    // امضای Create — amount#order_id#callback
    const sign_data = `${finalAmount}#${order_id}#${callback_url}`
    const sign = crypto
      .createHmac("sha512", sign_key)
      .update(sign_data)
      .digest("hex")

    // بدنه ایجاد تراکنش در DirectPay
    const body: any = {
      amount: finalAmount,
      order_id,
      callback: callback_url,
      sign,
      mail: user.email,
      name: payer_name
    }

    const response = await fetch(DP_CREATE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${gateway_id}`
      },
      body: JSON.stringify(body),
      cache: "no-store"
    })

    if (!response.ok) {
      const text = await response.text().catch(() => "")
      throw new Error(`HTTP ${response.status} از درگاه: ${text || "نامشخص"}`)
    }

    const result = await response.json().catch(() => ({}))
    if (
      result?.status !== 1 ||
      !result?.data?.token ||
      !result?.data?.ref_num
    ) {
      throw new Error(
        `خطا در ایجاد تراکنش: ${result?.message || "پاسخ نامعتبر یا ناقص از درگاه"}`
      )
    }

    // ثبت تراکنش pending
    const { error: dbError } = await db.from("transactions").insert({
      user_id: user.id,
      order_id,
      ref_num: result.data.ref_num,
      plan_id: safePlanId,
      amount: finalAmount,
      status: "pending",
      discount_code: discountCode || null
    })

    if (dbError) throw new Error("خطا در ثبت اطلاعات تراکنش در دیتابیس.")

    const paymentUrl = `https://api.directpay.click/api/pardakht/payment?token=${result.data.token}`
    return NextResponse.json({ payment_url: paymentUrl })
  } catch (error: any) {
    console.error("[DIRECTPAY_CREATE_ERROR]", error)
    return NextResponse.json(
      { message: "خطا در ایجاد تراکنش. لطفاً دوباره تلاش کنید." },
      { status: 500 }
    )
  }
}
