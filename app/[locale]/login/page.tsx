// app/(auth)/login/page.tsx
import AuthForm from "@/components/auth/auth-form"
import AnimatedMessage from "@/components/ui/animated-message"
import { cookies, headers } from "next/headers"
import { redirect } from "next/navigation"
import { get } from "@vercel/edge-config"
import { Database } from "@/supabase/types"
import { createClient } from "@/lib/supabase/server"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "ورود یا ثبت‌نام"
}

export default async function Login({
  searchParams
}: {
  searchParams: { message?: string }
}) {
  const cookieStore = cookies()
  const supabase = createClient(cookieStore)

  // بررسی سشن
  const session = (await supabase.auth.getSession()).data.session
  if (session) {
    const { data: homeWorkspace, error: workspaceError } = await supabase
      .from("workspaces")
      .select("*")
      .eq("user_id", session.user.id)
      .eq("is_home", true)
      .single()

    if (!homeWorkspace) {
      throw new Error(workspaceError?.message || "Home workspace not found.")
    }

    return redirect("/chat")
  }

  // تابع ورود
  // ورود
  async function signIn(formData: FormData) {
    "use server"
    const email = formData.get("email") as string
    const password = formData.get("password") as string
    const cookieStore = cookies()
    const supabase = createClient(cookieStore)

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) {
      return { message: "ایمیل یا رمز عبور نادرست است" }
    }

    return redirect("/chat")
  }

  // ثبت‌نام
  async function signUp(formData: FormData) {
    "use server"
    const email = formData.get("email") as string
    const password = formData.get("password") as string
    const cookieStore = cookies()
    const supabase = createClient(cookieStore)

    const { data, error } = await supabase.auth.signUp({ email, password })

    if (error) {
      const msg = error.message
      const friendly = msg.includes("already")
        ? "این ایمیل قبلاً ثبت‌نام شده است."
        : "خطا در ثبت‌نام"
      return { message: friendly }
    }

    return { message: "ایمیلی برای تأیید ثبت‌نام ارسال شد" }
  }

  // بازیابی رمز عبور
  async function handleResetPassword(formData: FormData) {
    "use server"
    const origin = headers().get("origin")
    const email = formData.get("email") as string
    const cookieStore = cookies()
    const supabase = createClient(cookieStore)

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${origin}/auth/callback?next=/login/password`
    })

    if (error) {
      return redirect(
        `/login?message=${encodeURIComponent("خطا در ارسال ایمیل بازیابی")}`
      )
    }

    return redirect(
      `/login?message=${encodeURIComponent("ایمیلی برای بازیابی رمز عبور ارسال شد")}`
    )
  }

  return (
    <div
      className="flex w-full flex-1 flex-col items-center justify-center px-4"
      style={{ backgroundColor: "#1E1E1E" }}
    >
      <div className="w-full max-w-md">
        {searchParams?.message && (
          <AnimatedMessage message={searchParams.message} />
        )}
        <AuthForm
          signIn={signIn}
          signUp={signUp}
          resetPassword={handleResetPassword}
        />
      </div>
    </div>
  )
}
