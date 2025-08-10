/* --------------------------------------------------------------------------
 * File: app/api/starshop/create-product/route.ts
 * Description: API route to create a new product in the StarShop store
 * with automatic API key refreshing.
 * -------------------------------------------------------------------------- */
import { NextResponse } from "next/server"

// URL های وب‌سرویس استارشاپ
const STARSHOP_CREATE_PRODUCT_URL =
  "https://coreshop.paystar.shop/api/product/service/create"
const STARSHOP_REFRESH_TOKEN_URL = "https://coreshop.paystar.shop/api/api-key"

// [جدید] تعریف مشخصات هر دو پلن در یک آبجکت
const serverPlans = {
  monthly: { name: "اشتراک ماهانه", priceRial: 8_400_000 },
  yearly: { name: "اشتراک سالانه", priceRial: 70_560_000 }
}

/**
 * کش (Cache) درون حافظه برای نگهداری توکن
 * نکته مهم: در محیط‌های سرورلس مانند Vercel، این حافظه بین فراخوانی‌های مختلف
 * تابع پایدار نیست. برای محیط پروداکشن، بهتر است توکن و تاریخ انقضای آن را
 * در یک دیتابیس (مانند Supabase که استفاده می‌کنید) یا Vercel KV ذخیره کنید.
 * این کد برای سادگی از کش درون حافظه استفاده می‌کند.
 */
let tokenCache: {
  apiKey: string | null
  expiresAt: Date | null
} = {
  apiKey: null,
  expiresAt: null
}

/**
 * تابعی برای دریافت توکن API معتبر
 * این تابع ابتدا کش را بررسی می‌کند. اگر توکن نامعتبر یا منقضی شده باشد،
 * یک توکن جدید با استفاده از Refresh Token درخواست می‌کند.
 */
async function getValidApiKey(): Promise<string> {
  // بررسی اگر توکن در کش وجود دارد و هنوز معتبر است (بیش از ۵ دقیقه تا انقضا)
  if (
    tokenCache.apiKey &&
    tokenCache.expiresAt &&
    tokenCache.expiresAt > new Date(Date.now() + 5 * 60 * 1000)
  ) {
    return tokenCache.apiKey
  }

  // اگر توکن معتبر در کش نبود، یک توکن جدید درخواست کن
  console.log("API Key is expired or not available. Refreshing token...")

  const refreshToken = process.env.STARSHOP_REFRESH_TOKEN
  if (!refreshToken) {
    throw new Error(
      "STARSHOP_REFRESH_TOKEN is not defined in environment variables."
    )
  }

  const response = await fetch(STARSHOP_REFRESH_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh_token: refreshToken }),
    cache: "no-store"
  })

  const result = await response.json()

  if (result.status !== "ok") {
    console.error("Failed to refresh API key:", result)
    throw new Error(result.message || "Could not refresh API key.")
  }

  // ذخیره توکن جدید و تاریخ انقضای آن در کش
  const newApiKey = result.data.api_key
  const newExpiresAt = new Date(result.data.expires_at)

  tokenCache = {
    apiKey: newApiKey,
    expiresAt: newExpiresAt
  }

  console.log("Successfully refreshed API Key. New expiry:", newExpiresAt)

  return newApiKey
}

export async function POST(req: Request) {
  try {
    // ۰. دریافت کلید API معتبر (با قابلیت تمدید خودکار)
    const apiKey = await getValidApiKey()

    // ۱. خواندن اطلاعات ورودی (شناسه پلن و کد محصول)
    const { planId, product_code, description, unlimited, quantity } =
      await req.json()

    // ۲. اعتبارسنجی ورودی‌ها
    if (!planId || !product_code) {
      return NextResponse.json(
        {
          message: "شناسه پلن (planId) و کد محصول (product_code) الزامی هستند."
        },
        { status: 400 }
      )
    }

    const selectedPlan = serverPlans[planId as keyof typeof serverPlans]
    if (!selectedPlan) {
      return NextResponse.json(
        { message: "شناسه پلن نامعتبر است. باید 'monthly' یا 'yearly' باشد." },
        { status: 400 }
      )
    }

    // ۳. خواندن شناسه فروشگاه از متغیرهای محیطی
    const storeId = process.env.STARSHOP_STORE_ID
    if (!storeId) {
      throw new Error("STARSHOP_STORE_ID is missing in environment variables.")
    }

    // ۴. آماده‌سازی بدنه درخواست بر اساس پلن انتخاب شده
    const requestBody = {
      store_id: storeId,
      title: selectedPlan.name, // استفاده از نام پلن انتخاب شده
      description: description || `خرید ${selectedPlan.name}`,
      price: selectedPlan.priceRial, // استفاده از قیمت پلن انتخاب شده
      product_code: product_code,
      status: 1, // ۱ برای فعال
      price_type: 1, // ۱ برای قیمت ثابت
      unlimited: unlimited ?? true,
      quantity: unlimited ? null : Number(quantity || 0)
    }

    // ۵. ارسال درخواست به وب‌سرویس استارشاپ
    const response = await fetch(STARSHOP_CREATE_PRODUCT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify(requestBody),
      cache: "no-store"
    })

    const result = await response.json()

    // ۶. بررسی نتیجه و ارسال پاسخ مناسب
    if (result.status === "ok") {
      return NextResponse.json({
        message: "محصول با موفقیت ایجاد شد.",
        data: result.data
      })
    } else {
      console.error("StarShop API Error:", result)
      return NextResponse.json(
        {
          message: result.message || "خطا در ایجاد محصول.",
          errors: result.errors || null
        },
        { status: 422 }
      )
    }
  } catch (error: any) {
    console.error("[CREATE_PRODUCT_ERROR]", error)
    return NextResponse.json(
      { message: error.message || "یک خطای پیش‌بینی‌نشده در سرور رخ داد." },
      { status: 500 }
    )
  }
}
