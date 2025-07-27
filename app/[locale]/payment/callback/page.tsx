"use client"

import { useEffect, useState, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"

// یک کامپوننت داخلی برای دسترسی به پارامترهای URL
function CallbackContent() {
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<"pending" | "success" | "failed">(
    "pending"
  )
  const [message, setMessage] = useState("در حال بررسی و تایید نهایی تراکنش...")

  useEffect(() => {
    // خواندن پارامترهای بازگشتی از درگاه
    const paymentStatus = searchParams.get("status")
    const ref_num = searchParams.get("ref_num")
    const order_id = searchParams.get("order_id")
    const card_number = searchParams.get("card_number")
    const tracking_code = searchParams.get("tracking_code")

    // اگر پرداخت در همان ابتدا ناموفق بوده، نیازی به تایید نیست
    if (paymentStatus !== "1") {
      setStatus("failed")
      setMessage("پرداخت ناموفق بود یا توسط شما لغو شد.")
      return
    }

    const verifyPayment = async () => {
      try {
        // ارسال اطلاعات به API Route خودمان برای تایید نهایی
        const response = await fetch("/api/payment/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ref_num,
            order_id,
            card_number,
            tracking_code
          })
        })

        const data = await response.json()
        setMessage(data.message)
        setStatus(response.ok ? "success" : "failed")
      } catch (error) {
        console.error("Verification API call failed:", error)
        setStatus("failed")
        setMessage("خطایی در ارتباط با سرور برای تایید تراکنش رخ داد.")
      }
    }

    // فقط در صورتی که اطلاعات لازم وجود دارد، تابع تایید را فراخوانی کن
    if (ref_num && order_id) {
      verifyPayment()
    } else {
      setStatus("failed")
      setMessage("اطلاعات لازم برای تایید تراکنش از سمت درگاه ارسال نشده است.")
    }
  }, [searchParams])

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md rounded-xl bg-white p-8 text-center shadow-lg">
        {status === "pending" && <div className="text-gray-700">{message}</div>}
        {status === "success" && (
          <div className="text-lg font-bold text-green-600">✅ {message}</div>
        )}
        {status === "failed" && (
          <div className="text-lg font-bold text-red-600">❌ {message}</div>
        )}

        <div className="mt-8">
          <Link
            href="/dashboard"
            className="rounded-lg bg-gray-700 px-6 py-2 text-white hover:bg-gray-800"
          >
            بازگشت به داشبورد
          </Link>
        </div>
      </div>
    </div>
  )
}

// کامپوننت اصلی که از Suspense برای مدیریت بارگذاری پارامترها استفاده می‌کند
export default function CallbackPage() {
  return (
    <Suspense fallback={<div>در حال بارگذاری...</div>}>
      <CallbackContent />
    </Suspense>
  )
}
