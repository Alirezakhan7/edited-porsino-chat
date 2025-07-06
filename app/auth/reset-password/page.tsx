"use client"

import { useEffect, useState, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

function ResetPasswordForm() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [password, setPassword] = useState("")
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState("")
  const [tokenReady, setTokenReady] = useState(false)

  useEffect(() => {
    const type = searchParams.get("type")
    const token = searchParams.get("access_token")

    if (type === "recovery" && token) {
      setTokenReady(true)
    }
  }, [searchParams])

  const handleSubmit = async () => {
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password })

    if (error) {
      setError(error.message)
    } else {
      setSubmitted(true)
      setTimeout(() => router.push("/login"), 2000)
    }
  }

  if (!tokenReady) return <p>در حال بارگذاری لینک بازیابی...</p>
  if (submitted) return <p>رمز با موفقیت تغییر کرد</p>

  return (
    <div style={{ padding: 20 }}>
      <h2>تغییر رمز عبور</h2>
      <input
        type="password"
        placeholder="رمز جدید"
        value={password}
        onChange={e => setPassword(e.target.value)}
      />
      <button onClick={handleSubmit}>ذخیره رمز جدید</button>
      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<p>در حال بارگذاری...</p>}>
      <ResetPasswordForm />
    </Suspense>
  )
}
