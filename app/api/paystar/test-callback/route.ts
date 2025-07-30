/* --------------------------------------------------------------------------
   File: app/api/paystar/test-callback/route.ts
   Description: A test endpoint to simulate a successful payment callback
                and activate a user's subscription without a real payment.
   -------------------------------------------------------------------------- */
import { NextRequest, NextResponse } from "next/server"
import { createClient as createAdminClient } from "@supabase/supabase-js"

// مقادیر پلن‌ها را اینجا نیز تعریف می‌کنیم
const serverPlans = {
  monthly: { tokens: 1_000_000, durationDays: 30 },
  yearly: { tokens: 10_000_000, durationDays: 365 }
}

export async function GET(req: NextRequest) {
  const appUrl = "https://chat.porsino.org"

  try {
    // برای امنیت، می‌توانید یک کلید مخفی در Vercel تعریف کنید تا این API عمومی نباشد
    const secret = req.nextUrl.searchParams.get("secret")
    if (
      process.env.NODE_ENV === "production" &&
      secret !== process.env.TEST_CALLBACK_SECRET
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = req.nextUrl.searchParams.get("userId")
    const planId = req.nextUrl.searchParams.get(
      "planId"
    ) as keyof typeof serverPlans

    if (!userId || !planId || !(planId in serverPlans)) {
      throw new Error(
        "پارامترهای ورودی نامعتبر است. لطفاً 'userId' و یک 'planId' معتبر (monthly یا yearly) را وارد کنید."
      )
    }

    const planDetails = serverPlans[planId]

    // ساخت کلاینت ادمین برای دسترسی به دیتابیس
    const supabaseAdmin = createAdminClient(
      "https://fgxgwcagpbnlwbsmpdvh.supabase.co",
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // ۱. پیدا کردن ایمیل کاربر
    const {
      data: { user },
      error: adminError
    } = await supabaseAdmin.auth.admin.getUserById(userId)
    if (adminError || !user?.email) {
      throw new Error(`کاربری با شناسه ${userId} یافت نشد.`)
    }

    // ۲. فعال‌سازی مستقیم اشتراک (کپی شده از منطق callback اصلی)
    // آپدیت جدول token_usage
    await supabaseAdmin.from("token_usage").upsert(
      {
        user_email: user.email,
        limit_tokens: planDetails.tokens,
        used_tokens: 0,
        updated_at: new Date().toISOString()
      },
      { onConflict: "user_email" }
    )

    // آپدیت جدول profiles
    const expires_at = new Date()
    expires_at.setDate(expires_at.getDate() + planDetails.durationDays)
    await supabaseAdmin
      .from("profiles")
      .update({
        subscription_status: "active",
        subscription_expires_at: expires_at.toISOString()
      })
      .eq("user_id", userId)

    // ۳. (اختیاری) ثبت یک تراکنش تستی برای داشتن سابقه
    const order_id = `test_${userId.substring(0, 8)}_${Date.now()}`
    await supabaseAdmin.from("transactions").insert({
      user_id: userId,
      order_id: order_id,
      ref_num: "TEST_TRANSACTION",
      plan_id: planId,
      amount: 0,
      status: "success",
      discount_code: "TEST_CALLBACK",
      verified_at: new Date().toISOString()
    })

    // ۴. هدایت به صفحه موفقیت
    return NextResponse.redirect(
      `${appUrl}/payment-result?status=success&message=اشتراک تست با موفقیت فعال شد.&order_id=${order_id}`
    )
  } catch (error: any) {
    console.error("[TEST_CALLBACK_ERROR]", error)
    const query = new URLSearchParams({
      status: "error",
      message: `خطای تست: ${error.message}`
    })
    return NextResponse.redirect(`${appUrl}/payment-result?${query.toString()}`)
  }
}
