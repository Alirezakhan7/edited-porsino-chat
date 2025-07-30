/* --------------------------------------------------------------------------
   File: app/api/paystar/test-callback/route.ts
   Description: A test endpoint with extensive logging to debug subscription
                activation issues.
   -------------------------------------------------------------------------- */
import { NextRequest, NextResponse } from "next/server"
import { createClient as createAdminClient } from "@supabase/supabase-js"

// مقادیر پلن‌ها را اینجا نیز تعریف می‌کنیم
const serverPlans = {
  monthly: { tokens: 1_000_000, durationDays: 30 },
  yearly: { tokens: 10_000_000, durationDays: 365 }
}

export async function GET(req: NextRequest) {
  console.log("[TEST_LOG] Test callback endpoint initiated.")
  const appUrl = "https://chat.porsino.org"

  try {
    /*
    // ✅ این بخش امنیتی به صورت موقت غیرفعال شده است تا بتوانید مشکل اصلی را تست کنید
    // برای امنیت، می‌توانید یک کلید مخفی در Vercel تعریف کنید تا این API عمومی نباشد
    const secret = req.nextUrl.searchParams.get("secret");
    if (process.env.NODE_ENV === 'production' && secret !== process.env.TEST_CALLBACK_SECRET) {
        console.warn("[TEST_LOG] Unauthorized access attempt blocked.");
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    */

    const userId = req.nextUrl.searchParams.get("userId")
    const planId = req.nextUrl.searchParams.get(
      "planId"
    ) as keyof typeof serverPlans
    console.log(`[TEST_LOG] Parsed Params: userId=${userId}, planId=${planId}`)

    if (!userId || !planId || !(planId in serverPlans)) {
      throw new Error(
        "پارامترهای ورودی نامعتبر است. لطفاً 'userId' و یک 'planId' معتبر (monthly یا yearly) را وارد کنید."
      )
    }

    const planDetails = serverPlans[planId]
    console.log(`[TEST_LOG] Plan details found for '${planId}'.`)

    // بررسی وجود متغیرهای محیطی قبل از استفاده
    const supabaseUrl = "https://fgxgwcagpbnlwbsmpdvh.supabase.co"
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!serviceRoleKey) {
      console.error(
        "[TEST_LOG] CRITICAL: SUPABASE_SERVICE_ROLE_KEY is not defined in environment variables."
      )
      throw new Error("پیکربندی سرور ناقص است: کلید امنیتی Supabase یافت نشد.")
    }
    console.log("[TEST_LOG] SUPABASE_SERVICE_ROLE_KEY is present.")

    // ساخت کلاینت ادمین برای دسترسی به دیتابیس
    console.log("[TEST_LOG] Creating Supabase admin client...")
    const supabaseAdmin = createAdminClient(supabaseUrl, serviceRoleKey)
    console.log("[TEST_LOG] Supabase admin client created successfully.")

    // ۱. پیدا کردن ایمیل کاربر
    console.log(`[TEST_LOG] Step 1: Fetching user with ID: ${userId}`)
    const {
      data: { user },
      error: adminError
    } = await supabaseAdmin.auth.admin.getUserById(userId)

    if (adminError) {
      console.error(
        `[TEST_LOG] Supabase admin error while fetching user:`,
        adminError
      )
    }
    if (!user) {
      console.error(
        `[TEST_LOG] User object is null or undefined for ID: ${userId}`
      )
    }

    if (adminError || !user?.email) {
      throw new Error(`کاربری با شناسه ${userId} یافت نشد یا ایمیل ندارد.`)
    }
    console.log(
      `[TEST_LOG] Step 1 successful. Found user with email: ${user.email}`
    )

    // ۲. فعال‌سازی مستقیم اشتراک
    console.log(
      `[TEST_LOG] Step 2: Activating subscription for user: ${user.email}`
    )

    console.log("[TEST_LOG] Updating 'token_usage' table...")
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
    console.log("[TEST_LOG] 'token_usage' table updated successfully.")

    console.log("[TEST_LOG] Updating 'profiles' table...")
    const expires_at = new Date()
    expires_at.setDate(expires_at.getDate() + planDetails.durationDays)
    const { error: profilesError } = await supabaseAdmin
      .from("profiles")
      .update({
        subscription_status: "active",
        subscription_expires_at: expires_at.toISOString()
      })
      .eq("user_id", userId)
    if (profilesError)
      throw new Error(`خطا در آپدیت profiles: ${profilesError.message}`)
    console.log("[TEST_LOG] 'profiles' table updated successfully.")

    // ۳. ثبت یک تراکنش تستی
    console.log("[TEST_LOG] Step 3: Inserting test transaction record...")
    const order_id = `test_${userId.substring(0, 8)}_${Date.now()}`
    const { error: transactionError } = await supabaseAdmin
      .from("transactions")
      .insert({
        user_id: userId,
        order_id: order_id,
        ref_num: "TEST_TRANSACTION",
        plan_id: planId,
        amount: 0,
        status: "success",
        discount_code: "TEST_CALLBACK",
        verified_at: new Date().toISOString()
      })
    if (transactionError)
      throw new Error(`خطا در ثبت تراکنش تستی: ${transactionError.message}`)
    console.log("[TEST_LOG] Test transaction inserted successfully.")

    // ۴. هدایت به صفحه موفقیت
    console.log("[TEST_LOG] Step 4: Redirecting to success page...")
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
