"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { CheckCircle, Loader2 } from "lucide-react"

// اطلاعات پلن‌ها برای نمایش در صفحه
const displayPlans = [
  {
    id: "monthly",
    name: "اشتراک یک ماهه",
    priceToman: "۶۴۰",
    description: "ایده‌آل برای شروع و پروژه‌های کوتاه‌مدت.",
    features: [
      "پروژه‌های عمومی و خصوصی",
      "شروع با ۱۰ میلیون توکن در ماه",
      "بدون محدودیت توکن روزانه",
      "توکن‌های استفاده نشده به ماه بعد منتقل می‌شود"
    ],
    isPopular: false
  },
  {
    id: "9-month",
    name: "اشتراک ۹ ماهه",
    priceToman: "۴,۰۳۰",
    description: "بهترین انتخاب برای کاربران حرفه‌ای با ۳۰٪ تخفیف.",
    features: [
      "پروژه‌های عمومی و خصوصی",
      "شروع با ۱۰ میلیون توکن در ماه",
      "بدون محدودیت توکن روزانه",
      "توکن‌های استفاده نشده به ماه بعد منتقل می‌شود"
    ],
    isPopular: true
  }
]

export default function PaymentPage() {
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null)
  const [discountCode, setDiscountCode] = useState("")
  const [error, setError] = useState<string | null>(null)

  const supabase = createClientComponentClient()
  const router = useRouter()

  // ۱. بررسی وضعیت لاگین کاربر
  useEffect(() => {
    const checkUser = async () => {
      const {
        data: { session }
      } = await supabase.auth.getSession()
      if (!session) {
        // اگر کاربر لاگین نکرده، به صفحه ورود هدایت کن
        // آدرس صفحه لاگین خود را اینجا قرار دهید
        router.push("/login")
      } else {
        setUser(session.user)
        setLoading(false)
      }
    }
    checkUser()
  }, [supabase, router])

  // ۲. تابع ارسال درخواست پرداخت
  const handlePayment = async (planId: string) => {
    setLoadingPlan(planId)
    setError(null)

    try {
      const response = await fetch("/api/paystar/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // ارسال شناسه پلن و کد تخفیف به سرور
        body: JSON.stringify({ planId, discountCode })
      })

      const result = await response.json()
      if (!response.ok) throw new Error(result.message || "خطا در ایجاد تراکنش")
      if (result.payment_url) window.location.href = result.payment_url
      else throw new Error("لینک پرداخت دریافت نشد.")
    } catch (err: any) {
      setError(err.message)
      setLoadingPlan(null)
    }
  }

  // نمایش حالت لودینگ تا زمان بررسی وضعیت لاگین
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
        <Loader2 className="size-12 animate-spin text-purple-500" />
        <p className="mr-4 text-lg text-gray-700 dark:text-gray-300">
          در حال بررسی اطلاعات کاربر...
        </p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-12 sm:px-6 lg:px-8 dark:bg-gray-900">
      <div className="mx-auto max-w-4xl text-center">
        <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl dark:text-white">
          پلن اشتراک خود را انتخاب کنید
        </h1>
        <p className="mt-4 text-xl text-gray-600 dark:text-gray-400">
          بهترین گزینه را برای نیازهای خود انتخاب کرده و به امکانات ویژه دسترسی
          پیدا کنید.
        </p>
      </div>

      <div className="mt-12 space-y-8 lg:grid lg:grid-cols-2 lg:gap-x-8 lg:space-y-0">
        {displayPlans.map(plan => (
          <div
            key={plan.id}
            className={`relative flex flex-col rounded-2xl border bg-white shadow-xl dark:bg-gray-800 ${
              plan.isPopular
                ? "border-purple-500 ring-2 ring-purple-500"
                : "border-gray-200 dark:border-gray-700"
            }`}
          >
            {plan.isPopular && (
              <div className="absolute right-0 top-0 -mt-3 mr-3">
                <span className="inline-flex items-center rounded-full bg-purple-500 px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-white">
                  پیشنهاد ویژه
                </span>
              </div>
            )}
            <div className="grow p-8 text-right">
              <h3 className="text-2xl font-semibold text-gray-900 dark:text-white">
                {plan.name}
              </h3>
              <div className="mt-6 flex items-baseline text-gray-900 dark:text-white">
                <span className="text-5xl font-extrabold tracking-tight">
                  {plan.priceToman}
                </span>
                <span className="mr-2 text-xl font-semibold">هزار تومان</span>
              </div>
              <p className="mt-4 text-gray-500 dark:text-gray-400">
                {plan.description}
              </p>
              <ul role="list" className="mt-8 space-y-4">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <div className="shrink-0">
                      <CheckCircle
                        className="size-6 text-green-500"
                        aria-hidden="true"
                      />
                    </div>
                    <p className="mr-3 text-base text-gray-700 dark:text-gray-300">
                      {feature}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
            <div className="mt-auto rounded-b-2xl bg-gray-50 p-8 dark:bg-gray-800/50">
              <button
                onClick={() => handlePayment(plan.id)}
                disabled={loadingPlan === plan.id}
                className={`w-full rounded-lg px-6 py-3 text-center text-lg font-semibold text-white transition-colors duration-200 ${
                  plan.isPopular
                    ? "bg-purple-600 hover:bg-purple-700"
                    : "bg-blue-600 hover:bg-blue-700"
                } disabled:cursor-not-allowed disabled:bg-gray-400`}
              >
                {loadingPlan === plan.id
                  ? "در حال انتقال..."
                  : "انتخاب و پرداخت"}
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="mx-auto mt-10 max-w-md">
        <label
          htmlFor="discount-code"
          className="mb-2 block text-right text-sm font-medium text-gray-900 dark:text-gray-300"
        >
          کد تخفیف دارید؟
        </label>
        <div className="flex rounded-lg shadow-sm">
          <input
            type="text"
            id="discount-code"
            value={discountCode}
            onChange={e => setDiscountCode(e.target.value.toUpperCase())}
            className="block w-full min-w-0 flex-1 rounded-r-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-purple-500 focus:ring-purple-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder:text-gray-400"
            placeholder="کد تخفیف خود را وارد کنید"
          />
          <span className="inline-flex items-center rounded-l-lg border border-l-0 border-gray-300 bg-gray-100 px-3 text-sm text-gray-500 dark:border-gray-600 dark:bg-gray-600 dark:text-gray-400">
            کد
          </span>
        </div>
      </div>

      {error && (
        <div
          className="mx-auto mt-8 max-w-md rounded-lg bg-red-100 p-4 text-center text-sm text-red-700 dark:bg-red-200 dark:text-red-800"
          role="alert"
        >
          <span className="font-medium">خطا:</span> {error}
        </div>
      )}
    </div>
  )
}
