"use client"

import { useState, useEffect } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import type { User } from "@supabase/supabase-js"

// این کامپوننت، صفحه شروع فرآیند پرداخت است که کاربر آن را می‌بیند
export default function PaymentPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const supabase = createClientComponentClient()

  // در زمان بارگذاری صفحه، اطلاعات کاربر فعلی را از سوپابیس می‌گیریم
  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user }
      } = await supabase.auth.getUser()
      setUser(user)
    }
    getUser()
  }, [supabase])

  // این تابع با کلیک روی دکمه، فرآیند پرداخت را آغاز می‌کند
  const handlePayment = async () => {
    if (!user) {
      setError("برای پرداخت، ابتدا باید وارد حساب کاربری خود شوید.")
      return
    }

    setLoading(true)
    setError(null)

    try {
      // مبلغ اشتراک به ریال (مثلاً ۵۰ هزار تومان)
      const amount = 500000
      // یک شناسه سفارش منحصر به فرد برای این خرید
      const orderId = `sub_${user.id}_${new Date().getTime()}`

      // ارسال درخواست به API Route خودمان در سرور
      const response = await fetch("/api/payment/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount, order_id: orderId })
      })

      const data = await response.json()

      if (response.ok) {
        // اگر همه چیز موفقیت‌آمیز بود، کاربر به درگاه پرداخت هدایت می‌شود
        window.location.href = data.payment_url
      } else {
        // در صورت بروز خطا، پیام آن نمایش داده می‌شود
        setError(data.message || "خطایی در ایجاد تراکنش رخ داد.")
      }
    } catch (err) {
      console.error("Payment initiation failed:", err)
      setError("یک خطای پیش‌بینی نشده رخ داد. لطفاً با پشتیبانی تماس بگیرید.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50">
      <div className="w-full max-w-md space-y-6 rounded-xl bg-white p-8 text-center shadow-lg">
        <h1 className="text-2xl font-bold text-gray-800">خرید اشتراک ویژه</h1>

        {user ? (
          <p className="text-gray-600">
            کاربر گرامی: <span className="font-medium">{user.email}</span>
          </p>
        ) : (
          <p className="text-yellow-600">
            لطفاً برای ادامه وارد حساب کاربری خود شوید.
          </p>
        )}

        <div className="border-y border-gray-200 py-4">
          <p className="text-lg text-gray-700">مبلغ اشتراک یک ماهه:</p>
          <p className="my-2 text-4xl font-bold text-green-600">۵۰,۰۰۰ تومان</p>
        </div>

        <button
          onClick={handlePayment}
          disabled={loading || !user}
          className="w-full rounded-lg bg-blue-600 px-4 py-3 text-lg text-white transition-all duration-300 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-gray-400"
        >
          {loading ? "در حال انتقال به درگاه..." : "پرداخت و فعال‌سازی"}
        </button>

        {error && (
          <div
            className="mt-4 rounded-lg bg-red-100 p-3 text-sm text-red-700"
            role="alert"
          >
            <span className="font-medium">خطا!</span> {error}
          </div>
        )}
      </div>
    </div>
  )
}
