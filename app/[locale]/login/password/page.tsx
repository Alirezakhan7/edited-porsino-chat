"use client"

import { useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Input } from "@/components/ui/input"
import { SubmitButton } from "@/components/ui/submit-button"

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [message, setMessage] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()
  const params = useSearchParams()

  useEffect(() => {
    // Supabase خودش کار validate توکن را هنگام لود صفحه انجام می‌دهد
    const accessToken = params.get("access_token")
    if (!accessToken) {
      setMessage("توکن معتبر نیست یا لینک منقضی شده.")
    }
  }, [params])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (password !== confirmPassword) {
      setMessage("رمز عبور با تکرار آن یکسان نیست.")
      return
    }

    const { error } = await supabase.auth.updateUser({ password })

    if (error) {
      setMessage("خطا در تغییر رمز عبور: " + error.message)
    } else {
      setMessage("رمز عبور با موفقیت تغییر یافت. اکنون وارد شوید.")
      setTimeout(
        () =>
          router.push(
            "/login?message=" + encodeURIComponent("رمز با موفقیت تغییر یافت")
          ),
        3000
      )
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#1E1E1E] px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md rounded-xl border border-[#5D5D5D]/50 bg-[#2C2C2C]/80 p-6 backdrop-blur-md"
      >
        <h2 className="mb-4 text-center text-xl font-semibold text-[#D6D6D6]">
          تغییر رمز عبور
        </h2>

        <Input
          type="password"
          placeholder="رمز عبور جدید"
          className="mb-4 bg-[#1E1E1E]/80 text-[#D6D6D6]"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
        />

        <Input
          type="password"
          placeholder="تکرار رمز عبور"
          className="mb-4 bg-[#1E1E1E]/80 text-[#D6D6D6]"
          value={confirmPassword}
          onChange={e => setConfirmPassword(e.target.value)}
          required
        />

        {message && (
          <p className="mb-4 text-center text-sm text-red-400">{message}</p>
        )}

        <SubmitButton className="w-full rounded-full bg-[#ACACAC] py-2 text-[#1E1E1E] hover:bg-[#8F8F8F]">
          ذخیره رمز جدید
        </SubmitButton>
      </form>
    </div>
  )
}
