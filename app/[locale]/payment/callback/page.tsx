"use client"

import { useEffect, useState, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"

function CallbackContent() {
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<"pending" | "success" | "failed">(
    "pending"
  )
  const [message, setMessage] = useState("در حال بررسی اطلاعات تراکنش...")

  useEffect(() => {
    const paymentStatus = searchParams.get("status")
    const ref_num = searchParams.get("ref_num")
    const order_id = searchParams.get("order_id")
    const transaction_id = searchParams.get("transaction_id")
    const tracking_code = searchParams.get("tracking_code")
    const card_number = searchParams.get("card_number")

    if (paymentStatus !== "1") {
      setStatus("failed")
      setMessage("پرداخت ناموفق بود یا توسط شما لغو شد.")
      return
    }

    const verifyPayment = async () => {
      try {
        const response = await fetch("/api/payment/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ref_num,
            order_id,
            transaction_id,
            card_number,
            tracking_code
          })
        })

        const data = await response.json()
        setMessage(data.message)
        setStatus(response.ok ? "success" : "failed")
      } catch (error) {
        setStatus("failed")
        setMessage("خطایی در ارتباط با سرور برای تایید تراکنش رخ داد.")
      }
    }

    verifyPayment()
  }, [searchParams])

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-md rounded-lg bg-white p-8 text-center shadow-lg">
        {status === "pending" && <p>در حال پردازش...</p>}
        {status === "success" && (
          <p className="font-bold text-green-600">✅ {message}</p>
        )}
        {status === "failed" && (
          <p className="font-bold text-red-600">❌ {message}</p>
        )}
        <div className="mt-8">
          <Link href="/dashboard" className="text-blue-600 hover:underline">
            بازگشت به داشبورد
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function CallbackPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <CallbackContent />
    </Suspense>
  )
}
