"use client"

import { ChatbotUIContext } from "@/context/context"
import { supabase } from "@/lib/supabase/browser-client"
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
  IconUsers,
  IconWallet,
  IconAlertCircle,
  IconLayoutDashboard,
  IconLoader2,
  IconCircleCheckFilled,
  IconCircleXFilled
} from "@tabler/icons-react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { useCallback, useContext, useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { ThemeSwitcher } from "@/components/utility/theme-switcher"
import { motion } from "framer-motion"

// ایمپورت‌های کامپوننت‌های متریال (مطمئن شوید فایل MaterialUI.tsx در این مسیر است)
import {
  MaterialCard,
  IconWrapper,
  RippleButton,
  colorThemes,
  ColorKey
} from "@/components/material/MaterialUI"

// کامپوننت‌های UI شادکن (Shadcn UI)
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "@/components/ui/tooltip"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import ImagePicker from "@/components/ui/image-picker"
import { toast } from "sonner"
import { ErrorBoundary } from "react-error-boundary"

// محدودیت‌ها و توابع دیتابیس (بر اساس کد ارسالی شما)
import {
  PROFILE_DISPLAY_NAME_MAX,
  PROFILE_USERNAME_MAX,
  PROFILE_USERNAME_MIN
} from "@/db/limits"
import { updateProfile } from "@/db/profile"
import { uploadProfileImage } from "@/db/storage/profile-images"

// ##################################################################
// 1. کامپوننت نمایش خطا (Error Fallback)
// ##################################################################
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

// ##################################################################
// 2. محتوای اصلی صفحه (Profile Content)
// ##################################################################
function ProfilePageContent() {
  const { profile, setProfile } = useContext(ChatbotUIContext)
  const router = useRouter()
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)

  // هندل کردن خروج
  const handleSignOut = async () => {
    const confirmed = window.confirm("آیا مطمئن هستید که می‌خواهید خارج شوید؟")
    if (!confirmed) return
    await supabase.auth.signOut()
    router.push("/login")
    router.refresh()
  }

  // اگر پروفایل هنوز لود نشده
  if (!profile) {
    return (
      <div className="bg-background flex h-screen w-full items-center justify-center">
        <IconLoader2 className="animate-spin text-blue-500" size={32} />
      </div>
    )
  }

  // محاسبه وضعیت اشتراک
  const expiresAt = profile.subscription_expires_at
    ? new Date(profile.subscription_expires_at)
    : null
  const isSubscribed =
    profile.subscription_status === "active" &&
    expiresAt &&
    expiresAt > new Date()
  let remainingDays = 0
  if (isSubscribed && expiresAt) {
    remainingDays = Math.ceil(
      (expiresAt.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    )
  }

  // داده‌های نمونه برای مدال‌ها
  const medals = [
    {
      id: 1,
      icon: IconChecklist,
      title: "۱۰۰ تست",
      earned: true,
      desc: "زدن ۱۰۰ تست زیست",
      progress: 100,
      color: "blue" as ColorKey
    },
    {
      id: 2,
      icon: IconCalendarEvent,
      title: "۷ روز پیوسته",
      earned: true,
      desc: "حضور ۷ روز پشت سر هم",
      progress: 100,
      color: "purple" as ColorKey
    },
    {
      id: 3,
      icon: IconAward,
      title: "۵۰ فلش‌کارت",
      earned: false,
      desc: "پاسخ صحیح به ۵۰ فلش‌کارت",
      progress: 65,
      color: "pink" as ColorKey
    },
    {
      id: 4,
      icon: IconSparkles,
      title: "اولین خلاصه",
      earned: true,
      desc: "ساخت اولین خلاصه با AI",
      progress: 100,
      color: "emerald" as ColorKey
    }
  ]

  // داده‌های نمونه آمار
  const learningStats = { testsCompleted: 123, streakDays: 7, accuracy: 85 }

  return (
    <div
      className="bg-background text-foreground relative min-h-screen w-full transition-colors duration-500"
      dir="rtl"
    >
      {/* --- پس‌زمینه هوشمند --- */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -left-[10%] -top-[10%] size-[600px] animate-pulse rounded-full bg-blue-400/10 blur-[130px] dark:bg-blue-600/5" />
        <div className="absolute -bottom-[10%] right-[10%] size-[500px] rounded-full bg-purple-400/10 blur-[100px] dark:bg-purple-900/5" />
        <div className="bg-grid-black/[0.02] dark:bg-grid-white/[0.02] absolute inset-0" />
      </div>

      <main className="container mx-auto max-w-7xl px-4 py-6 md:py-12">
        {/* --- هدر دسکتاپ --- */}
        <div className="mb-8 hidden md:block">
          <h1 className="flex items-center gap-3 text-3xl font-black text-slate-900 md:text-4xl dark:text-white">
            <IconUsers className="text-blue-600 dark:text-blue-400" size={40} />
            پنل کاربری
          </h1>
          <p className="mt-2 text-lg text-slate-600 dark:text-slate-400">
            مدیریت حساب کاربری و مشاهده دستاوردها
          </p>
        </div>

        {/* --- سیستم گرید (Grid) برای چیدمان --- */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          {/* ستون راست (سایدبار) - 4 قسمت */}
          <aside className="space-y-6 lg:sticky lg:top-24 lg:col-span-4 lg:h-fit">
            {/* کارت پروفایل */}
            <MaterialCard
              className="relative flex flex-col items-center p-6 pt-10"
              elevation={2}
            >
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

              {/* وضعیت اشتراک */}
              <div className="mt-8 w-full">
                {isSubscribed ? (
                  <div className="flex w-full items-center justify-center gap-2 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300">
                    <IconCalendarStats size={20} />
                    <span className="text-sm font-bold">
                      {remainingDays} روز اعتبار باقیست
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
                      <span>ارتقا به نسخه حرفه‌ای</span>
                    </div>
                  </RippleButton>
                )}
              </div>
            </MaterialCard>

            {/* تم سوییچر (فقط دسکتاپ) */}
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

          {/* ستون چپ (محتوای اصلی) - 8 قسمت */}
          <section className="space-y-8 pb-24 lg:col-span-8">
            {/* بخش آمار */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <h3 className="mb-4 flex items-center gap-2 text-xl font-bold text-slate-800 dark:text-white">
                <span className="h-6 w-1.5 rounded-full bg-blue-500" />
                آمار فعالیت‌ها
              </h3>
              <div className="grid grid-cols-3 gap-3 md:gap-5">
                <StatCard
                  icon={IconBook}
                  value={learningStats.testsCompleted.toString()}
                  label="تست زده"
                  color="blue"
                />
                <StatCard
                  icon={IconFlame}
                  value={learningStats.streakDays.toString()}
                  label="روز پیوسته"
                  color="orange"
                />
                <StatCard
                  icon={IconTrophy}
                  value={`٪${learningStats.accuracy}`}
                  label="دقت پاسخ"
                  color="emerald"
                />
              </div>
            </motion.div>

            {/* بخش مدال‌ها */}
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
                            className={`flex min-w-[100px] cursor-pointer flex-col items-center gap-3 rounded-xl p-3 transition-all hover:bg-slate-50 dark:hover:bg-slate-800/50 ${medal.earned ? "opacity-100" : "opacity-50 grayscale"}`}
                          >
                            <IconWrapper
                              icon={medal.icon}
                              color={medal.color}
                            />
                            <span className="w-full truncate text-center text-xs font-bold text-slate-700 dark:text-slate-300">
                              {medal.title}
                            </span>
                            {/* نوار پیشرفت کوچک */}
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

            {/* بخش کیف پول */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div className="mb-4 flex items-center justify-between">
                <h3 className="flex items-center gap-2 text-xl font-bold text-slate-800 dark:text-white">
                  <span className="h-6 w-1.5 rounded-full bg-emerald-500" />
                  کیف پول
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
                {/* پس‌زمینه تزئینی */}
                <div className="pointer-events-none absolute right-0 top-0 -mr-10 -mt-10 size-40 rounded-full bg-emerald-500/10 blur-3xl" />
                <div className="pointer-events-none absolute bottom-0 left-0 -mb-10 -ml-10 size-40 rounded-full bg-blue-500/10 blur-3xl" />

                <div className="relative z-10 flex flex-col items-center justify-between gap-6 md:flex-row">
                  <div className="text-center md:text-right">
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                      موجودی قابل برداشت
                    </p>
                    <p className="mt-2 text-4xl font-black text-emerald-600 dark:text-emerald-400">
                      ۱۲,۵۰۰{" "}
                      <span className="text-lg font-bold text-emerald-600/70 dark:text-emerald-400/70">
                        تومان
                      </span>
                    </p>
                  </div>

                  <div className="flex w-full gap-3 md:w-auto">
                    <RippleButton className="flex-1 bg-emerald-600 text-white shadow-lg shadow-emerald-500/20 hover:bg-emerald-700 md:flex-none">
                      <span className="flex items-center gap-2 px-2">
                        <IconWallet size={18} />
                        برداشت وجه
                      </span>
                    </RippleButton>
                    <Button
                      variant="outline"
                      className="flex-1 border-slate-200 text-slate-700 hover:bg-slate-100 md:flex-none dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                    >
                      <IconGift size={18} className="ml-2" />
                      دعوت دوستان
                    </Button>
                  </div>
                </div>
              </MaterialCard>
            </motion.div>

            {/* تنظیمات موبایل (در دسکتاپ مخفی) */}
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
        </div>
      </main>

      {/* مودال ویرایش پروفایل */}
      <EditProfileModal
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
      />
    </div>
  )
}

// ##################################################################
// 3. کامپوننت‌های کمکی
// ##################################################################

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
      "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400"
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

// ##################################################################
// 4. مودال ویرایش پروفایل (Edit Modal)
// ##################################################################
interface EditProfileModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

function EditProfileModal({ open, onOpenChange }: EditProfileModalProps) {
  const { profile, setProfile } = useContext(ChatbotUIContext)
  const buttonRef = useRef<HTMLButtonElement>(null)

  const [displayName, setDisplayName] = useState(profile?.display_name || "")
  const [username, setUsername] = useState(profile?.username || "")
  const [usernameAvailable, setUsernameAvailable] = useState(true)
  const [loadingUsername, setLoadingUsername] = useState(false)
  const [profileImageSrc, setProfileImageSrc] = useState(
    profile?.image_url || ""
  )
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null)

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name || "")
      setUsername(profile.username || "")
      setProfileImageSrc(profile.image_url || "")
    }
  }, [profile, open])

  const handleSave = async () => {
    if (!profile) return
    try {
      let profileImageUrl = profile.image_url
      let profileImagePath = profile.image_path || ""

      if (profileImageFile) {
        const { path, url } = await uploadProfileImage(
          profile,
          profileImageFile
        )
        if (url) profileImageUrl = url
        profileImagePath = path
      }

      const updatedProfile = await updateProfile(profile.id, {
        display_name: displayName,
        username,
        image_url: profileImageUrl,
        image_path: profileImagePath
      })

      setProfile(updatedProfile)
      setProfileImageFile(null)
      toast.success("پروفایل با موفقیت آپدیت شد!")
      onOpenChange(false)
    } catch (error) {
      toast.error("خطا در به‌روزرسانی پروفایل")
      console.error(error)
    }
  }

  const checkUsernameAvailability = useCallback(async (username: string) => {
    if (!username) return
    if (
      username.length < PROFILE_USERNAME_MIN ||
      username.length > PROFILE_USERNAME_MAX
    ) {
      setUsernameAvailable(false)
      return
    }
    const usernameRegex = /^[a-zA-Z0-9_]+$/
    if (!usernameRegex.test(username)) {
      setUsernameAvailable(false)
      toast.error("نام کاربری نامعتبر است")
      return
    }
    // شبیه‌سازی بررسی نام کاربری (یا اتصال به API واقعی)
    setLoadingUsername(true)
    setTimeout(() => {
      setUsernameAvailable(true)
      setLoadingUsername(false)
    }, 500)
  }, [])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        dir="rtl"
        className="max-w-md border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
      >
        <DialogHeader>
          <DialogTitle className="text-slate-900 dark:text-white">
            ویرایش مشخصات
          </DialogTitle>
          <DialogDescription className="text-slate-500 dark:text-slate-400">
            تغییرات خود را اینجا وارد کرده و ذخیره کنید.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-4">
          {/* عکس پروفایل */}
          <div className="flex flex-col items-center gap-3">
            <ImagePicker
              src={profileImageSrc}
              image={profileImageFile}
              height={80}
              width={80}
              onSrcChange={setProfileImageSrc}
              onImageChange={setProfileImageFile}
            />
            <span className="text-xs text-slate-400">
              برای تغییر عکس کلیک کنید
            </span>
          </div>

          <div className="space-y-2">
            <Label className="text-slate-700 dark:text-slate-300">
              نام نمایشی
            </Label>
            <Input
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              className="border-slate-200 bg-slate-50 text-slate-900 focus-visible:ring-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-slate-700 dark:text-slate-300">
              نام کاربری
            </Label>
            <div className="relative">
              <Input
                value={username}
                onChange={e => {
                  setUsername(e.target.value)
                  checkUsernameAvailability(e.target.value)
                }}
                className="border-slate-200 bg-slate-50 pl-10 text-left text-slate-900 focus-visible:ring-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
              <div className="absolute inset-y-0 left-0 flex items-center pl-3">
                {loadingUsername ? (
                  <IconLoader2
                    className="animate-spin text-slate-400"
                    size={18}
                  />
                ) : usernameAvailable ? (
                  <IconCircleCheckFilled
                    className="text-emerald-500"
                    size={18}
                  />
                ) : (
                  <IconCircleXFilled className="text-red-500" size={18} />
                )}
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
          >
            انصراف
          </Button>
          <Button
            ref={buttonRef}
            onClick={handleSave}
            disabled={!usernameAvailable || loadingUsername}
            className="bg-blue-600 text-white hover:bg-blue-700"
          >
            ذخیره تغییرات
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ##################################################################
// 5. اکسپورت نهایی
// ##################################################################
export default function ProfilePage() {
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <ProfilePageContent />
    </ErrorBoundary>
  )
}
