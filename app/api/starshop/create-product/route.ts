/* --------------------------------------------------------------------------
 * File: app/api/starshop/create-product/route.ts
 * Description: (REVISED) API route to create a new product in the StarShop store
 * with automatic API key refreshing and robust error handling.
 * -------------------------------------------------------------------------- */
import { NextResponse } from "next/server"

// URL های وب‌سرویس استارشاپ
const STARSHOP_CREATE_PRODUCT_URL =
  "https://coreshop.paystar.shop/api/product/service/create"
const STARSHOP_REFRESH_TOKEN_URL = "https://coreshop.paystar.shop/api/api-key"

// تعریف مشخصات هر دو پلن در یک آبجکت
const serverPlans = {
  monthly: { name: "اشتراک ماهانه", priceRial: 8_400_000 },
  yearly: { name: "اشتراک سالانه", priceRial: 70_560_000 }
}

let tokenCache: {
  apiKey: string | null
  expiresAt: Date | null
} = {
  apiKey: null,
  expiresAt: null
}

async function getValidApiKey(): Promise<string> {
  if (
    tokenCache.apiKey &&
    tokenCache.expiresAt &&
    tokenCache.expiresAt > new Date(Date.now() + 5 * 60 * 1000)
  ) {
    return tokenCache.apiKey
  }

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

  // [اصلاح شده] بررسی دقیق پاسخ قبل از تلاش برای پارس کردن JSON
  const contentType = response.headers.get("content-type")
  if (
    !response.ok ||
    !contentType ||
    !contentType.includes("application/json")
  ) {
    const textResponse = await response.text()
    console.error(
      "StarShop Refresh Token Failed. Received non-JSON response:",
      {
        status: response.status,
        statusText: response.statusText,
        body: textResponse
      }
    )
    throw new Error(
      "خطا در تمدید توکن با استارشاپ. ممکن است Refresh Token نامعتبر باشد."
    )
  }

  const result = await response.json()

  if (result.status !== "ok") {
    console.error("Failed to refresh API key:", result)
    throw new Error(result.message || "Could not refresh API key.")
  }

  const newApiKey = result.data.api_key
  const newExpiresAt = new Date(result.data.expires_at)

  tokenCache = {
    apiKey: newApiKey,
    expiresAt: newExpiresAt
  }

  console.log("Successfully refreshed API Key. New expiry:", newExpiresAt)
  return newApiKey
}

// [جدید] منطق اصلی ایجاد محصول به این تابع منتقل و export شده است
export async function createStarShopProduct(
  planId: string,
  product_code: string
) {
  const apiKey = await getValidApiKey()

  const selectedPlan = serverPlans[planId as keyof typeof serverPlans]
  if (!selectedPlan) {
    throw new Error("شناسه پلن نامعتبر است. باید 'monthly' یا 'yearly' باشد.")
  }

  const storeId = process.env.STARSHOP_STORE_ID
  if (!storeId) {
    throw new Error("STARSHOP_STORE_ID is missing in environment variables.")
  }

  const requestBody = {
    store_id: storeId,
    title: selectedPlan.name,
    description: `خرید ${selectedPlan.name}`,
    price: selectedPlan.priceRial,
    product_code: product_code,
    status: 1,
    price_type: 1,
    unlimited: true,
    quantity: null
  }

  const response = await fetch(STARSHOP_CREATE_PRODUCT_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify(requestBody),
    cache: "no-store"
  })

  if (!response.ok) {
    const errorResult = await response.json().catch(() => response.text())
    console.error("StarShop Create Product API Error:", errorResult)
    throw new Error(
      (typeof errorResult === "object" && errorResult.message) ||
        "خطا در ایجاد محصول در استارشاپ."
    )
  }

  const result = await response.json()

  if (result.status !== "ok") {
    throw new Error(
      result.message || "خطا در ایجاد محصول در استارشاپ پس از دریافت پاسخ موفق."
    )
  }

  return result.data
}

// این تابع POST فقط یک پوشش برای فراخوانی از طریق وب است
export async function POST(req: Request) {
  try {
    const { planId, product_code } = await req.json()
    if (!planId || !product_code) {
      return NextResponse.json(
        { message: "planId and product_code are required." },
        { status: 400 }
      )
    }
    const productData = await createStarShopProduct(planId, product_code)
    return NextResponse.json({
      message: "محصول با موفقیت ایجاد شد.",
      data: productData
    })
  } catch (error: any) {
    console.error("[CREATE_PRODUCT_API_ERROR]", error)
    return NextResponse.json(
      { message: error.message || "یک خطای پیش‌بینی‌نشده در سرور رخ داد." },
      { status: 500 }
    )
  }
}
