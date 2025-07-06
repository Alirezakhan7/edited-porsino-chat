"use client"

import { useState, Suspense } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

function ResetPasswordForm() {
  const router = useRouter()
  const [password, setPassword] = useState("")
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState("")

  // تابع handleSubmit برای ارسال فرم
  const handleSubmit = async (e: React.FormEvent) => {
    // جلوگیری از رفرش شدن صفحه هنگام ارسال فرم
    e.preventDefault()

    // بررسی کوتاه‌بودن رمز عبور (اختیاری اما پیشنهادی)
    if (password.length < 6) {
      setError("رمز عبور باید حداقل ۶ کاراکتر باشد.")
      return
    }

    setError("") // پاک کردن خطاهای قبلی
    const supabase = createClient()

    // به‌روزرسانی رمز عبور کاربر احراز هویت شده
    const { error: updateError } = await supabase.auth.updateUser({ password })

    if (updateError) {
      setError("خطا در به‌روزرسانی رمز عبور: " + updateError.message)
    } else {
      setSubmitted(true)
      // انتقال کاربر به صفحه ورود پس از ۲ ثانیه
      setTimeout(() => router.push("/login"), 2000)
    }
  }

  // اگر فرم با موفقیت ارسال شده باشد، این پیام نمایش داده می‌شود
  if (submitted) {
    return (
      <p className="mt-10 text-center text-green-500">
        رمز عبور با موفقیت تغییر کرد! در حال انتقال به صفحه ورود...
      </p>
    )
  }

  // فرم اصلی برای وارد کردن رمز جدید
  return (
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-md space-y-6 rounded-xl bg-[#1E1E1E] p-8 shadow-md"
    >
      <h2 className="text-center text-2xl font-bold text-white">
        تغییر رمز عبور
      </h2>

      <div>
        <label
          htmlFor="password"
          className="mb-2 block text-sm font-medium text-gray-300"
        >
          رمز عبور جدید
        </label>
        <input
          id="password"
          type="password"
          placeholder="رمز جدید خود را وارد کنید"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
          className="w-full rounded-md border border-gray-600 bg-gray-800 p-3 text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
        />
      </div>

      <button
        type="submit"
        className="w-full rounded-md bg-orange-500 py-3 font-bold text-white transition-colors hover:bg-orange-600"
      >
        ذخیره رمز جدید
      </button>

      {error && (
        <p className="mt-4 text-center text-sm text-red-500">{error}</p>
      )}
    </form>
  )
}

// کامپوننت اصلی صفحه که از Suspense برای بارگذاری بهتر استفاده می‌کند
export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-[#1E1E1E] px-4">
      <Suspense fallback={<p className="text-white">در حال بارگذاری...</p>}>
        <ResetPasswordForm />
      </Suspense>
    </div>
  )
}
