/* --------------------------------------------------------------------------
   File: app/payment/redirect/page.tsx
   Description: A client-side component that acts as an intermediary to
                cleanly redirect the user to the final payment result page,
                avoiding cross-origin issues.
   -------------------------------------------------------------------------- */
"use client"

import { useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"

export default function PaymentRedirectPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    // تمام پارامترهای دریافتی از URL را می‌خوانیم
    const status = searchParams.get("status")
    const message = searchParams.get("message")
    const order_id = searchParams.get("order_id")

    // یک آدرس جدید برای صفحه نتیجه نهایی می‌سازیم
    const finalUrl = new URL("/payment-result", window.location.origin)
    if (status) finalUrl.searchParams.set("status", status)
    if (message) finalUrl.searchParams.set("message", message)
    if (order_id) finalUrl.searchParams.set("order_id", order_id)

    // با استفاده از روتر Next.js، یک هدایت تمیز در سمت کلاینت انجام می‌دهیم
    router.replace(finalUrl.toString())
  }, [router, searchParams])

  // در حین هدایت، یک پیام لودینگ ساده نمایش می‌دهیم
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        fontFamily: "sans-serif",
        backgroundColor: "#f3f4f6"
      }}
    >
      <p>در حال انتقال به صفحه نتیجه پرداخت...</p>
    </div>
  )
}
