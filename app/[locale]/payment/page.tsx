"use client"
import { useState, useEffect } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import type { User } from "@supabase/supabase-js"

export default function PaymentPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const supabase = createClientComponentClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user))
  }, [supabase])

  const handlePayment = async () => {
    if (!user) {
      setError("لطفاً وارد شوید")
      return
    }

    setLoading(true)
    setError(null)
    try {
      const amount = 500_000 // ریال
      const order_id = crypto.randomUUID?.() ?? `${Date.now()}`
      const res = await fetch("/api/payment/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount, order_id, callback_method: 1 }),
        signal: AbortSignal.timeout(10_000)
      })
      const data = await res.json()
      res.ok
        ? (window.location.href = data.payment_url)
        : setError(data.message || "خطای ایجاد تراکنش")
    } catch (e) {
      setError("خطای شبکه/timeout")
    } finally {
      setLoading(false)
    }
  }

  /* JSX همان نسخهٔ Canvas */
}
