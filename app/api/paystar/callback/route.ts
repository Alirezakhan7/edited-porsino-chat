/* --------------------------------------------------------------------------
   File: app/api/paystar/callback/route.ts
   Description: Handles the callback from the Paystar payment gateway.
                This version is production-ready and redirects to an
                intermediary page to prevent cross-origin errors.
   -------------------------------------------------------------------------- */
import { NextRequest, NextResponse } from "next/server"
import { createClient as createAdminClient } from "@supabase/supabase-js"
import { createClient as createServerClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import crypto from "crypto"

const PAYSTAR_VERIFY_URL = "https://api.paystar.shop/api/pardakht/verify"

const serverPlans = {
  monthly: { tokens: 1_000_000, durationDays: 30 },
  yearly: { tokens: 10_000_000, durationDays: 365 }
}

async function handleCallback(req: NextRequest) {
  const cookieStore = cookies()
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

    if (!order_id || !ref_num) {
      throw new Error("اطلاعات بازگشتی از درگاه پرداخت ناقص است.")
    }

    const { data: transaction, error: findError } = await supabase
      .from("transactions")
      .select("*")
      .eq("order_id", order_id)
      .single()

    if (findError || !transaction) {
      throw new Error(`تراکنش با شناسه سفارش ${order_id} یافت نشد.`)
    }

    if (status !== "1") {
      await supabase
        .from("transactions")
        .update({ status: "failed" })
        .eq("order_id", order_id)
      // ✅ هدایت به صفحه واسط
      return NextResponse.redirect(
        `${appUrl}/payment/redirect?status=failed&message=تراکنش توسط شما لغو شد یا ناموفق بود.`
      )
    }

    if (transaction.status !== "pending") {
      // ✅ هدایت به صفحه واسط
      return NextResponse.redirect(
        `${appUrl}/payment/redirect?status=success&message=این تراکنش قبلاً با موفقیت پردازش شده است.`
      )
    }

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
    if (verifyResult.status !== 1) {
      throw new Error(`خطا در تایید نهایی تراکنش: ${verifyResult.message}`)
    }

    const planId = transaction.plan_id
    const planDetails = serverPlans[planId as keyof typeof serverPlans]
    if (!planDetails) {
      throw new Error(
        `جزئیات پلن برای شناسه '${planId}' در سرور تعریف نشده است.`
      )
    }

    const supabaseAdmin = createAdminClient(
      "https://fgxgwcagpbnlwbsmpdvh.supabase.co",
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

    const { error: tokenUsageError } = await supabaseAdmin
      .from("token_usage")
      .upsert(
        {
          user_email: user.email,
          limit_tokens: planDetails.tokens,
          used_tokens: 0,
          updated_at: new Date().toISOString()
        },
        { onConflict: "user_email" }
      )
    if (tokenUsageError)
      throw new Error(`خطا در آپدیت token_usage: ${tokenUsageError.message}`)

    const expires_at = new Date()
    expires_at.setDate(expires_at.getDate() + planDetails.durationDays)
    const { error: profilesError } = await supabaseAdmin
      .from("profiles")
      .update({
        subscription_status: "active",
        subscription_expires_at: expires_at.toISOString()
      })
      .eq("user_id", transaction.user_id)
    if (profilesError)
      throw new Error(`خطا در آپدیت profiles: ${profilesError.message}`)

    const { error: transactionUpdateError } = await supabaseAdmin
      .from("transactions")
      .update({
        status: "success",
        verified_at: new Date().toISOString(),
        ref_num: ref_num
      })
      .eq("order_id", order_id)
    if (transactionUpdateError)
      throw new Error(
        `خطا در آپدیت نهایی تراکنش: ${transactionUpdateError.message}`
      )

    // ✅ هدایت به صفحه واسط
    return NextResponse.redirect(
      `${appUrl}/payment/redirect?status=success&order_id=${order_id}`
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
    // ✅ هدایت به صفحه واسط
    return NextResponse.redirect(
      `${appUrl}/payment/redirect?${query.toString()}`
    )
  }
}

export async function GET(req: NextRequest) {
  return handleCallback(req)
}

export async function POST(req: NextRequest) {
  return handleCallback(req)
}
