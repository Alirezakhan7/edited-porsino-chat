"use client"
import { useState } from "react"

export default function PaystarTest() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // یک شناسه سفارش یکتا می‌سازیم (برای تست)
  const makeOrderId = () => "ORDER" + Date.now()

  async function handlePay() {
    setLoading(true)
    setError(null)

    try {
      // مرحله ۱: درخواست به api/paystar/create
      const resp = await fetch("/api/paystar/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: 590_000, // مبلغ به ریال (۵۹۰ هزار تومان)
          order_id: makeOrderId(),
          // 👇 این خط را اصلاح کردم:
          callback: "https://porsino.org/api/paystar/callback",
          name: "خریدار تستی",
          phone: "09120000000"
        })
      })
      const result = await resp.json()
      if (result.status === 1 && result.data && result.data.token) {
        // ریدایرکت به درگاه پی‌استار با توکن دریافتی
        window.location.href = `https://api.paystar.shop/api/pardakht/payment?token=${result.data.token}`
      } else {
        setError(result.message || "خطا در ایجاد تراکنش!")
        setLoading(false)
      }
    } catch (err: any) {
      setError("خطای غیرمنتظره: " + err?.message)
      setLoading(false)
    }
  }

  return (
    <div
      style={{
        maxWidth: 400,
        margin: "120px auto",
        padding: 32,
        border: "1px solid #eee",
        borderRadius: 16,
        textAlign: "center"
      }}
    >
      <h2>خرید تستی</h2>
      <p>
        خرید محصول: <b>۵۹۰ هزار تومان</b>
      </p>
      <button
        style={{
          padding: "16px 32px",
          fontSize: 20,
          borderRadius: 12,
          background: "#008cdd",
          color: "#fff",
          border: "none",
          cursor: "pointer"
        }}
        onClick={handlePay}
        disabled={loading}
      >
        {loading ? "در حال انتقال..." : "پرداخت"}
      </button>
      {error && <div style={{ color: "red", marginTop: 16 }}>{error}</div>}
    </div>
  )
}
