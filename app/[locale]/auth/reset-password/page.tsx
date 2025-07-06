"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

function ResetPasswordForm() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [password, setPassword] = useState("")
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    const code = searchParams.get("code")

    async function handleExchangeSession() {
      if (!code) {
        setError("کد بازیابی پیدا نشد")
        setLoading(false)
        return
      }

      const { error: sessionError } =
        await supabase.auth.exchangeCodeForSession(code)

      if (sessionError) {
        setError("خطا در ورود با لینک بازیابی: " + sessionError.message)
      }

      setLoading(false)
    }

    handleExchangeSession()
  }, [searchParams])

  const handleSubmit = async () => {
    const supabase = createClient()

    const { error: updateError } = await supabase.auth.updateUser({ password })
    if (updateError) {
      setError(updateError.message)
    } else {
      setSubmitted(true)
      setTimeout(() => router.push("/login"), 2000)
    }
  }

  if (loading) {
    return (
      <p className="mt-10 text-center text-white">در حال اعتبارسنجی لینک</p>
    )
  }

  if (submitted) {
    return (
      <p className="mt-10 text-center text-green-500">
        رمز عبور با موفقیت تغییر کرد! در حال انتقال
      </p>
    )
  }

  if (error) {
    return (
      <div className="mt-10 text-center text-red-500">
        <p>خطا: {error}</p>
        <p className="mt-2 text-sm text-gray-400">
          لطفاً دوباره از فرم بازیابی رمز عبور استفاده کنید
        </p>
      </div>
    )
  }

  return (
    <div className="w-full max-w-md space-y-6 rounded-xl bg-[#1E1E1E] p-8 shadow-md">
      <h2 className="text-center text-2xl font-bold text-white">
        تغییر رمز عبور
      </h2>

      <input
        type="password"
        placeholder="رمز جدید"
        value={password}
        onChange={e => setPassword(e.target.value)}
        className="w-full rounded-md border border-gray-600 bg-gray-800 p-3 text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
      />

      <button
        onClick={handleSubmit}
        className="w-full rounded-md bg-orange-500 py-3 font-bold text-white transition-colors hover:bg-orange-600"
      >
        ذخیره رمز جدید
      </button>

      {error && <p className="text-center text-sm text-red-500">{error}</p>}
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-[#1E1E1E] px-4">
      <Suspense fallback={<p className="text-white">در حال بارگذاری</p>}>
        <ResetPasswordForm />
      </Suspense>
    </div>
  )
}
