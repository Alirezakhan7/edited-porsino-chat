// app/[locale]/profile/profile-client.tsx
"use client"

import { useState, useContext } from "react"
import { ChatbotUIContext } from "@/context/context"
import { supabase } from "@/lib/supabase/browser-client"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { motion } from "framer-motion"
import {
  IconAward,
  IconBook,
  IconCalendarEvent,
  IconCalendarStats,
  IconChecklist,
  IconCrown,
  IconEdit,
  IconFlame,
  IconGift,
  IconHistory,
  IconLogout,
  IconSparkles,
  IconTrophy,
  IconWallet,
  IconAlertCircle,
  IconCopy,
  IconRobot
} from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { ThemeSwitcher } from "@/components/utility/theme-switcher"
import {
  MaterialCard,
  IconWrapper,
  RippleButton,
  colorThemes,
  ColorKey
} from "@/components/material/MaterialUI"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "@/components/ui/tooltip"
import { ErrorBoundary } from "react-error-boundary"
import { EditProfileModal } from "./edit-profile-modal"
import { Tables } from "@/supabase/types"
import { toast } from "sonner"
import { ReferralModal } from "./referral-modal"

function ErrorFallback({ error }: { error: Error }) {
  return (
    <div className="bg-background text-foreground flex size-full min-h-screen flex-col items-center justify-center p-8">
      <IconAlertCircle size={48} className="mb-4 text-red-500" />
      <h2 className="mb-2 text-xl font-bold">مشکلی پیش آمد!</h2>
      <p className="text-muted-foreground mb-4 text-center">{error.message}</p>
      <Button onClick={() => window.location.reload()} variant="outline">
        تلاش مجدد
      </Button>
    </div>
  )
}

function StatCard({
  icon: Icon,
  value,
  label,
  color
}: {
  icon: any
  value: string
  label: string
  color: string
}) {
  const colors: Record<string, string> = {
    blue: "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
    orange:
      "bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400",
    emerald:
      "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400",
    purple:
      "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400"
  }
  return (
    <MaterialCard className="flex h-full cursor-default flex-col items-center justify-center p-4 text-center transition-transform hover:scale-[1.02]">
      <div className={`mb-3 rounded-full p-3 ${colors[color]}`}>
        <Icon size={24} />
      </div>
      <p className="text-2xl font-black text-slate-800 dark:text-white">
        {value}
      </p>
      <p className="mt-1 text-xs font-bold text-slate-500 dark:text-slate-400">
        {label}
      </p>
    </MaterialCard>
  )
}

// تعریف تایپ برای پراپ‌های جدید
interface ProfileStats {
  testsCompleted: number
  streakDays: number
  accuracy: number
  flashcardsCount: number
  chatsCount: number
  tokenLimit: number
  tokenUsed: number
}

interface ProfileClientProps {
  initialProfile: Tables<"profiles">
  stats: ProfileStats
}

function ProfilePageContent({ initialProfile, stats }: ProfileClientProps) {
  const { profile: contextProfile } = useContext(ChatbotUIContext)
  const profile = contextProfile || initialProfile
  const router = useRouter()
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isReferralModalOpen, setIsReferralModalOpen] = useState(false)

  const handleSignOut = async () => {
    if (!window.confirm("آیا مطمئن هستید که می‌خواهید خارج شوید؟")) return
    await supabase.auth.signOut()
    router.push("/login")
    router.refresh()
  }

  // ✅ تابع جدید برای کپی کردن کد معرف رندوم
  const handleCopyCode = () => {
    const code = profile?.referral_code || "---"
    navigator.clipboard.writeText(code)
    toast.success("کد معرف کپی شد!")
  }

  // --- محاسبات اشتراک ---
  const expiresAt = profile?.subscription_expires_at
    ? new Date(profile.subscription_expires_at)
    : null
  const isSubscribed =
    profile?.subscription_status === "active" &&
    expiresAt &&
    expiresAt > new Date()
  const remainingDays =
    isSubscribed && expiresAt
      ? Math.ceil(
          (expiresAt.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
        )
      : 0

  // --- محاسبه درصد مصرف توکن ---
  const tokenPercentage = Math.min(
    Math.round((stats.tokenUsed / stats.tokenLimit) * 100),
    100
  )

  // --- مدال‌های داینامیک ---
  const medals = [
    {
      id: 1,
      icon: IconChecklist,
      title: "تست‌زن ماهر",
      earned: stats.testsCompleted >= 100,
      desc: "انجام ۱۰۰ تست تستی",
      progress: Math.min((stats.testsCompleted / 100) * 100, 100),
      color: "blue" as ColorKey
    },
    {
      id: 2,
      icon: IconFlame, // تغییر آیکون به شعله برای استریک
      title: "هفته آتشین",
      earned: stats.streakDays >= 7,
      desc: "۷ روز فعالیت مستمر",
      progress: Math.min((stats.streakDays / 7) * 100, 100),
      color: "orange" as ColorKey
    },
    {
      id: 3,
      icon: IconAward,
      title: "استاد لایتنر",
      earned: stats.flashcardsCount >= 50,
      desc: "ساخت ۵۰ فلش‌کارت",
      progress: Math.min((stats.flashcardsCount / 50) * 100, 100),
      color: "pink" as ColorKey
    },
    {
      id: 4,
      icon: IconSparkles,
      title: "همیار هوشمند",
      earned: stats.chatsCount > 0,
      desc: "اولین گفتگو با هوش مصنوعی",
      progress: stats.chatsCount > 0 ? 100 : 0,
      color: "emerald" as ColorKey
    }
  ]

  if (!profile) return null

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
      {/* --- سایدبار پروفایل --- */}
      <aside className="space-y-6 lg:sticky lg:top-24 lg:col-span-4 lg:h-fit">
        <MaterialCard
          className="relative flex flex-col items-center p-6 pt-10"
          elevation={2}
        >
          {/* دکمه خروج آیکونی (می‌توانید حذفش کنید اگر دوست ندارید) */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute left-4 top-4 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20"
            onClick={handleSignOut}
          >
            <IconLogout size={20} />
          </Button>

          <div className="group relative mb-4">
            <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 opacity-30 blur-md transition-opacity duration-500 group-hover:opacity-50" />
            <Image
              src={profile.image_url || "/images/default-avatar.png"}
              alt="Profile"
              width={120}
              height={120}
              unoptimized // ✅ اضافه شده برای رفع ارور عکس
              className="relative z-10 size-32 rounded-full border-4 border-white bg-white object-cover shadow-xl dark:border-slate-800 dark:bg-slate-800"
            />
            <RippleButton
              onClick={() => setIsEditModalOpen(true)}
              className="absolute bottom-0 right-0 z-20 flex size-10 items-center justify-center rounded-full bg-blue-600 p-0 text-white shadow-lg hover:bg-blue-700"
            >
              <IconEdit size={18} />
            </RippleButton>
          </div>

          <h2 className="text-center text-2xl font-black text-slate-800 dark:text-white">
            {profile.display_name || "کاربر جدید"}
          </h2>
          <p
            className="mt-1 text-sm font-bold text-blue-600 dark:text-blue-400"
            dir="ltr"
          >
            @{profile.username}
          </p>

          <div className="mt-8 w-full space-y-4">
            {/* بخش وضعیت اشتراک */}
            {isSubscribed ? (
              <div className="flex w-full items-center justify-center gap-2 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300">
                <IconCalendarStats size={20} />
                <span className="text-sm font-bold">
                  {remainingDays} روز اشتراک باقیست
                </span>
              </div>
            ) : (
              <RippleButton
                onClick={() =>
                  window.open("https://chat.porsino.org/payment", "_blank")
                }
                className="w-full bg-gradient-to-r from-amber-400 to-orange-500 text-white shadow-orange-500/20 hover:shadow-orange-500/40"
              >
                <div className="flex items-center justify-center gap-2">
                  <IconCrown size={20} className="animate-pulse" />
                  <span>خرید اشتراک ویژه</span>
                </div>
              </RippleButton>
            )}

            {/* بخش اعتبار هوش مصنوعی */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/50">
              <div className="mb-2 flex items-center justify-between text-xs font-bold text-slate-600 dark:text-slate-300">
                <div className="flex items-center gap-1.5">
                  <IconRobot size={16} className="text-indigo-500" />
                  <span>اعتبار هوش مصنوعی</span>
                </div>
                <span>
                  {stats.tokenUsed.toLocaleString()} /{" "}
                  {stats.tokenLimit.toLocaleString()}
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    tokenPercentage > 90 ? "bg-red-500" : "bg-indigo-500"
                  }`}
                  style={{ width: `${tokenPercentage}%` }}
                />
              </div>
              {tokenPercentage > 90 && (
                <p className="mt-2 text-xs font-medium text-red-500">
                  اعتبار شما رو به اتمام است!
                </p>
              )}
            </div>

            {/* ✅ دکمه خروج بزرگ و جدید */}
            <Button
              onClick={handleSignOut}
              variant="outline"
              className="mt-4 h-12 w-full border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 dark:border-red-900/30 dark:text-red-400 dark:hover:bg-red-900/20"
            >
              <IconLogout size={18} className="ml-2" />
              خروج از حساب کاربری
            </Button>
          </div>
        </MaterialCard>

        {/* ... بقیه موارد سایدبار (تم سوییچر) ... */}
        <div className="hidden lg:block">
          <MaterialCard className="flex items-center justify-between p-5">
            <div className="flex items-center gap-3 font-bold text-slate-700 dark:text-slate-200">
              <IconSparkles size={20} className="text-purple-500" />
              <span>ظاهر برنامه</span>
            </div>
            <ThemeSwitcher />
          </MaterialCard>
        </div>
      </aside>

      {/* --- بخش اصلی محتوا --- */}
      <section className="space-y-8 pb-24 lg:col-span-8">
        {/* آمار */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h3 className="mb-4 flex items-center gap-2 text-xl font-bold text-slate-800 dark:text-white">
            <span className="h-6 w-1.5 rounded-full bg-blue-500" />
            آمار عملکرد
          </h3>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-5">
            <StatCard
              icon={IconBook}
              value={stats.testsCompleted.toString()}
              label="تست زده"
              color="blue"
            />
            <StatCard
              icon={IconFlame}
              value={stats.streakDays.toString()}
              label="روز متوالی"
              color="orange"
            />
            <StatCard
              icon={IconTrophy}
              value={`٪${stats.accuracy}`}
              label="دقت پاسخ"
              color="emerald"
            />
            <StatCard
              icon={IconChecklist}
              value={stats.flashcardsCount.toString()}
              label="فلش‌کارت"
              color="purple"
            />
          </div>
        </motion.div>

        {/* مدال‌ها */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h3 className="mb-4 flex items-center gap-2 text-xl font-bold text-slate-800 dark:text-white">
            <span className="h-6 w-1.5 rounded-full bg-purple-500" />
            دستاوردها
          </h3>
          <MaterialCard className="p-2">
            <div className="scrollbar-hide flex gap-4 overflow-x-auto p-2">
              <TooltipProvider>
                {medals.map(medal => (
                  <Tooltip key={medal.id}>
                    <TooltipTrigger asChild>
                      <div
                        className={`flex min-w-[100px] cursor-pointer flex-col items-center gap-3 rounded-xl p-3 transition-all hover:bg-slate-50 dark:hover:bg-slate-800/50 ${
                          medal.earned ? "opacity-100" : "opacity-50 grayscale"
                        }`}
                      >
                        <IconWrapper icon={medal.icon} color={medal.color} />
                        <span className="w-full truncate text-center text-xs font-bold text-slate-700 dark:text-slate-300">
                          {medal.title}
                        </span>
                        <div className="h-1 w-12 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                          <div
                            className={`h-full ${colorThemes[medal.color].bg}`}
                            style={{ width: `${medal.progress}%` }}
                          />
                        </div>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent className="border-slate-700 bg-slate-800 text-white">
                      <p className="text-xs font-bold">{medal.desc}</p>
                    </TooltipContent>
                  </Tooltip>
                ))}
              </TooltipProvider>
            </div>
          </MaterialCard>
        </motion.div>

        {/* درآمد از دعوت */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="mb-4 flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-xl font-bold text-slate-800 dark:text-white">
              <span className="h-6 w-1.5 rounded-full bg-emerald-500" />
              درآمد از دعوت
            </h3>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-slate-500 hover:text-emerald-500 dark:text-slate-400"
            >
              <IconHistory size={16} className="ml-1" />
              تاریخچه
            </Button>
          </div>
          <MaterialCard
            className="relative overflow-hidden p-6 md:p-8"
            elevation={2}
          >
            <div className="pointer-events-none absolute right-0 top-0 -mr-10 -mt-10 size-40 rounded-full bg-emerald-500/10 blur-3xl" />
            <div className="pointer-events-none absolute bottom-0 left-0 -mb-10 -ml-10 size-40 rounded-full bg-blue-500/10 blur-3xl" />

            <div className="relative z-10 flex flex-col items-center justify-between gap-6 md:flex-row">
              <div className="text-center md:text-right">
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                  موجودی قابل برداشت
                </p>
                {/* ✅ نمایش موجودی واقعی از دیتابیس */}
                <p className="mt-2 text-4xl font-black text-emerald-600 dark:text-emerald-400">
                  {(profile.wallet_balance || 0).toLocaleString()}
                  <span className="mr-2 text-lg font-bold text-emerald-600/70 dark:text-emerald-400/70">
                    تومان
                  </span>
                </p>

                {/* ✅ نمایش کد معرف به صورت برجسته */}
                <div className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-slate-100 px-3 py-1.5 md:justify-start dark:bg-slate-800">
                  <span className="text-xs text-slate-500">کد معرف شما:</span>
                  <span className="font-mono text-xl font-black tracking-widest text-slate-800 dark:text-white">
                    {profile.referral_code || "---"}
                  </span>
                </div>
              </div>

              <div className="flex w-full gap-3 md:w-[320px]">
                <RippleButton
                  onClick={() => setIsReferralModalOpen(true)}
                  className="h-12 flex-1 bg-emerald-600 text-white shadow-lg shadow-emerald-500/20 hover:bg-emerald-700"
                >
                  <span className="flex items-center justify-center gap-2 px-2 text-sm">
                    <IconWallet size={18} />
                    برداشت
                  </span>
                </RippleButton>
                <Button
                  onClick={handleCopyCode} // ✅ اتصال به تابع جدید
                  variant="outline"
                  className="h-12 flex-1 border-slate-200 text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  <IconCopy size={18} className="ml-2" />
                  کپی کد
                </Button>
              </div>
            </div>
          </MaterialCard>
        </motion.div>

        {/* تنظیمات موبایل */}
        <div className="block lg:hidden">
          <h3 className="mb-4 flex items-center gap-2 text-xl font-bold text-slate-800 dark:text-white">
            <span className="h-6 w-1.5 rounded-full bg-slate-400" />
            تنظیمات
          </h3>
          <MaterialCard className="flex items-center justify-between p-5">
            <div className="flex items-center gap-3 font-bold text-slate-700 dark:text-slate-200">
              <IconSparkles size={20} className="text-purple-500" />
              <span>ظاهر برنامه</span>
            </div>
            <ThemeSwitcher />
          </MaterialCard>
        </div>
      </section>

      <EditProfileModal
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        initialProfile={profile}
      />
      {/* ✅ اضافه کردن مودال جدید در اینجا */}
      <ReferralModal
        open={isReferralModalOpen}
        onOpenChange={setIsReferralModalOpen}
        userId={profile.user_id}
      />
    </div>
  )
}

export default function ProfileClient({
  initialProfile,
  stats
}: ProfileClientProps) {
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <ProfilePageContent initialProfile={initialProfile} stats={stats} />
    </ErrorBoundary>
  )
}
