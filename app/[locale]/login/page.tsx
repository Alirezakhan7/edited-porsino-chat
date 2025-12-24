// app/[locale]/login/page.tsx
import AuthForm from "@/components/auth/auth-form"
import AnimatedMessage from "@/components/ui/animated-message"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Metadata } from "next"
// 👇 این کتابخانه برای ساخت کلاینت ادمین لازم است
import { createClient as createSupabaseClient } from "@supabase/supabase-js"

export const metadata: Metadata = {
  title: "ورود یا ثبت‌نام"
}

export default async function Login({
  searchParams
}: {
  searchParams: Promise<{ message?: string; mode?: string }>
}) {
  const sp = await searchParams
  const supabase = await createClient()

  // ساخت کلاینت ادمین (Service Role) برای دسترسی‌های خاص 👇
  const supabaseAdmin = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )

  const session = (await supabase.auth.getSession()).data.session
  if (session) {
    return redirect("/chat")
  }

  // ----------------------------------------------------------------
  // 1️⃣ تابع ورود (Login)
  // ----------------------------------------------------------------
  async function signIn(formData: FormData) {
    "use server"
    const identifier = formData.get("identifier") as string
    const password = formData.get("password") as string
    const supabase = await createClient()

    let emailToLogin = identifier

    if (/^09[0-9]{9}$/.test(identifier)) {
      // ✅ استفاده از supabaseAdmin برای جستجو (چون RLS ممکن است پروفایل دیگران را مخفی کند)
      const { data: profile } = await (supabaseAdmin.from("profiles") as any)
        .select("user_id")
        .eq("mobile", identifier)
        .single()

      if (!profile) {
        return { message: "کاربری با این شماره موبایل یافت نشد." }
      }

      emailToLogin = `${identifier}@porsino.ir`
    }

    const { error } = await supabase.auth.signInWithPassword({
      email: emailToLogin,
      password
    })

    if (error) {
      return { message: "اطلاعات ورود نادرست است" }
    }

    return redirect("/chat")
  }

  // ----------------------------------------------------------------
  // 2️⃣ تابع ارسال کد OTP (امن شده با Admin Client) 🛡️
  // ----------------------------------------------------------------
  async function sendOtp(formData: FormData) {
    "use server"
    const mobile = formData.get("mobile") as string
    // در اینجا نیازی به createClient معمولی نیست چون همه کارها سیستمی است

    // 1. چک کردن کاربر با دسترسی ادمین
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

    // 🚨 امنیت: بررسی محدودیت زمانی
    const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000).toISOString()

    // ✅ استفاده از supabaseAdmin برای دسترسی به جدول verification_codes
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

    const code = Math.floor(10000 + Math.random() * 90000).toString()

    // ✅ پاکسازی با دسترسی ادمین
    await (supabaseAdmin.from("verification_codes") as any)
      .delete()
      .eq("mobile", mobile)

    // ✅ اینسرت با دسترسی ادمین (RLS را دور می‌زند)
    const { error: dbError } = await (
      supabaseAdmin.from("verification_codes") as any
    ).insert({
      mobile,
      code,
      expires_at: new Date(Date.now() + 2 * 60 * 1000).toISOString()
    })

    if (dbError) {
      console.error(dbError)
      return { success: false, message: "خطا در سرور داخلی" }
    }

    // ارسال پیامک
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
        await (supabaseAdmin.from("verification_codes") as any)
          .delete()
          .eq("mobile", mobile)
        return { success: false, message: "خطا در ارسال پیامک." }
      }

      return { success: true, message: "کد تایید ارسال شد" }
    } catch (error) {
      console.error(error)
      return { success: false, message: "خطا در ارتباط با پنل پیامکی" }
    }
  }

  // ----------------------------------------------------------------
  // 3️⃣ تابع تایید و ثبت نام (امن شده)
  // ----------------------------------------------------------------
  async function verifyAndSignUp(formData: FormData) {
    "use server"
    const mobile = formData.get("mobile") as string
    const code = formData.get("otp") as string
    const password = formData.get("password") as string
    const referralCode = formData.get("referral-code") as string

    const supabase = await createClient() // برای کارهای Auth معمولی به این نیاز داریم

    // 1. چک کردن کد با supabaseAdmin ✅
    const { data: verifyRecord } = await (
      supabaseAdmin.from("verification_codes") as any
    )
      .select("*")
      .eq("mobile", mobile)
      .eq("code", code)
      .gt("expires_at", new Date().toISOString())
      .single()

    if (!verifyRecord) {
      return { success: false, message: "کد وارد شده اشتباه یا منقضی شده است." }
    }

    const fakeEmail = `${mobile}@porsino.ir`

    // 2. ثبت نام در Auth (این بخش با کلاینت معمولی هم کار می‌کند چون فانکشن سیستمی است)
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
      // الف) آپدیت پروفایل با دسترسی ادمین ✅
      // (چون ممکن است RLS مانع آپدیت پروفایل قبل از تکمیل کامل شود)
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

      // ج) پاک کردن کد تایید ✅
      await (supabaseAdmin.from("verification_codes") as any)
        .delete()
        .eq("mobile", mobile)
    }

    return redirect("/setup")
  }

  const mode = sp?.mode === "signup" ? "signup" : "login"

  return (
    <div
      className="flex w-full flex-1 flex-col items-center justify-center px-4"
      style={{ backgroundColor: "#1E1E1E" }}
    >
      <div className="w-full max-w-md">
        {sp?.message && <AnimatedMessage message={sp.message} />}
        <AuthForm
          signIn={signIn}
          sendOtp={sendOtp}
          verifyAndSignUp={verifyAndSignUp}
          defaultMode={mode}
        />
      </div>
    </div>
  )
}
