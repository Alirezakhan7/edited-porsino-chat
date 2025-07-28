"use client"

import { useState } from "react"

export default function PaystarTestPage() {
  const [amount, setAmount] = useState("10000") // مبلغ پیش‌فرض به ریال
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/paystar/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: parseInt(amount, 10) })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || "خطا در ایجاد تراکنش")
      }

      if (result.payment_url) {
        // هدایت کاربر به درگاه پرداخت
        window.location.href = result.payment_url
      } else {
        throw new Error("لینک پرداخت دریافت نشد.")
      }
    } catch (err: any) {
      setError(err.message)
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="w-full max-w-md space-y-8 rounded-xl bg-white p-8 shadow-lg dark:bg-gray-800">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            تست درگاه پرداخت پی‌استار
          </h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            مبلغ مورد نظر خود را برای تست وارد کنید.
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handlePayment}>
          <div>
            <label
              htmlFor="amount"
              className="mb-2 block text-right text-sm font-medium text-gray-900 dark:text-gray-300"
            >
              مبلغ (ریال)
            </label>
            <input
              type="number"
              id="amount"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder:text-gray-400"
              placeholder="مثلا: 10000"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-blue-600 px-5 py-3 text-center text-base font-medium text-white hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 disabled:cursor-not-allowed disabled:bg-gray-400 dark:bg-blue-500 dark:hover:bg-blue-600 dark:focus:ring-blue-800"
          >
            {loading ? "در حال انتقال به درگاه..." : "پرداخت"}
          </button>

          {error && (
            <div
              className="mt-4 rounded-lg bg-red-100 p-4 text-sm text-red-700 dark:bg-red-200 dark:text-red-800"
              role="alert"
            >
              <span className="font-medium">خطا:</span> {error}
            </div>
          )}
        </form>
      </div>
    </div>
  )
}
