/* --------------------------------------------------------------------------
   File: app/api/paystar/callback/route.ts
   Description: Handles the callback from the Paystar payment gateway.
                This version creates a dedicated admin client to securely
                fetch user data and activate subscriptions.
   -------------------------------------------------------------------------- */
import { NextRequest, NextResponse } from "next/server"
// ✅ برای جلوگیری از تداخل نام، برای هر دو تابع از نام‌های مستعار و واضح استفاده می‌کنیم
import { createClient as createAdminClient } from "@supabase/supabase-js"
import { createClient as createServerClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import crypto from "crypto"

const PAYSTAR_VERIFY_URL = "https://api.paystar.shop/api/pardakht/verify"

const serverPlans = {
  monthly: { tokens: 1_000_000, durationDays: 30 },
  yearly: { tokens: 10_000_000, durationDays: 365 }
}

// این تابع در هر دو حالت GET و POST استفاده خواهد شد
async function handleCallback(req: NextRequest) {
  console.log(`[CALLBACK_LOG] Received request with method: ${req.method}`)
  const cookieStore = cookies()
  // ✅ استفاده از نام مستعار صحیح برای ساخت کلاینت معمولی
  const supabase = createServerClient(cookieStore)
  const appUrl = "https://chat.porsino.org"
  let order_id_for_redirect: string | null = null

  try {
    let status: string | null
    let order_id: string | null
    let ref_num: string | null
    let card_number: string | null
    let tracking_code: string | null

    if (req.method === "POST") {
      const formData = await req.formData()
      status = formData.get("status") as string
      order_id = formData.get("order_id") as string
      ref_num = formData.get("ref_num") as string
      card_number = formData.get("card_number") as string
      tracking_code = formData.get("tracking_code") as string
    } else {
      // Handle GET request
      const searchParams = req.nextUrl.searchParams
      status = searchParams.get("status")
      order_id = searchParams.get("order_id")
      ref_num = searchParams.get("ref_num")
      card_number = searchParams.get("card_number")
      tracking_code = searchParams.get("tracking_code")
    }

    order_id_for_redirect = order_id
    console.log(
      `[CALLBACK_LOG] Parsed data: order_id=${order_id}, status=${status}, ref_num=${ref_num}`
    )

    if (!order_id || !ref_num) {
      throw new Error("اطلاعات بازگشتی از درگاه پرداخت ناقص است.")
    }

    console.log("[CALLBACK_LOG] Step 1: Finding transaction in DB...")
    const { data: transaction, error: findError } = await supabase
      .from("transactions")
      .select("*")
      .eq("order_id", order_id)
      .single()

    if (findError || !transaction) {
      throw new Error(`تراکنش با شناسه سفارش ${order_id} یافت نشد.`)
    }
    console.log("[CALLBACK_LOG] Step 1 successful. Transaction found.")

    if (status !== "1") {
      console.log(
        "[CALLBACK_LOG] Transaction status is not successful. Updating status to 'failed'."
      )
      await supabase
        .from("transactions")
        .update({ status: "failed" })
        .eq("order_id", order_id)
      return NextResponse.redirect(
        `${appUrl}/payment-result?status=failed&message=تراکنش توسط شما لغو شد یا ناموفق بود.`
      )
    }

    if (transaction.status !== "pending") {
      console.log("[CALLBACK_LOG] Transaction already processed.")
      return NextResponse.redirect(
        `${appUrl}/payment-result?status=success&message=این تراکنش قبلاً با موفقیت پردازش شده است.`
      )
    }

    console.log("[CALLBACK_LOG] Step 2: Verifying transaction with Paystar...")
    const gateway_id = process.env.PAYSTAR_GATEWAY_ID!
    const sign_key = process.env.PAYSTAR_SECRET_KEY!
    const verify_sign_data = `${transaction.amount}#${ref_num}#${card_number || ""}#${tracking_code || ""}`
    const sign = crypto
      .createHmac("sha512", sign_key)
      .update(verify_sign_data)
      .digest("hex")

    const verifyResponse = await fetch(PAYSTAR_VERIFY_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${gateway_id}`
      },
      body: JSON.stringify({ ref_num, amount: transaction.amount, sign }),
      cache: "no-store"
    })

    const verifyResult = await verifyResponse.json()
    console.log("[CALLBACK_LOG] Paystar verify response:", verifyResult)
    if (verifyResult.status !== 1) {
      throw new Error(`خطا در تایید نهایی تراکنش: ${verifyResult.message}`)
    }
    console.log("[CALLBACK_LOG] Step 2 successful. Transaction verified.")

    console.log("[CALLBACK_LOG] Step 3: Activating user subscription...")
    const planId = transaction.plan_id
    const planDetails = serverPlans[planId as keyof typeof serverPlans]
    if (!planDetails) {
      throw new Error(
        `جزئیات پلن برای شناسه '${planId}' در سرور تعریف نشده است.`
      )
    }

    // ✅ ساخت کلاینت ادمین با نام مستعار و آدرس دستی
    const supabaseAdmin = createAdminClient(
      "https://fgxgwcagpbnlwbsmpdvh.supabase.co", // 🔴 مهم: این آدرس باید با آدرس پروژه شما در Supabase یکسان باشد
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const {
      data: { user },
      error: adminError
    } = await supabaseAdmin.auth.admin.getUserById(transaction.user_id)

    if (adminError || !user?.email) {
      console.error("[ADMIN_ERROR] Supabase admin error:", adminError)
      throw new Error("ایمیل کاربر برای به‌روزرسانی سهمیه توکن یافت نشد.")
    }

    await supabase.from("token_usage").upsert(
      {
        user_email: user.email,
        limit_tokens: planDetails.tokens,
        used_tokens: 0,
        updated_at: new Date().toISOString()
      },
      { onConflict: "user_email" }
    )

    const expires_at = new Date()
    expires_at.setDate(expires_at.getDate() + planDetails.durationDays)
    await supabase
      .from("profiles")
      .update({
        subscription_status: "active",
        subscription_expires_at: expires_at.toISOString()
      })
      .eq("user_id", transaction.user_id)

    await supabase
      .from("transactions")
      .update({
        status: "success",
        verified_at: new Date().toISOString(),
        ref_num: ref_num
      })
      .eq("order_id", order_id)
    console.log("[CALLBACK_LOG] Step 3 successful. Subscription activated.")

    console.log("[CALLBACK_LOG] Step 4: Redirecting to success page...")
    return NextResponse.redirect(
      `${appUrl}/payment-result?status=success&order_id=${order_id}`
    )
  } catch (error: any) {
    console.error("[PAYMENT_CALLBACK_ERROR]", error)
    const query = new URLSearchParams({
      status: "error",
      message: error.message || "یک خطای پیش‌بینی‌نشده رخ داد."
    })
    if (order_id_for_redirect) {
      query.set("order_id", order_id_for_redirect)
    }
    return NextResponse.redirect(`${appUrl}/payment-result?${query.toString()}`)
  }
}

export async function GET(req: NextRequest) {
  return handleCallback(req)
}

export async function POST(req: NextRequest) {
  return handleCallback(req)
}
