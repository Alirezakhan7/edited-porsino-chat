// app/[locale]/login/actions.ts
"use server"

import { createClient } from "@/lib/supabase/server"
import { createClient as createSupabaseClient } from "@supabase/supabase-js"
import { redirect } from "next/navigation"

// تابع کمکی برای ساخت کلاینت ادمین (فقط در این فایل استفاده می‌شود)
function getAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )
}
// تابع تبدیل اعداد فارسی/عربی به انگلیسی
function toEnglishDigits(str: string) {
  if (!str) return str
  return str
    .replace(/[۰-۹]/g, d => "۰۱۲۳۴۵۶۷۸۹".indexOf(d).toString())
    .replace(/[٠-٩]/g, d => "٠١٢٣٤٥٦٧٨٩".indexOf(d).toString())
}

// ----------------------------------------------------------------
// 1️⃣ تابع ورود (Login) - فقط با موبایل
// ----------------------------------------------------------------
export async function signIn(formData: FormData) {
  const rawIdentifier = formData.get("identifier") as string
  const identifier = toEnglishDigits(rawIdentifier) // نرمال‌سازی

  const password = formData.get("password") as string
  const supabase = await createClient()

  // حالا چک کردن فرمت درست کار می‌کند
  if (!/^09[0-9]{9}$/.test(identifier)) {
    return { message: "لطفاً یک شماره موبایل معتبر وارد کنید." }
  }

  const supabaseAdmin = getAdminClient()

  // 2. پیدا کردن کاربر بر اساس موبایل
  const { data: profile } = await (supabaseAdmin.from("profiles") as any)
    .select("user_id")
    .eq("mobile", identifier)
    .single()

  if (!profile) {
    return {
      message: "کاربری با این شماره موبایل یافت نشد. ابتدا ثبت‌نام کنید."
    }
  }

  // 3. ساخت ایمیل فیک برای لاگین
  const emailToLogin = `${identifier}@porsino.ir`

  const { error } = await supabase.auth.signInWithPassword({
    email: emailToLogin,
    password
  })

  if (error) {
    return { message: "رمز عبور اشتباه است" } // پیام کلی برای امنیت
  }

  return redirect("/chat")
}

// ----------------------------------------------------------------
// 2️⃣ تابع ارسال کد OTP
// ----------------------------------------------------------------
// ----------------------------------------------------------------
// 2️⃣ تابع ارسال کد OTP (اصلاح شده)
// ----------------------------------------------------------------
export async function sendOtp(formData: FormData) {
  const rawMobile = formData.get("mobile") as string
  const mobile = toEnglishDigits(rawMobile)

  const supabaseAdmin = getAdminClient()

  // 1. چک کردن اینکه آیا کاربر از قبل وجود دارد؟
  const { data: existingUser } = await (supabaseAdmin.from("profiles") as any)
    .select("id")
    .eq("mobile", mobile)
    .single()

  if (existingUser) {
    return {
      success: false,
      message: "این شماره قبلاً ثبت‌نام شده است. لطفاً وارد شوید."
    }
  }

  // 2. محدودیت زمانی (Cooldown) - هر ۲ دقیقه یکبار
  const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000).toISOString()

  const { data: recentCode } = await (
    supabaseAdmin.from("verification_codes") as any
  )
    .select("created_at")
    .eq("mobile", mobile)
    .gt("created_at", twoMinutesAgo)
    .order("created_at", { ascending: false })
    .limit(1)
    .single()

  if (recentCode) {
    return {
      success: false,
      message: "لطفاً برای درخواست مجدد ۲ دقیقه صبر کنید."
    }
  }

  // 3. محدودیت تعداد (Rate Limit) - حداکثر ۵ بار در ساعت
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()

  const { count } = await (supabaseAdmin.from("verification_codes") as any)
    .select("*", { count: "exact", head: true })
    .eq("mobile", mobile)
    .gt("created_at", oneHourAgo)

  if (count !== null && count >= 5) {
    return {
      success: false,
      message:
        "تعداد درخواست‌های شما بیش از حد مجاز است. لطفاً یک ساعت دیگر تلاش کنید."
    }
  }

  // 4. پاکسازی کدهای خیلی قدیمی (مثلاً قدیمی‌تر از ۲ ساعت) برای جلوگیری از شلوغی دیتابیس
  // نکته: کدهای زیر ۱ ساعت را پاک نمی‌کنیم تا بتوانیم محدودیت تعداد را چک کنیم
  const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
  await (supabaseAdmin.from("verification_codes") as any)
    .delete()
    .eq("mobile", mobile)
    .lt("created_at", twoHoursAgo)

  // 5. تولید و ذخیره کد جدید
  const code = Math.floor(10000 + Math.random() * 90000).toString()

  const { error: dbError } = await (
    supabaseAdmin.from("verification_codes") as any
  ).insert({
    mobile,
    code,
    expires_at: new Date(Date.now() + 2 * 60 * 1000).toISOString() // اعتبار: ۲ دقیقه
  })

  if (dbError) {
    console.error(dbError)
    return { success: false, message: "خطا در سرور داخلی" }
  }

  // 6. ارسال پیامک
  try {
    const res = await fetch("https://api.sms.ir/v1/send/verify", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.SMS_IR_API_KEY!
      },
      body: JSON.stringify({
        mobile: mobile,
        templateId: Number(process.env.SMS_IR_TEMPLATE_ID),
        parameters: [{ name: "Code", value: code }]
      })
    })

    const result = await res.json()
    if (result.status !== 1) {
      console.error("SMS Error:", result)
      // اگر پیامک نرفت، رکورد دیتابیس را پاک کنیم که کاربر بلاک نشود
      await (supabaseAdmin.from("verification_codes") as any)
        .delete()
        .eq("mobile", mobile)
        .eq("code", code)

      return { success: false, message: "خطا در ارسال پیامک." }
    }

    return { success: true, message: "کد تایید ارسال شد" }
  } catch (error) {
    console.error(error)
    return { success: false, message: "خطا در ارتباط با پنل پیامکی" }
  }
}

// ----------------------------------------------------------------
// 3️⃣ تابع تایید و ثبت نام
// ----------------------------------------------------------------
// ----------------------------------------------------------------
// 3️⃣ تابع تایید و ثبت نام (نسخه امنیتی و اصلاح شده)
// ----------------------------------------------------------------
export async function verifyAndSignUp(formData: FormData) {
  const rawMobile = formData.get("mobile") as string
  const mobile = toEnglishDigits(rawMobile)

  const rawCode = formData.get("otp") as string
  const code = toEnglishDigits(rawCode) // مهم: کاربر ممکن است کد تایید را هم فارسی بزند

  const password = formData.get("password") as string
  const rawReferral = formData.get("referral-code") as string
  const referralCode = toEnglishDigits(rawReferral)

  const supabase = await createClient()
  const supabaseAdmin = getAdminClient()

  // 1. دریافت رکورد کد تایید
  // ما اینجا کد را در شرط eq نمی گذاریم تا بتوانیم رکورد را پیدا کنیم و تعداد تلاش را چک کنیم
  const { data: verifyRecord } = await (
    supabaseAdmin.from("verification_codes") as any
  )
    .select("*")
    .eq("mobile", mobile)
    .gt("expires_at", new Date().toISOString()) // فقط کدهایی که هنوز وقت دارند
    .single()

  // اگر رکوردی پیدا نشد (یعنی یا تایم تمام شده یا کلا درخواستی نبوده)
  if (!verifyRecord) {
    return {
      success: false,
      message: "کد منقضی شده یا درخواست معتبر وجود ندارد."
    }
  }

  // 2. بررسی صحت کد و مدیریت تلاش‌ها (Brute-force Protection)
  if (verifyRecord.code !== code) {
    const newAttempts = (verifyRecord.attempts || 0) + 1

    // اگر بیش از ۳ بار اشتباه زد، کد را بسوزان (پاک کن)
    if (newAttempts >= 3) {
      await (supabaseAdmin.from("verification_codes") as any)
        .delete()
        .eq("id", verifyRecord.id)

      return {
        success: false,
        message:
          "تعداد تلاش‌های ناموفق بیش از حد مجاز بود. کد باطل شد. مجدد درخواست دهید."
      }
    }

    // اگر هنوز شانس دارد، تعداد تلاش را آپدیت کن
    await (supabaseAdmin.from("verification_codes") as any)
      .update({ attempts: newAttempts })
      .eq("id", verifyRecord.id)

    return {
      success: false,
      message: `کد وارد شده اشتباه است. (${3 - newAttempts} تلاش باقی‌مانده)`
    }
  }

  // --- اگر کد درست بود، ادامه مراحل ---

  const fakeEmail = `${mobile}@porsino.ir`

  // 3. ثبت نام در Auth
  // نکته: چون ایمیل فیک است، تایید ایمیل را باید در تنظیمات Supabase خاموش کرده باشید
  const { data: authData, error: signupError } = await supabase.auth.signUp({
    email: fakeEmail,
    password: password,
    options: {
      data: {
        mobile: mobile,
        entered_referral_code: referralCode || null
      }
    }
  })

  if (signupError) {
    return { success: false, message: signupError.message }
  }

  if (authData.user) {
    // الف) آپدیت پروفایل
    await (supabaseAdmin.from("profiles") as any)
      .update({ mobile: mobile })
      .eq("user_id", authData.user.id)

    // ب) هندل کردن معرف
    if (referralCode && referralCode.trim().length > 0) {
      const cleanCode = referralCode.trim()
      const { data: referrerProfile } = await (
        supabaseAdmin.from("profiles") as any
      )
        .select("user_id")
        .eq("referral_code", cleanCode)
        .single()

      if (referrerProfile) {
        await (supabaseAdmin.from("profiles") as any)
          .update({ referred_by: referrerProfile.user_id })
          .eq("user_id", authData.user.id)
      }
    }

    // ج) پاک کردن کد تایید (Cleanup)
    // کد استفاده شده را حتما پاک می کنیم
    await (supabaseAdmin.from("verification_codes") as any)
      .delete()
      .eq("mobile", mobile)
  }

  return redirect("/setup")
}
