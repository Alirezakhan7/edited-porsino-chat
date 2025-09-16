/* --------------------------------------------------------------------------
   File: app/(dashboard)/payment/page.tsx
   -------------------------------------------------------------------------- */
"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { CheckCircle, Check, Loader2, Percent, X } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

/* ------------------------------------------------------------------ */
/* ۱. داده‌های پلن و کدهای تخفیف (برای محاسبهٔ قیمت نمایشی)            */
/*    — با بک‌اند هماهنگ است؛ در صورت تغییر در سرور این مقادیر را نیز  */
/*      بروز کنید تا محاسبهٔ کلاینتی قیمت درست باشد.                 */
/* ------------------------------------------------------------------ */
type DiscountDetail =
  | { discountPercent: number }
  | { discountAmountRial: number }

const serverPlans = {
  bio_1m: {
    name: "پلن یک‌ماهه زیست‌شناسی",
    months: 1,
    priceRialTotal: 3_400_000
  },
  bio_6m: {
    name: "پلن ۶ ماهه زیست‌شناسی",
    months: 6,
    priceRialTotal: 16_720_000
  },
  bio_9m: {
    name: "پلن ۹ ماهه زیست‌شناسی",
    months: 9,
    priceRialTotal: 22_950_000
  }
} as const

// (اختیاری) تخفیف‌ها — در تولید غیرفعال یا سقف‌دار
const serverDiscountCodes: Record<string, DiscountDetail> = {
  // "BACK2SCHOOL": { discountPercent: 10 }
}

// فقط زیست
const featuresBio = [
  "دسترسی کامل به درس زیست‌شناسی",
  "پرسش و پاسخ با هوش مصنوعی",
  "آموزش‌های گام‌به‌گام",
  "یک میلیون توکن در هر ماه از دوره"
]

/* ------------------------------------------------------------------ */
/* ۲. توابع کمکی برای قالب‌بندی عدد و تبدیل به ارقام فارسی             */
/* ------------------------------------------------------------------ */
const toPersianDigits = (str: string | number) =>
  str.toString().replace(/\d/g, d => "۰۱۲۳۴۵۶۷۸۹"[parseInt(d)])

const formatNumber = (num: number) =>
  toPersianDigits(num.toLocaleString("en-US"))

const rialToThousandToman = (rial: number) => Math.round(rial / 10_000)

/* ------------------------------------------------------------------ */
/* ۳. کامپوننت اصلی                                                   */
/* ------------------------------------------------------------------ */
export default function PaymentPage() {
  /* ─────────────[ state ]───────────── */
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null)

  const [showDiscountCode, setShowDiscountCode] = useState(false)
  const [discountInput, setDiscountInput] = useState("")
  const [appliedCode, setAppliedCode] = useState<string | null>(null)
  const [discountError, setDiscountError] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClientComponentClient()
  const router = useRouter()

  /* ─────────────[ ۳‑۱. بررسی لاگین ]───────────── */
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

  /* ─────────────[ ۳‑۲. اعمال کد تخفیف در کلاینت ]───────────── */
  const discountedPrices = useMemo(() => {
    if (!appliedCode || !(appliedCode in serverDiscountCodes)) return null

    const details = serverDiscountCodes[appliedCode]
    const map: Record<string, number> = {}

    Object.entries(serverPlans).forEach(([id, plan]) => {
      // نکته‌ی مهم: نوع رو تعمداً به number تبدیل می‌کنیم تا literal type نباشه
      let amount: number = Number(plan.priceRialTotal)

      if ("discountPercent" in details) {
        amount = amount * (1 - details.discountPercent / 100)
      } else if ("discountAmountRial" in details) {
        amount = Math.max(5_000, amount - details.discountAmountRial)
      }

      map[id] = Math.round(amount)
    })
    return map
  }, [appliedCode])

  const handleApplyCode = () => {
    const code = discountInput.trim().toUpperCase()
    if (!code) return
    if (code in serverDiscountCodes) {
      setAppliedCode(code)
      setDiscountError(null)
    } else {
      setAppliedCode(null)
      setDiscountError("کد تخفیف نامعتبر است.")
    }
  }

  /* ─────────────[ ۳‑۳. ارسال درخواست پرداخت ]───────────── */
  const handlePayment = async (planId: string) => {
    setLoadingPlan(planId)
    setError(null)

    try {
      const response = await fetch("/api/pardakht/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId,
          discountCode: appliedCode ?? ""
        })
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

  /* ─────────────[ ۴. لودینگ اولیه ]───────────── */
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-sky-50 via-emerald-50 to-blue-100 dark:from-gray-900 dark:via-blue-900 dark:to-emerald-900">
        <div className="flex items-center space-x-3 space-x-reverse rounded-2xl border border-white/30 bg-white/20 p-8 shadow-2xl backdrop-blur-xl dark:bg-white/10">
          <Loader2 className="size-8 animate-spin text-blue-600" />
          <p className="text-lg font-medium text-gray-700 dark:text-gray-200">
            در حال بررسی اطلاعات کاربر...
          </p>
        </div>
      </div>
    )
  }

  /* ─────────────[ ۵. UI ]───────────── */
  return (
    <div className="bg-background w-full ">
      {/* Multi-layer Background */}
      <div className="fixed inset-0 size-full">
        <div className="absolute inset-0 bg-gradient-to-tr from-blue-100/30 via-transparent to-emerald-100/30 dark:from-blue-900/30 dark:via-transparent dark:to-emerald-900/30"></div>
        <div className="absolute inset-0 bg-gradient-to-bl from-transparent via-sky-50/20 to-transparent dark:from-transparent dark:via-blue-800/20 dark:to-transparent"></div>
        <div className="absolute inset-x-0 bottom-0 h-96 bg-gradient-to-t from-emerald-100/40 via-sky-50/20 to-transparent dark:from-emerald-900/40 dark:via-blue-900/20 dark:to-transparent"></div>
      </div>

      <div className="relative mx-auto min-h-screen w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        {/* ---------- Header ---------- */}
        <header className="mb-16 text-center">
          <h1 className="mb-6 text-5xl font-bold tracking-tight text-gray-900 md:text-6xl dark:text-white">
            انتخاب پلن اشتراک
          </h1>
          <p className="mx-auto max-w-3xl text-xl leading-relaxed text-gray-600 dark:text-gray-300">
            بهترین گزینه را برای نیازهای خود انتخاب کرده و به امکانات ویژه
            دسترسی پیدا کنید
          </p>
        </header>

        {/* ---------- Plans Grid ---------- */}
        <div className="mb-20 grid gap-8 lg:grid-cols-2">
          {Object.entries(serverPlans).map(([planId, plan]) => {
            // محاسبه قیمت‌ها
            const base = plan.priceRialTotal
            const finalPriceRial = discountedPrices?.[planId] ?? base
            const monthlyEqRial = Math.round(finalPriceRial / plan.months)
            const isPopular = planId === "bio_6m" // «پرطرفدار»
            const isDiscounted =
              appliedCode && discountedPrices?.[planId] !== base

            return (
              <motion.div
                key={planId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className={`relative overflow-hidden rounded-3xl border shadow-2xl backdrop-blur-xl transition-all duration-300 hover:scale-[1.02] ${
                  isPopular
                    ? "border-blue-200/50 bg-gradient-to-br from-white/30 to-white/10 shadow-blue-500/20 dark:border-blue-400/30 dark:from-white/20 dark:to-white/5"
                    : "border-white/30 bg-white/20 hover:bg-white/30 dark:border-white/20 dark:bg-white/10 dark:hover:bg-white/15"
                }`}
              >
                {/* Content */}
                <div className="space-y-8 p-6 text-center sm:p-8 lg:p-10">
                  {/* Plan Name */}
                  <div className="text-center">
                    <h3 className="text-2xl font-bold text-gray-900 md:text-3xl lg:text-4xl dark:text-white">
                      {plan.name}
                    </h3>
                  </div>

                  {/* Pricing */}
                  <div
                    className="flex w-full flex-col items-center text-center"
                    dir="rtl"
                  >
                    <div className="flex items-end justify-center gap-2">
                      <span className="bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-4xl font-bold text-transparent sm:text-5xl dark:from-emerald-300 dark:to-blue-200 dark:text-transparent">
                        {formatNumber(rialToThousandToman(monthlyEqRial))}
                      </span>
                      <span className="mb-1 text-xs font-light text-gray-600 sm:text-sm dark:text-gray-400">
                        هزار تومان / {plan.months === 1 ? "ماهانه" : "ماه"}
                      </span>
                    </div>

                    {/* قیمت کل دوره برای پلن‌های بیشتر از ۱ ماه */}
                    {plan.months > 1 && (
                      <div className="mt-1 text-right text-base text-gray-400 dark:text-gray-500">
                        قیمت کل دوره:{" "}
                        <span className="font-bold text-gray-600 dark:text-gray-300">
                          {formatNumber(rialToThousandToman(finalPriceRial))}
                        </span>{" "}
                        هزار تومان
                      </div>
                    )}

                    {/* نشانگر تخفیف در صورت اعمال کد */}
                    {isDiscounted && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3 }}
                        className="mt-4 inline-flex items-center gap-2 rounded-full bg-green-100 px-4 py-2 text-sm font-semibold text-green-700 dark:bg-green-900/20 dark:text-green-400"
                      >
                        تخفیف اعمال شد
                      </motion.div>
                    )}
                  </div>

                  {/* Features */}
                  <ul className="space-y-4 text-right">
                    {featuresBio.map((feature, idx) => (
                      <motion.li
                        key={idx}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 * idx }}
                        className="flex flex-row-reverse items-center gap-3 text-gray-700 dark:text-gray-300"
                      >
                        <CheckCircle className="mt-0.5 size-6 shrink-0 text-green-500" />
                        <span className="text-lg">{feature}</span>
                      </motion.li>
                    ))}
                  </ul>

                  {/* Button */}
                  <button
                    onClick={() => handlePayment(planId)}
                    disabled={loadingPlan === planId}
                    className={`
                        w-full rounded-2xl border-2 border-white/70 px-8 py-6
                        text-xl font-bold shadow-xl
                        transition-all duration-300 hover:scale-[1.02]
                        disabled:cursor-not-allowed disabled:opacity-50
                        dark:border-emerald-300/60
                        ${
                          isPopular
                            ? "bg-gradient-to-r from-blue-500 to-emerald-500 text-white shadow-blue-500/30 hover:from-blue-600 hover:to-emerald-600"
                            : "bg-gradient-to-r from-gray-800 to-gray-900 text-white hover:from-gray-700 hover:to-gray-800 dark:from-emerald-300 dark:to-blue-200 dark:text-gray-900 dark:hover:from-blue-200 dark:hover:to-emerald-300"
                        }
                      `}
                  >
                    {loadingPlan === planId ? (
                      <span className="flex items-center justify-center gap-3">
                        <Loader2 className="size-6 animate-spin" />
                        در حال انتقال...
                      </span>
                    ) : (
                      "انتخاب و پرداخت"
                    )}
                  </button>
                </div>
              </motion.div>
            )
          })}
        </div>

        {/* ---------- Discount Code Section ---------- */}
        <div className="mx-auto max-w-4xl">
          <div className="flex flex-col items-center gap-6 rounded-3xl border border-white/40 bg-gradient-to-r from-white/25 via-white/15 to-white/25 p-8 shadow-2xl backdrop-blur-xl lg:flex-row dark:from-white/15 dark:via-white/5 dark:to-white/15">
            {/* Explanatory Text (Right Side) */}
            <div className="flex-1 text-right">
              <h3 className="mb-3 bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-2xl font-bold text-transparent">
                کد تخفیف دارید؟
              </h3>
              <p className="text-lg leading-relaxed text-gray-600 dark:text-gray-300">
                برای استفاده از کد تخفیف، ابتدا ثبت‌نام کنید، سپس دکمه‌ی کنار را
                بزنید و کد خود را وارد کنید
              </p>
            </div>

            {/* Discount Code Button (Left Side) */}
            <div className="w-full lg:w-80">
              <AnimatePresence initial={false}>
                {!showDiscountCode && (
                  <motion.button
                    layout
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 16 }}
                    transition={{ duration: 0.25 }}
                    onClick={() => setShowDiscountCode(true)}
                    className="group flex w-full items-center justify-center gap-4 rounded-2xl border-2 border-dashed border-blue-300/50 bg-gradient-to-r from-blue-500/20 to-emerald-500/20 px-8 py-6 text-blue-700 backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:border-blue-400/70 hover:from-blue-500/30 hover:to-emerald-500/30 dark:border-blue-400/30 dark:text-blue-300"
                  >
                    <Percent className="size-8 shrink-0 transition-transform duration-300 group-hover:rotate-12" />
                    <div className="text-right">
                      <div className="text-xl font-bold">اعمال کد تخفیف</div>
                      <div className="text-sm opacity-75">کلیک کنید</div>
                    </div>
                  </motion.button>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Discount Form */}
          <AnimatePresence>
            {showDiscountCode && (
              <motion.div
                key="discountForm"
                initial={{ height: 0, opacity: 0, y: -20 }}
                animate={{ height: "auto", opacity: 1, y: 0 }}
                exit={{ height: 0, opacity: 0, y: -20 }}
                transition={{ duration: 0.4 }}
                className="mt-6 overflow-hidden"
              >
                <div className="rounded-3xl border border-white/50 bg-gradient-to-br from-white/35 via-white/20 to-white/35 p-8 shadow-2xl backdrop-blur-xl dark:from-white/20 dark:via-white/10 dark:to-white/20">
                  {/* Header */}
                  <div className="mb-6 flex items-center justify-between">
                    <h3 className="bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-2xl font-bold text-transparent">
                      کد تخفیف خود را وارد کنید
                    </h3>
                    <button
                      onClick={() => {
                        setShowDiscountCode(false)
                        setDiscountInput("")
                        setAppliedCode(null)
                        setDiscountError(null)
                      }}
                      className="rounded-full p-3 text-gray-500 transition-all duration-200 hover:scale-110 hover:bg-gray-100/50 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-800/50 dark:hover:text-gray-300"
                    >
                      <X className="size-6" />
                    </button>
                  </div>

                  {/* Input + Apply */}
                  <div className="mb-6 flex gap-4">
                    <input
                      dir="ltr"
                      spellCheck={false}
                      type="text"
                      value={discountInput}
                      onChange={e =>
                        setDiscountInput(e.target.value.toUpperCase())
                      }
                      placeholder="SALE30"
                      className="flex-1 rounded-2xl border-2 border-white/30 bg-white/30 px-6 py-4 text-center font-mono text-xl tracking-widest text-gray-900 backdrop-blur-sm transition-all duration-200 placeholder:text-gray-500 focus:border-blue-400 focus:bg-white/50 focus:ring-4 focus:ring-blue-500/20 dark:bg-white/15 dark:text-white dark:placeholder:text-gray-400 dark:focus:bg-white/25"
                    />
                    <button
                      onClick={handleApplyCode}
                      className="rounded-2xl bg-gradient-to-r from-blue-500 to-emerald-500 px-8 py-4 text-lg font-bold text-white shadow-lg transition-all duration-200 hover:scale-105 hover:from-blue-600 hover:to-emerald-600 hover:shadow-xl disabled:opacity-50"
                    >
                      اعمال
                    </button>
                  </div>

                  {/* Result Message */}
                  <div className="text-center">
                    <AnimatePresence mode="wait">
                      {appliedCode && !discountError && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          className="inline-flex items-center gap-3 rounded-2xl bg-green-100 px-6 py-3 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                        >
                          <Check className="size-6" />
                          <span className="text-lg font-semibold">
                            کد&nbsp;
                            <span className="font-mono">{appliedCode}</span>
                            &nbsp;با موفقیت اعمال شد!
                          </span>
                        </motion.div>
                      )}
                      {discountError && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          className="inline-flex items-center gap-3 rounded-2xl bg-red-100 px-6 py-3 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                        >
                          <X className="size-6" />
                          <span className="text-lg font-semibold">
                            {discountError}
                          </span>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ---------- Error (پرداخت) ---------- */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.9 }}
              className="mx-auto mt-10 max-w-md rounded-2xl border border-red-200/50 bg-red-100/50 p-6 shadow-2xl backdrop-blur-xl dark:border-red-800/50 dark:bg-red-900/30"
            >
              <div className="flex items-center gap-4">
                <div className="size-4 animate-pulse rounded-full bg-red-500" />
                <p className="text-right text-lg font-semibold text-red-800 dark:text-red-400">
                  {error}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
