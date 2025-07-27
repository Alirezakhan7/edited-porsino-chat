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
    const getUser = async () => {
      const {
        data: { user }
      } = await supabase.auth.getUser()
      setUser(user)
    }
    getUser()
  }, [supabase])

  const handlePayment = async () => {
    if (!user) {
      setError("برای پرداخت، ابتدا باید وارد حساب کاربری خود شوید.")
      return
    }

    setLoading(true)
    setError(null)

    try {
      const amount = 500000 // مبلغ اشتراک به ریال (مثلاً ۵۰ هزار تومان)
      const orderId = `sub_${new Date().getTime()}`

      const response = await fetch("/api/payment/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount, order_id: orderId })
      })

      const data = await response.json()

      if (response.ok) {
        window.location.href = data.payment_url
      } else {
        setError(data.message || "خطایی در ایجاد تراکنش رخ داد.")
      }
    } catch (err) {
      console.error(err)
      setError("یک خطای پیش‌بینی نشده رخ داد. لطفاً با پشتیبانی تماس بگیرید.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <div className="w-full max-w-md space-y-6 rounded-lg bg-white p-8 text-center shadow-md">
        <h1 className="text-2xl font-bold">خرید اشتراک ویژه</h1>
        {user ? <p>کاربر: {user.email}</p> : <p>لطفا برای ادامه وارد شوید.</p>}

        <div className="py-4">
          <p className="text-lg">مبلغ اشتراک یک ماهه:</p>
          <p className="text-3xl font-bold text-green-600">۵۰,۰۰۰ تومان</p>
        </div>

        <button
          onClick={handlePayment}
          disabled={loading || !user}
          className="w-full rounded-lg bg-blue-600 px-4 py-3 text-white hover:bg-blue-700 disabled:bg-gray-400"
        >
          {loading ? "در حال انتقال به درگاه..." : "پرداخت و فعال‌سازی اشتراک"}
        </button>

        {error && (
          <div className="mt-4 rounded-lg bg-red-100 p-3 text-red-700">
            {error}
          </div>
        )}
      </div>
    </div>
  )
}
