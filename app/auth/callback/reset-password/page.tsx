"use client"

import { useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

export default function ResetPasswordPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [password, setPassword] = useState("")
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState("")
  const [tokenReady, setTokenReady] = useState(false)

  useEffect(() => {
    const type = searchParams.get("type")
    const access_token = searchParams.get("access_token")

    if (type === "recovery" && access_token) {
      setTokenReady(true)
    }
  }, [searchParams])

  const handleSubmit = async () => {
    const supabase = createClient()
    const { data, error } = await supabase.auth.updateUser({
      password
    })

    if (error) {
      setError(error.message)
    } else {
      setSubmitted(true)
      setTimeout(() => {
        router.push("/login")
      }, 2000)
    }
  }

  if (!tokenReady) {
    return <p>در حال بررسی لینک بازیابی رمز عبور</p>
  }

  if (submitted) {
    return <p>رمز عبور با موفقیت تغییر کرد! در حال انتقال</p>
  }

  return (
    <div style={{ padding: 20 }}>
      <h2>تغییر رمز عبور</h2>
      <input
        type="password"
        placeholder="رمز عبور جدید"
        value={password}
        onChange={e => setPassword(e.target.value)}
      />
      <button onClick={handleSubmit}>ذخیره رمز جدید</button>
      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  )
}
