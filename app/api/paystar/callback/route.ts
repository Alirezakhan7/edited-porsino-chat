/* --------------------------------------------------------------------------
     File: app/api/paystar/callback/route.ts
     Description: Handles the callback from the Paystar payment gateway.
                  This version uses the admin client for all DB operations
                  to bypass RLS, as the callback has no user session.
     -------------------------------------------------------------------------- */
import { NextRequest, NextResponse } from "next/server"
import { createClient as createAdminClient } from "@supabase/supabase-js"
// [حذف شد] دیگر به createServerClient و cookies نیازی نیست
// import { createClient as createServerClient } from "@/lib/supabase/server"
// import { cookies } from "next/headers"
import crypto from "crypto"

const PAYSTAR_VERIFY_URL = "https://api.paystar.shop/api/pardakht/verify"

const serverPlans = {
  bio_1m: { tokens: 1_000_000, durationDays: 30 },
  bio_6m: { tokens: 6_000_000, durationDays: 180 },
  bio_9m: { tokens: 9_000_000, durationDays: 270 }
} as const

// Helper function to create the client-side redirect response
function createRedirectResponse(appUrl: string, query: URLSearchParams) {
  const redirectUrl = `${appUrl}/payment-result?${query.toString()}`
  return new NextResponse(
    `<!DOCTYPE html>
    <html>
      <head>
        <meta http-equiv="refresh" content="0; url=${redirectUrl}" />
        <script>window.location.href = "${redirectUrl}";</script>
      </head>
      <body><p>در حال انتقال...</p></body>
    </html>`,
    { headers: { "Content-Type": "text/html" } }
  )
}

async function handleCallback(req: NextRequest) {
  const appUrl = "https://chat.porsino.org"
  let order_id_for_redirect: string | null = null

  try {
    // [تغییر] کلاینت ادمین را در ابتدای تابع می‌سازیم تا در همه‌جا قابل استفاده باشد
    const supabaseAdmin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!, // SUPABASE_URL را هم اضافه کنید
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

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

    // [تغییر] استفاده از supabaseAdmin
    const { data: transaction, error: findError } = await supabaseAdmin
      .from("transactions")
      .select("*")
      .eq("order_id", order_id)
      .single()

    if (findError || !transaction) {
      throw new Error(`تراکنش با شناسه سفارش ${order_id} یافت نشد.`)
    }

    if (transaction.ref_num !== ref_num) {
      // [تغییر] استفاده از supabaseAdmin
      await supabaseAdmin
        .from("transactions")
        .update({
          status: "failed"
        })
        .eq("order_id", order_id)
      throw new Error("شماره پیگیری تراکنش با اطلاعات ثبت‌شده مغایرت دارد.")
    }

    if (status !== "1") {
      // [تغییر] استفاده از supabaseAdmin
      await supabaseAdmin
        .from("transactions")
        .update({ status: "failed" })
        .eq("order_id", order_id)
      const query = new URLSearchParams({
        status: "failed",
        message: "تراکنش توسط شما لغو شد یا ناموفق بود."
      })
      return createRedirectResponse(appUrl, query)
    }

    if (transaction.status === "success") {
      const query = new URLSearchParams({
        status: "success",
        message: "این تراکنش قبلاً با موفقیت پردازش شده است."
      })
      return createRedirectResponse(appUrl, query)
    }

    if (transaction.status === "failed") {
      const query = new URLSearchParams({
        status: "failed",
        message:
          "این تراکنش قبلاً ناموفق بوده و امکان پردازش مجدد آن وجود ندارد."
      })
      return createRedirectResponse(appUrl, query)
    }

    const gateway_id = process.env.PAYSTAR_GATEWAY_ID!
    const sign_key = process.env.PAYSTAR_SECRET_KEY!
    const verify_sign_data = `${transaction.amount}#${ref_num}#${
      card_number || ""
    }#${tracking_code || ""}`
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
      // [تغییر] استفاده از supabaseAdmin
      await supabaseAdmin
        .from("transactions")
        .update({
          status: "failed"
        })
        .eq("order_id", order_id)
      throw new Error(`خطا در تایید نهایی تراکنش: ${verifyResult.message}`)
    }

    const planId = transaction.plan_id
    const planDetails = serverPlans[planId as keyof typeof serverPlans]
    if (!planDetails) {
      throw new Error(
        `جزئیات پلن برای شناسه '${planId}' در سرور تعریف نشده است.`
      )
    }

    // [نکته] این بخش کد شما از قبل درست بود و از supabaseAdmin استفاده می‌کرد
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
        verified_at: new Date().toISOString()
      })
      .eq("order_id", order_id)
    if (transactionUpdateError)
      throw new Error(
        `خطا در آپدیت نهایی تراکنش: ${transactionUpdateError.message}`
      )

    const query = new URLSearchParams({ status: "success", order_id: order_id })
    return createRedirectResponse(appUrl, query)
  } catch (error: any) {
    console.error("[PAYMENT_CALLBACK_ERROR]", error)
    const query = new URLSearchParams({
      status: "error",
      message: error.message || "یک خطای پیش‌بینی‌نشده رخ داد."
    })
    if (order_id_for_redirect) {
      query.set("order_id", order_id_for_redirect)
    }
    return createRedirectResponse(appUrl, query)
  }
}

export async function GET(req: NextRequest) {
  return handleCallback(req)
}

export async function POST(req: NextRequest) {
  return handleCallback(req)
}
