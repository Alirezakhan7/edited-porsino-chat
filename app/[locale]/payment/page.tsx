"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { CheckCircle, Loader2, Tag, X } from "lucide-react"

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
  const [showDiscountCode, setShowDiscountCode] = useState(false)
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
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-gray-100 dark:from-gray-900 dark:to-slate-800">
        <div className="flex items-center space-x-3 space-x-reverse">
          <Loader2 className="size-8 animate-spin text-indigo-600" />
          <p className="text-lg text-gray-600 dark:text-gray-300">
            در حال بررسی اطلاعات کاربر...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 dark:from-gray-900 dark:to-slate-800">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl lg:text-5xl dark:text-white">
            انتخاب پلن اشتراک
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-600 dark:text-gray-400">
            بهترین گزینه را برای نیازهای خود انتخاب کرده و به امکانات ویژه
            دسترسی پیدا کنید
          </p>
        </div>

        {/* Plans Grid */}
        <div className="mt-16 grid gap-8 lg:grid-cols-2 lg:gap-12">
          {displayPlans.map(plan => (
            <div
              key={plan.id}
              className={`group relative overflow-hidden rounded-3xl bg-white shadow-lg transition-all duration-300 hover:shadow-2xl dark:bg-gray-800 ${
                plan.isPopular
                  ? "ring-2 ring-indigo-500 ring-offset-4 ring-offset-transparent dark:ring-offset-gray-900"
                  : "hover:shadow-xl"
              }`}
            >
              {/* Popular Badge */}
              {plan.isPopular && (
                <div className="absolute left-6 top-6 z-10">
                  <div className="flex items-center space-x-1 space-x-reverse rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 px-3 py-1.5 text-xs font-semibold text-white">
                    <span>پیشنهاد ویژه</span>
                  </div>
                </div>
              )}

              {/* Card Content */}
              <div className="p-8 lg:p-10">
                {/* Plan Name */}
                <h3 className="text-right text-2xl font-bold text-gray-900 dark:text-white">
                  {plan.name}
                </h3>

                {/* Price */}
                <div className="mt-6 text-right">
                  <div className="flex items-baseline justify-end space-x-2 space-x-reverse">
                    <span className="text-4xl font-bold text-gray-900 lg:text-5xl dark:text-white">
                      {plan.priceToman}
                    </span>
                    <span className="text-lg font-medium text-gray-500 dark:text-gray-400">
                      هزار تومان
                    </span>
                  </div>
                </div>

                {/* Description */}
                <p className="mt-4 text-right text-gray-600 dark:text-gray-400">
                  {plan.description}
                </p>

                {/* Features */}
                <ul className="mt-8 space-y-4">
                  {plan.features.map((feature, index) => (
                    <li
                      key={index}
                      className="flex items-start space-x-3 space-x-reverse"
                    >
                      <CheckCircle className="mt-0.5 size-5 shrink-0 text-green-500" />
                      <span className="text-right text-gray-700 dark:text-gray-300">
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>

                {/* CTA Button */}
                <button
                  onClick={() => handlePayment(plan.id)}
                  disabled={loadingPlan === plan.id}
                  className={`mt-8 w-full rounded-2xl px-6 py-4 text-lg font-semibold transition-all duration-200 ${
                    plan.isPopular
                      ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:from-indigo-600 hover:to-purple-700 focus:ring-4 focus:ring-purple-500/25"
                      : "bg-gray-900 text-white hover:bg-gray-800 focus:ring-4 focus:ring-gray-500/25 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100"
                  } disabled:cursor-not-allowed disabled:opacity-50`}
                >
                  {loadingPlan === plan.id ? (
                    <div className="flex items-center justify-center space-x-2 space-x-reverse">
                      <Loader2 className="size-5 animate-spin" />
                      <span>در حال انتقال...</span>
                    </div>
                  ) : (
                    "انتخاب و پرداخت"
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Discount Code Section */}
        <div className="mx-auto mt-16 max-w-md">
          {!showDiscountCode ? (
            <button
              onClick={() => setShowDiscountCode(true)}
              className="group flex w-full items-center justify-center space-x-2 space-x-reverse rounded-2xl border-2 border-dashed border-gray-300 bg-white/50 px-6 py-4 text-gray-600 transition-all duration-200 hover:border-indigo-400 hover:bg-white hover:text-indigo-600 dark:border-gray-600 dark:bg-gray-800/50 dark:text-gray-400 dark:hover:border-indigo-500 dark:hover:bg-gray-800 dark:hover:text-indigo-400"
            >
              <Tag className="size-5" />
              <span className="font-medium">کد تخفیف دارید؟</span>
            </button>
          ) : (
            <div className="rounded-2xl bg-white p-6 shadow-lg dark:bg-gray-800">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  کد تخفیف
                </h3>
                <button
                  onClick={() => {
                    setShowDiscountCode(false)
                    setDiscountCode("")
                  }}
                  className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
                >
                  <X className="size-5" />
                </button>
              </div>
              <div className="mt-4">
                <input
                  type="text"
                  value={discountCode}
                  onChange={e => setDiscountCode(e.target.value.toUpperCase())}
                  className="w-full rounded-xl border border-gray-300 bg-gray-50 px-4 py-3 text-center font-mono text-lg tracking-wider text-gray-900 placeholder:text-gray-500 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/25 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder:text-gray-400 dark:focus:border-indigo-500"
                  placeholder="کد تخفیف خود را وارد کنید"
                  dir="ltr"
                />
              </div>
            </div>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="mx-auto mt-8 max-w-md rounded-2xl bg-red-50 p-4 dark:bg-red-900/20">
            <div className="flex items-center space-x-3 space-x-reverse">
              <div className="size-2 rounded-full bg-red-500"></div>
              <p className="text-sm font-medium text-red-800 dark:text-red-400">
                {error}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
