"use client"

import { useEffect, useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from "@/components/ui/dialog"
import { supabase } from "@/lib/supabase/browser-client"
import {
  IconUsers,
  IconCreditCard,
  IconGift,
  IconLoader
} from "@tabler/icons-react"
import { motion } from "framer-motion"
import { RippleButton } from "@/components/material/MaterialUI"
import { toast } from "sonner"

interface ReferralModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  userId: string
}

export function ReferralModal({
  open,
  onOpenChange,
  userId
}: ReferralModalProps) {
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false) // لودینگ دکمه
  const [stats, setStats] = useState({ total_invited: 0, total_paid: 0 })

  // هدف ما: ۱۰ نفر پرداخت کننده
  const GOAL = 10
  const progress = Math.min((stats.total_paid / GOAL) * 100, 100)

  // شرط فعال شدن دکمه: باید حداقل ۱۰ نفر باشند
  // (نکته: لاجیک اصلی بررسی تکراری نبودن جایزه در سمت سرور انجام می‌شود)
  const isGoalReached = stats.total_paid >= GOAL

  useEffect(() => {
    async function fetchStats() {
      if (!open || !userId) return

      setLoading(true)
      // دریافت آمار از دیتابیس
      const { data, error } = await (supabase.rpc as any)(
        "get_referral_stats",
        {
          target_user_id: userId
        }
      )

      if (error) {
        console.error("Error fetching stats:", error)
        toast.error("خطا در دریافت آمار")
      } else {
        setStats(data)
      }
      setLoading(false)
    }

    fetchStats()
  }, [open, userId])

  // ✅ تابع جدید: دریافت جایزه
  const handleClaimReward = async () => {
    setActionLoading(true)
    try {
      const { data, error } = await (supabase.rpc as any)(
        "claim_referral_reward",
        {
          target_user_id: userId
        }
      )

      if (error) throw error

      if (data.success) {
        toast.success(data.message)
        onOpenChange(false) // بستن مودال
        window.location.reload() // رفرش صفحه برای دیدن اشتراک جدید
      } else {
        toast.error(data.message) // مثلا: هنوز امتیاز کافی ندارید
      }
    } catch (err) {
      console.error(err)
      toast.error("خطا در ارتباط با سرور")
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md border-0 bg-white/90 p-0 backdrop-blur-xl sm:rounded-3xl dark:bg-slate-900/90">
        <div className="p-6">
          <DialogHeader className="mb-6 text-center">
            <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
              <IconGift size={32} />
            </div>
            <DialogTitle className="text-2xl font-black text-slate-800 dark:text-white">
              وضعیت جوایز شما
            </DialogTitle>
            <DialogDescription className="text-slate-500 dark:text-slate-400">
              با دعوت از دوستانتان و خرید اشتراک توسط آن‌ها، جایزه بگیرید!
            </DialogDescription>
          </DialogHeader>

          {loading ? (
            <div className="flex h-32 items-center justify-center">
              <IconLoader className="animate-spin text-slate-400" />
            </div>
          ) : (
            <div className="space-y-8">
              {/* بخش آمار */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col items-center justify-center rounded-2xl bg-slate-50 p-4 dark:bg-slate-800">
                  <div className="mb-2 rounded-full bg-blue-100 p-2 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                    <IconUsers size={20} />
                  </div>
                  <span className="text-2xl font-bold text-slate-800 dark:text-white">
                    {stats.total_invited}
                  </span>
                  <span className="text-xs text-slate-500">کل دعوت‌ها</span>
                </div>

                <div className="flex flex-col items-center justify-center rounded-2xl bg-slate-50 p-4 dark:bg-slate-800">
                  <div className="mb-2 rounded-full bg-emerald-100 p-2 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
                    <IconCreditCard size={20} />
                  </div>
                  <span className="text-2xl font-bold text-slate-800 dark:text-white">
                    {stats.total_paid}
                  </span>
                  <span className="text-xs text-slate-500">پرداخت موفق</span>
                </div>
              </div>

              {/* نوار پیشرفت */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm font-bold">
                  <span className="text-slate-600 dark:text-slate-300">
                    مسیر دریافت جایزه
                  </span>
                  <span className="text-emerald-600 dark:text-emerald-400">
                    {stats.total_paid % GOAL} / {GOAL}
                    {/* اگر بیشتر از ۱۰ بود، باقیمانده را نشان بده */}
                  </span>
                </div>
                <div className="relative h-4 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                  <motion.div
                    className="absolute inset-y-0 right-0 rounded-full bg-gradient-to-r from-emerald-500 to-teal-400"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                  />
                </div>
                <p className="text-center text-xs text-slate-500">
                  {isGoalReached
                    ? "🎉 شرایط دریافت جایزه تکمیل شد!"
                    : `فقط ${GOAL - (stats.total_paid % GOAL)} نفر دیگر تا ۱ ماه اشتراک رایگان!`}
                </p>
              </div>

              {/* دکمه دریافت جایزه */}
              <RippleButton
                disabled={actionLoading || !isGoalReached}
                className={`w-full ${
                  isGoalReached
                    ? "bg-emerald-600 hover:bg-emerald-700"
                    : "cursor-not-allowed bg-slate-300 text-slate-500 shadow-none hover:bg-slate-300 hover:brightness-100 dark:bg-slate-700 dark:text-slate-500"
                }`}
                onClick={() => {
                  if (isGoalReached) {
                    handleClaimReward() // 👈 فراخوانی تابع
                  } else {
                    toast.error(`هنوز به ${GOAL} نفر نرسیده‌اید!`)
                  }
                }}
              >
                {actionLoading ? (
                  <IconLoader className="animate-spin" />
                ) : isGoalReached ? (
                  "دریافت ۱ ماه اشتراک رایگان"
                ) : (
                  "هنوز تکمیل نشده"
                )}
              </RippleButton>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
