/* --------------------------------------------------------------------------
   File: app/api/paystar/create/route.ts
   Description: [آماده برای آپدیت] - این فایل برای هماهنگی با الزامات جدید
                درگاه پرداخت (ارسال اطلاعات محصول) ویرایش شده است.
   -------------------------------------------------------------------------- */
import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createClient } from "@/lib/supabase/server"
import crypto from "crypto"

// [تغییر ۱] ✅: پلن‌ها را به کدهای محصولی که در پنل استارشاپ ثبت کرده‌اید، نگاشت کنید.
// این کدها جایگزین قیمت‌های ثابت قبلی می‌شوند.
const serverPlans = {
  monthly: {
    product_code: "PORSINO_MONTHLY_SUB", // <-- کد محصول خود را جایگزین کنید
    name: "اشتراک ماهانه"
  },
  yearly: {
    product_code: "PORSINO_YEARLY_SUB", // <-- کد محصول خود را جایگزین کنید
    name: "اشتراک سالانه"
  }
}

// کدهای تخفیف مثل قبل باقی می‌مانند. درگاه خودش تخفیف را روی محصولات اعمال می‌کند.
const serverDiscountCodes: Record<
  string,
  { discountPercent: number } | { discountAmountRial: number }
> = {
  SALE30: { discountPercent: 30 },
  SPECIAL100: { discountAmountRial: 1_000_000 },
  SUMMER25: { discountPercent: 99 }
}

const PAYSTAR_API_URL = "https://api.paystar.shop/api/pardakht/create"

export async function POST(req: Request) {
  const cookieStore = cookies()
  const supabase = createClient(cookieStore)

  try {
    const {
      data: { user }
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { message: "کاربر شناسایی نشد. لطفاً ابتدا وارد شوید." },
        { status: 401 }
      )
    }

    const { planId, discountCode, amount } = await req.json() // مبلغ نهایی از کلاینت دریافت می‌شود

    if (!planId || !(planId in serverPlans)) {
      return NextResponse.json(
        { message: "پلن اشتراک نامعتبر است." },
        { status: 400 }
      )
    }

    // [تغییر ۲] ✅: اطلاعات محصول انتخاب شده را بر اساس planId بگیرید.
    const selectedPlan = serverPlans[planId as keyof typeof serverPlans]
    const finalAmount = amount // مبلغ نهایی که در کلاینت محاسبه شده است.

    const gateway_id = process.env.PAYSTAR_GATEWAY_ID
    const sign_key = process.env.PAYSTAR_SECRET_KEY
    const app_url = "https://chat.porsino.org"

    if (!gateway_id || !sign_key) {
      throw new Error("پیکربندی سرور ناقص است.")
    }

    const order_id = `user_${user.id.substring(0, 8)}_${Date.now()}`
    const callback_url = `${app_url}/api/paystar/callback`

    // [تغییر ۳] ✅: نام پرداخت کننده را آماده کنید.
    // اگر نام کاربر را در پروفایل ذخیره کرده‌اید، از آن استفاده کنید.
    const payer_name =
      user.user_metadata?.full_name || user.email || "کاربر پرسینو"

    // [تغییر ۴] ❗️: سبد خرید را مطابق مستندات جدید بسازید.
    // این یک نمونه احتمالی است. باید ساختار دقیق را از مستندات جدید پیدا کنید.
    const cart = {
      products: [
        {
          code: selectedPlan.product_code,
          quantity: 1
        }
      ]
      // اگر کد تخفیف وجود دارد، ممکن است لازم باشد اینجا ارسال شود.
      // discount: { code: discountCode }
    }

    // [تغییر ۵] ❗️ مهم: فرمت ساخت امضا را بر اساس مستندات جدید بازنویسی کنید.
    // فرمت زیر فقط یک حدس است و به احتمال زیاد اشتباه است.
    // منتظر مستندات جدید بمانید و این بخش را با دقت جایگزین کنید.
    // مثال احتمالی: const sign_data = `${finalAmount}#${order_id}#${callback_url}#${JSON.stringify(cart)}`
    const sign_data = `${finalAmount}#${order_id}#${callback_url}` // <-- این خط باید با فرمت جدید جایگزین شود

    const sign = crypto
      .createHmac("sha512", sign_key)
      .update(sign_data)
      .digest("hex")

    // [تغییر ۶] ❗️: پارامترهای جدید را به body درخواست اضافه کنید.
    const body = {
      amount: finalAmount,
      order_id,
      callback: callback_url,
      sign,
      mail: user.email,
      description: `خرید ${selectedPlan.name}`,
      // --- فیلدهای جدید ---
      // نام فیلدها (payer_name و cart) ممکن است متفاوت باشد.
      payer_name: payer_name,
      cart: cart // یا هر نام دیگری که در مستندات جدید آمده است
      // اگر کد تخفیف را جداگانه باید ارسال کنید:
      // discount_code: discountCode || null
    }

    const response = await fetch(PAYSTAR_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${gateway_id}`
      },
      body: JSON.stringify(body),
      cache: "no-store"
    })

    const result = await response.json()
    if (result.status !== 1) {
      throw new Error(`خطا در ارتباط با درگاه پرداخت: ${result.message}`)
    }

    const { error: dbError } = await supabase.from("transactions").insert({
      user_id: user.id,
      order_id: order_id,
      ref_num: result.data.ref_num,
      plan_id: planId,
      amount: finalAmount,
      status: "pending",
      discount_code: discountCode || null
    })

    if (dbError) {
      throw new Error("خطا در ثبت اطلاعات تراکنش در دیتابیس.")
    }

    // [تغییر ۷] ✅: آدرس صفحه واسط درگاه.
    // طبق پیام، کاربر به یک صفحه واسط منتقل شده و سپس به درگاه می‌رود.
    // لینک دریافتی از درگاه احتمالاً همان لینک صفحه واسط است و این بخش نیازی به تغییر ندارد.
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
