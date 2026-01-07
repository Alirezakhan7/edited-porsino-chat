/* --------------------------------------------------------------------------
   File: app/payment-result/page.tsx
   Description: Displays the result of the payment transaction to the user.
                On success, it automatically redirects to the /chat page.
   -------------------------------------------------------------------------- */
"use client"

import { useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { CheckCircle, XCircle, AlertTriangle, ArrowLeft } from "lucide-react"
import { motion } from "framer-motion"

export default function PaymentResultPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const status = searchParams.get("status")
  const message = searchParams.get("message")
  const orderId = searchParams.get("order_id")

  // Redirect to chat page after a delay on success
  useEffect(() => {
    if (status === "success") {
      const timer = setTimeout(() => {
        router.push("/chat")
      }, 3000) // 3-second delay before redirecting

      return () => clearTimeout(timer) // Cleanup timer on component unmount
    }
  }, [status, router])

  const renderContent = () => {
    switch (status) {
      case "success":
        return {
          icon: <CheckCircle className="size-16 text-green-500" />,
          title: "پرداخت موفق",
          description:
            message ||
            "اشتراک شما با موفقیت فعال شد. تا چند لحظه دیگر به صفحه چت منتقل می‌شوید",
          button: null,
          bgColor: "bg-green-50 dark:bg-green-900/20",
          borderColor: "border-green-200 dark:border-green-700",
          textColor: "text-green-800 dark:text-green-300"
        }
      case "failed":
        return {
          icon: <XCircle className="size-16 text-red-500" />,
          title: "تراکنش ناموفق",
          description:
            message || "متاسفانه پرداخت شما ناموفق بود. لطفاً دوباره تلاش کنید",
          button: { text: "بازگشت به صفحه پرداخت", path: "/payment" },
          bgColor: "bg-red-50 dark:bg-red-900/20",
          borderColor: "border-red-200 dark:border-red-700",
          textColor: "text-red-800 dark:text-red-300"
        }
      default:
        return {
          icon: <AlertTriangle className="size-16 text-yellow-500" />,
          title: "خطا در پرداخت",
          description:
            message ||
            "یک خطای پیش‌بینی نشده رخ داد. لطفاً با پشتیبانی تماس بگیرید",
          button: { text: "بازگشت به صفحه پرداخت", path: "/payment" },
          bgColor: "bg-yellow-50 dark:bg-yellow-900/20",
          borderColor: "border-yellow-200 dark:border-yellow-700",
          textColor: "text-yellow-800 dark:text-yellow-300"
        }
    }
  }

  const { icon, title, description, button, bgColor, borderColor, textColor } =
    renderContent()

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 dark:bg-gray-900">
      <motion.div
        dir="rtl"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className={`w-full max-w-md rounded-2xl border ${borderColor} ${bgColor} p-8 text-center shadow-lg`}
      >
        <div className="mx-auto mb-6 flex size-20 items-center justify-center rounded-full bg-white dark:bg-gray-800">
          {icon}
        </div>
        <h1 className={`mb-4 text-3xl font-bold ${textColor}`}>{title}</h1>
        <p className="mb-6 text-lg text-gray-600 dark:text-gray-300">
          {description}
        </p>

        {orderId && (
          <div className="mb-8 rounded-lg bg-gray-200/50 p-3 text-sm text-gray-500 dark:bg-gray-700/50 dark:text-gray-400">
            <span className="font-semibold">شماره سفارش</span>
            <span className="select-all font-mono" dir="ltr">
              {orderId}
            </span>
          </div>
        )}

        {button && (
          <button
            onClick={() => router.push(button.path)}
            className="inline-flex items-center gap-2 rounded-lg bg-gray-800 px-6 py-3 font-semibold text-white transition hover:bg-gray-700 dark:bg-gray-200 dark:text-gray-900 dark:hover:bg-gray-300"
          >
            <ArrowLeft className="size-5" />
            {button.text}
          </button>
        )}

        {status === "success" && (
          <div className="relative mt-8 h-1 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
            <motion.div
              className="absolute left-0 top-0 h-full bg-green-500"
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{ duration: 3, ease: "linear" }}
            />
          </div>
        )}
      </motion.div>
    </div>
  )
}
