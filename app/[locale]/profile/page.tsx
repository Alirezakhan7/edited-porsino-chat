"use client"

// ایمپورت‌های اصلی برای داشبورد
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
  IconLoader2,
  IconLogout,
  IconSparkles,
  IconTrophy,
  IconUsers,
  IconWallet,
  IconAlertCircle
} from "@tabler/icons-react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { useCallback, useContext, useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { ThemeSwitcher } from "@/components/utility/theme-switcher"
import { motion } from "framer-motion"

// ایمپورت کامپوننت‌های متریال دیزاین (مسیر فایل را در صورت نیاز اصلاح کنید)
import {
  MaterialCard,
  IconWrapper,
  RippleButton,
  colorThemes,
  ColorKey
} from "@/components/material/MaterialUI"

// ایمپورت‌های مورد نیاز برای پاپ‌آپ ویرایش
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
import {
  PROFILE_DISPLAY_NAME_MAX,
  PROFILE_USERNAME_MAX,
  PROFILE_USERNAME_MIN
} from "@/db/limits"
import { updateProfile } from "@/db/profile"
import { uploadProfileImage } from "@/db/storage/profile-images"
import { IconCircleCheckFilled, IconCircleXFilled } from "@tabler/icons-react"
import ImagePicker from "@/components/ui/image-picker"
import { toast } from "sonner"
import { ErrorBoundary } from "react-error-boundary"

// ##################################################################
// Error Fallback Component
// ##################################################################
function ErrorFallback({ error }: { error: Error }) {
  return (
    <div className="flex size-full flex-col items-center justify-center p-8">
      <IconAlertCircle size={48} className="mb-4 text-red-500" />
      <h2 className="mb-2 text-xl font-bold">مشکلی پیش آمد!</h2>
      <p className="text-muted-foreground">{error.message}</p>
      <Button
        className="mt-4"
        onClick={() => window.location.reload()}
        variant="outline"
      >
        تلاش مجدد
      </Button>
    </div>
  )
}

// ##################################################################
// Skeleton Loading Component
// ##################################################################
function ProfileSkeleton() {
  return (
    <div className="size-full px-4 pb-8 pt-6 md:px-8" dir="rtl">
      <div className="mb-6 flex flex-col items-center">
        <div className="bg-muted size-24 animate-pulse rounded-full" />
        <div className="bg-muted mt-4 h-6 w-32 animate-pulse rounded" />
        <div className="bg-muted mt-2 h-4 w-24 animate-pulse rounded" />
      </div>
      <div className="bg-muted mb-6 h-12 w-full animate-pulse rounded-xl" />
      <div className="bg-muted mb-6 h-32 w-full animate-pulse rounded-xl" />
      <div className="bg-muted mb-6 h-48 w-full animate-pulse rounded-xl" />
    </div>
  )
}

// ##################################################################
// کامپوننت ۱: صفحه اصلی داشبورد پروفایل
// ##################################################################
function ProfilePageContent() {
  const { profile } = useContext(ChatbotUIContext)
  const router = useRouter()
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)

  const handleSignOut = async () => {
    const confirmed = window.confirm("آیا مطمئن هستید که می‌خواهید خارج شوید؟")
    if (!confirmed) return

    await supabase.auth.signOut()
    router.push("/login")
    router.refresh()
  }

  // تا زمانی که پروفایل لود نشده، لودینگ نشون می‌دیم
  if (!profile) {
    return <ProfileSkeleton />
  }

  // --- منطق اشتراک ---
  const expiresAt = profile.subscription_expires_at
    ? new Date(profile.subscription_expires_at)
    : null
  const isSubscribed =
    profile.subscription_status === "active" &&
    expiresAt &&
    expiresAt > new Date()
  let remainingDays = 0
  if (isSubscribed && expiresAt) {
    const today = new Date()
    const timeDiff = expiresAt.getTime() - today.getTime()
    remainingDays = Math.ceil(timeDiff / (1000 * 60 * 60 * 24))
  }

  // --- داده‌های موقت برای مدال‌ها ---
  const placeholderMedals = [
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
    },
    {
      id: 5,
      icon: IconUsers,
      title: "اولین دعوت",
      earned: false,
      desc: "معرفی ۱ کاربر جدید",
      progress: 0,
      color: "blue" as ColorKey
    }
  ]

  // --- داده‌های موقت برای آمار ---
  const learningStats = {
    testsCompleted: 123,
    streakDays: 7,
    accuracy: 85
  }

  // عکس پیش‌فرض
  const DEFAULT_AVATAR = "/images/default-avatar.png"

  return (
    <div
      dir="rtl"
      className="animate-fade-down size-full overflow-y-auto px-4 pb-8 pt-6 md:px-8"
    >
      {/* ----- بخش هدر پروفایل ----- */}
      <MaterialCard
        className="relative mb-6 flex flex-col items-center p-6 pt-8"
        elevation={2}
      >
        <Button
          variant="ghost"
          size="icon"
          className="text-muted-foreground absolute left-4 top-4 transition-colors hover:text-red-500"
          onClick={handleSignOut}
          aria-label="خروج از حساب کاربری"
        >
          <IconLogout size={20} />
        </Button>

        <div className="group relative">
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 opacity-10 blur-sm transition-opacity group-hover:opacity-30"></div>
          <Image
            src={profile.image_url || DEFAULT_AVATAR}
            alt="Profile Image"
            width={112}
            height={112}
            className="relative z-10 size-28 rounded-full border-4 border-white object-cover shadow-xl"
          />
          <RippleButton
            onClick={() => setIsEditModalOpen(true)}
            className="absolute -bottom-1 -right-1 z-20 flex size-9 items-center justify-center rounded-full border border-blue-100 bg-white text-blue-600 shadow-lg hover:bg-blue-50"
          >
            <IconEdit size={16} />
          </RippleButton>
        </div>

        <h1 className="mt-5 bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-2xl font-bold text-transparent">
          {profile.display_name || "کاربر پرسینو"}
        </h1>
        <p className="text-md font-medium text-slate-500">
          @{profile.username}
        </p>
      </MaterialCard>

      {/* ----- بخش اشتراک ----- */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="mb-6"
      >
        {isSubscribed ? (
          <MaterialCard className="overflow-hidden border-none" elevation={4}>
            <div className="flex w-full cursor-default flex-row-reverse items-center justify-center space-x-2 space-x-reverse bg-gradient-to-r from-emerald-500 to-teal-600 p-4 text-sm font-bold text-white shadow-inner">
              <IconCalendarStats size={22} />
              {remainingDays > 0 ? (
                <>
                  <span className="ml-1 text-lg">{remainingDays}</span>
                  <span>روز از اشتراک شما باقی مانده</span>
                </>
              ) : (
                <span>اشتراک شما امروز به پایان می‌رسد</span>
              )}
            </div>
          </MaterialCard>
        ) : (
          <MaterialCard
            className="group overflow-hidden border-none"
            elevation={4}
            onClick={() =>
              window.open("https://chat.porsino.org/payment", "_blank")
            }
          >
            <div className="flex w-full cursor-pointer items-center justify-center space-x-2 space-x-reverse bg-gradient-to-r from-amber-400 to-orange-500 p-4 text-sm font-bold text-white transition-all group-hover:brightness-110">
              <IconCrown size={22} className="animate-pulse text-white" />
              <span className="text-base">ارتقا به Porsino Pro</span>
            </div>
          </MaterialCard>
        )}
      </motion.section>

      {/* ----- بخش آمار یادگیری ----- */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
        className="mb-8"
      >
        <h2 className="mb-4 flex items-center gap-2 text-xl font-bold text-slate-800">
          <span className="h-6 w-1 rounded-full bg-blue-600"></span>
          آمار یادگیری
        </h2>
        <div className="grid grid-cols-3 gap-4">
          <TooltipProvider>
            {/* کارت ۱ */}
            <Tooltip>
              <TooltipTrigger asChild>
                <div>
                  <MaterialCard
                    className="flex h-full flex-col items-center justify-center p-4 text-center hover:bg-blue-50/50"
                    elevation={1}
                  >
                    <div className="mb-2 rounded-full bg-blue-100 p-2 text-blue-600">
                      <IconBook size={24} />
                    </div>
                    <p className="text-2xl font-extrabold text-slate-800">
                      {learningStats.testsCompleted}
                    </p>
                    <p className="mt-1 text-xs font-medium text-slate-500">
                      تست زده
                    </p>
                  </MaterialCard>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>تعداد کل تست‌های حل شده</p>
              </TooltipContent>
            </Tooltip>

            {/* کارت ۲ */}
            <Tooltip>
              <TooltipTrigger asChild>
                <div>
                  <MaterialCard
                    className="flex h-full flex-col items-center justify-center p-4 text-center hover:bg-orange-50/50"
                    elevation={1}
                  >
                    <div className="mb-2 rounded-full bg-orange-100 p-2 text-orange-600">
                      <IconFlame size={24} />
                    </div>
                    <p className="text-2xl font-extrabold text-slate-800">
                      {learningStats.streakDays}
                    </p>
                    <p className="mt-1 text-xs font-medium text-slate-500">
                      روز پیوسته
                    </p>
                  </MaterialCard>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>تعداد روزهای متوالی حضور در پلتفرم</p>
              </TooltipContent>
            </Tooltip>

            {/* کارت ۳ */}
            <Tooltip>
              <TooltipTrigger asChild>
                <div>
                  <MaterialCard
                    className="flex h-full flex-col items-center justify-center p-4 text-center hover:bg-yellow-50/50"
                    elevation={1}
                  >
                    <div className="mb-2 rounded-full bg-yellow-100 p-2 text-yellow-600">
                      <IconTrophy size={24} />
                    </div>
                    <p className="text-2xl font-extrabold text-slate-800">
                      {learningStats.accuracy}٪
                    </p>
                    <p className="mt-1 text-xs font-medium text-slate-500">
                      دقت کل
                    </p>
                  </MaterialCard>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>درصد پاسخ‌های صحیح</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </motion.section>

      {/* ----- بخش مدال‌ها ----- */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.3 }}
        className="mb-8"
      >
        <h2 className="mb-4 flex items-center gap-2 text-xl font-bold text-slate-800">
          <span className="h-6 w-1 rounded-full bg-purple-600"></span>
          مدال‌ها و دستاوردها
        </h2>

        <MaterialCard className="p-2" elevation={2}>
          <div className="scrollbar-hide flex space-x-4 space-x-reverse overflow-x-auto p-2 pb-4">
            <TooltipProvider>
              {placeholderMedals.map((medal, index) => (
                <Tooltip key={medal.id}>
                  <TooltipTrigger asChild>
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      className={`flex w-28 shrink-0 cursor-pointer flex-col items-center space-y-3 rounded-xl p-4 transition-all ${
                        medal.earned ? "opacity-100" : "opacity-50 grayscale"
                      }`}
                    >
                      {/* استفاده از IconWrapper جدید */}
                      <div className="origin-center scale-75">
                        <IconWrapper icon={medal.icon} color={medal.color} />
                      </div>

                      <div className="text-center">
                        <span className="mb-2 block w-full truncate text-xs font-bold text-slate-700">
                          {medal.title}
                        </span>
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-200">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${colorThemes[medal.color].bg}`}
                            style={{ width: `${medal.progress}%` }}
                          />
                        </div>
                      </div>
                    </motion.div>
                  </TooltipTrigger>
                  <TooltipContent className="border-none bg-slate-800 text-white">
                    <p className="mb-1 font-bold">{medal.desc}</p>
                    <p className="text-xs text-slate-300">
                      پیشرفت: {medal.progress}%
                    </p>
                  </TooltipContent>
                </Tooltip>
              ))}
            </TooltipProvider>
          </div>
        </MaterialCard>
      </motion.section>

      {/* ----- بخش کیف پول ----- */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.4 }}
        className="mb-8"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-xl font-bold text-slate-800">
            <span className="h-6 w-1 rounded-full bg-emerald-600"></span>
            کیف پول
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/transactions")}
            className="text-slate-500 hover:bg-emerald-50 hover:text-emerald-600"
          >
            <IconHistory size={16} className="ml-1" />
            تاریخچه
          </Button>
        </div>

        <MaterialCard className="relative overflow-hidden p-6" elevation={2}>
          {/* پس زمینه تزئینی */}
          <div className="absolute right-0 top-0 -mr-10 -mt-10 size-32 rounded-full bg-emerald-100 opacity-50 blur-2xl"></div>
          <div className="absolute bottom-0 left-0 -mb-8 -ml-8 size-24 rounded-full bg-blue-100 opacity-50 blur-xl"></div>

          <div className="relative z-10 mb-6 text-center">
            <p className="mb-1 text-sm font-medium text-slate-500">
              موجودی قابل استفاده
            </p>
            <p className="text-4xl font-black tracking-tight text-emerald-600">
              ۱۲,۵۰۰{" "}
              <span className="text-lg font-bold text-emerald-500">تومان</span>
            </p>
          </div>

          <div className="relative z-10 mb-6 grid grid-cols-2 gap-4 text-center">
            <div className="rounded-xl border border-white/50 bg-white/60 p-3 shadow-sm backdrop-blur">
              <p className="mb-1 text-xs text-slate-400">از مدال‌ها</p>
              <p className="text-lg font-bold text-slate-700">۵,۰۰۰ ت</p>
            </div>
            <div className="rounded-xl border border-white/50 bg-white/60 p-3 shadow-sm backdrop-blur">
              <p className="mb-1 text-xs text-slate-400">از معرفی</p>
              <p className="text-lg font-bold text-slate-700">۷,۵۰۰ ت</p>
            </div>
          </div>

          <div className="relative z-10 grid grid-cols-2 gap-4">
            <RippleButton className="w-full rounded-xl border border-slate-200 bg-white py-2.5 text-sm font-bold text-slate-700 shadow-sm transition-colors hover:bg-slate-50">
              <span className="flex items-center justify-center gap-2">
                <IconWallet size={18} />
                برداشت
              </span>
            </RippleButton>
            <RippleButton className="w-full rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 py-2.5 text-sm font-bold text-white shadow-lg shadow-emerald-200">
              <span className="flex items-center justify-center gap-2">
                <IconGift size={18} />
                دعوت دوستان
              </span>
            </RippleButton>
          </div>
        </MaterialCard>
      </motion.section>

      {/* ----- بخش تنظیمات ----- */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.5 }}
        className="mb-6"
      >
        <h2 className="mb-4 flex items-center gap-2 text-xl font-bold text-slate-800">
          <span className="h-6 w-1 rounded-full bg-slate-400"></span>
          تنظیمات
        </h2>
        <MaterialCard
          className="flex items-center justify-between p-5"
          elevation={1}
        >
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-slate-100 p-2 text-slate-600">
              <IconSparkles size={20} />
            </div>
            <p className="font-bold text-slate-700">پوسته برنامه</p>
          </div>
          <ThemeSwitcher />
        </MaterialCard>
      </motion.section>

      {/* این کامپوننت پاپ‌آپ ویرایش است */}
      <EditProfileModal
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
      />
    </div>
  )
}

// ##################################################################
// Main Export with Error Boundary
// ##################################################################
export default function ProfilePage() {
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <ProfilePageContent />
    </ErrorBoundary>
  )
}

// ##################################################################
// کامپوننت ۲: پاپ‌آپ (Modal) ویرایش پروفایل
// ##################################################################
interface EditProfileModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

function EditProfileModal({ open, onOpenChange }: EditProfileModalProps) {
  const { profile, setProfile } = useContext(ChatbotUIContext)
  const buttonRef = useRef<HTMLButtonElement>(null)

  // عکس پیش‌فرض
  const DEFAULT_AVATAR =
    "https://ui-avatars.com/api/?name=User&background=6366f1&color=fff&size=96"

  // تمام state های فرم را اینجا نگه می‌داریم
  const [displayName, setDisplayName] = useState(profile?.display_name || "")
  const [username, setUsername] = useState(profile?.username || "")
  const [usernameAvailable, setUsernameAvailable] = useState(true)
  const [loadingUsername, setLoadingUsername] = useState(false)
  const [profileImageSrc, setProfileImageSrc] = useState(
    profile?.image_url || DEFAULT_AVATAR
  )
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null)

  // وقتی پاپ‌آپ باز یا پروفایل عوض می‌شود، state ها را آپدیت می‌کنیم
  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name || "")
      setUsername(profile.username || "")
      setProfileImageSrc(profile.image_url || DEFAULT_AVATAR)
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
        if (url) {
          profileImageUrl = url
        }
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

  // --- توابع کمکی ---
  const debounce = (func: (...args: any[]) => void, wait: number) => {
    let timeout: NodeJS.Timeout | null
    return (...args: any[]) => {
      const later = () => {
        if (timeout) clearTimeout(timeout)
        func(...args)
      }
      if (timeout) clearTimeout(timeout)
      timeout = setTimeout(later, wait)
    }
  }

  const checkUsernameAvailability = useCallback(
    debounce(async (username: string) => {
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
        toast.error("نام کاربری فقط شامل حروف، اعداد یا آندرلاین است.")
        return
      }

      // بررسی cache
      const cacheKey = `username_check_${username}`
      const cached = sessionStorage.getItem(cacheKey)
      if (cached) {
        setUsernameAvailable(JSON.parse(cached))
        return
      }

      setLoadingUsername(true)
      try {
        const response = await fetch(`/api/username/available`, {
          method: "POST",
          body: JSON.stringify({ username })
        })
        const data = await response.json()
        const isAvailable = username === profile?.username || data.isAvailable
        setUsernameAvailable(isAvailable)
        sessionStorage.setItem(cacheKey, JSON.stringify(isAvailable))
      } catch (error) {
        toast.error("خطا در بررسی نام کاربری")
        setUsernameAvailable(false)
      } finally {
        setLoadingUsername(false)
      }
    }, 500),
    [profile?.username]
  )

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      buttonRef.current?.click()
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent dir="rtl" className="max-w-md" onKeyDown={handleKeyDown}>
        <DialogHeader>
          <DialogTitle>ویرایش مشخصات</DialogTitle>
          <DialogDescription>
            تغییرات خود را اینجا وارد کرده و ذخیره کنید.
          </DialogDescription>
        </DialogHeader>

        {/* فرم ویرایش */}
        <div className="space-y-4 py-2">
          <div className="space-y-1">
            <Label>نام کاربری</Label>
            <div className="relative">
              <Input
                className="pl-10 text-left"
                placeholder="Username..."
                value={username}
                onChange={e => {
                  setUsername(e.target.value)
                  checkUsernameAvailability(e.target.value)
                }}
                minLength={PROFILE_USERNAME_MIN}
                maxLength={PROFILE_USERNAME_MAX}
              />
              {username !== profile?.username && (
                <div className="absolute inset-y-0 left-0 flex items-center pl-3">
                  {loadingUsername ? (
                    <IconLoader2 className="animate-spin text-gray-400" />
                  ) : usernameAvailable ? (
                    <IconCircleCheckFilled className="text-green-500" />
                  ) : (
                    <IconCircleXFilled className="text-red-500" />
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-1">
            <Label>عکس پروفایل</Label>
            <ImagePicker
              src={profileImageSrc}
              image={profileImageFile}
              height={50}
              width={50}
              onSrcChange={setProfileImageSrc}
              onImageChange={setProfileImageFile}
            />
          </div>

          <div className="space-y-1">
            <Label>نام نمایشی در چت</Label>
            <Input
              placeholder="مثلاً علی..."
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              maxLength={PROFILE_DISPLAY_NAME_MAX}
            />
          </div>
        </div>
        {/* پایان فرم */}

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            انصراف
          </Button>
          <Button
            ref={buttonRef}
            onClick={handleSave}
            disabled={!usernameAvailable || loadingUsername}
            className="bg-blue-600 hover:bg-blue-700"
          >
            ذخیره
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
