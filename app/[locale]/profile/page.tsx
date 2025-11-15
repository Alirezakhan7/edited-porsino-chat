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
      progress: 100
    },
    {
      id: 2,
      icon: IconCalendarEvent,
      title: "۷ روز پیوسته",
      earned: true,
      desc: "حضور ۷ روز پشت سر هم",
      progress: 100
    },
    {
      id: 3,
      icon: IconAward,
      title: "۵۰ فلش‌کارت",
      earned: false,
      desc: "پاسخ صحیح به ۵۰ فلش‌کارت",
      progress: 65
    },
    {
      id: 4,
      icon: IconSparkles,
      title: "اولین خلاصه",
      earned: true,
      desc: "ساخت اولین خلاصه با AI",
      progress: 100
    },
    {
      id: 5,
      icon: IconUsers,
      title: "اولین دعوت",
      earned: false,
      desc: "معرفی ۱ کاربر جدید",
      progress: 0
    }
  ]

  // --- داده‌های موقت برای آمار ---
  const learningStats = {
    testsCompleted: 123,
    streakDays: 7,
    accuracy: 85
  }

  // عکس پیش‌فرض - می‌توانید URL زیر را با مسیر فایل محلی جایگزین کنید
  const DEFAULT_AVATAR = "/images/default-avatar.png"

  return (
    <div
      dir="rtl"
      className="animate-fade-down size-full overflow-y-auto px-4 pb-8 pt-6 md:px-8"
    >
      {/* ----- بخش هدر پروفایل ----- */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="relative mb-6 flex flex-col items-center"
      >
        <Button
          variant="ghost"
          size="icon"
          className="text-muted-foreground absolute left-0 top-0"
          onClick={handleSignOut}
          aria-label="خروج از حساب کاربری"
        >
          <IconLogout size={20} />
        </Button>

        <div className="relative">
          <Image
            src={profile.image_url || DEFAULT_AVATAR}
            alt="Profile Image"
            width={96}
            height={96}
            className="size-24 rounded-full  object-cover shadow-lg"
          />
          <Button
            variant="default"
            size="icon"
            className="absolute -bottom-2 -right-2 size-8 rounded-full shadow-md"
            onClick={() => setIsEditModalOpen(true)}
            aria-label="ویرایش پروفایل"
          >
            <IconEdit size={16} />
          </Button>
        </div>
        <h1 className="mt-4 text-2xl font-bold">
          {profile.display_name || "کاربر پرسینو"}
        </h1>
        <p className="text-md text-muted-foreground">@{profile.username}</p>
      </motion.section>

      {/* ----- بخش اشتراک ----- */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="mb-6"
      >
        {isSubscribed ? (
          <div className="flex w-full cursor-default flex-row-reverse items-center justify-center space-x-2 space-x-reverse rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 px-4 py-3.5 text-sm font-bold text-white shadow-lg">
            <IconCalendarStats size={20} />
            {remainingDays > 0 ? (
              <>
                <span className="ml-1">{remainingDays}</span>
                <span>روز از اشتراک شما باقی مانده</span>
              </>
            ) : (
              <span>اشتراک شما امروز به پایان می‌رسد</span>
            )}
          </div>
        ) : (
          <a
            href="https://chat.porsino.org/payment"
            target="_blank"
            rel="noopener noreferrer"
            className="items-right flex w-full justify-center space-x-2 space-x-reverse rounded-xl bg-gradient-to-r from-yellow-400 to-orange-500 px-4 py-3.5 text-sm font-bold text-white shadow-lg transition-all hover:from-yellow-500 hover:to-orange-600 hover:shadow-xl"
          >
            <IconCrown size={20} className="text-white" />
            <span>ارتقا به Porsino Pro</span>
          </a>
        )}
      </motion.section>

      {/* ----- بخش آمار یادگیری ----- */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
        className="mb-6"
      >
        <h2 className="mb-3 text-xl font-semibold">آمار یادگیری</h2>
        <div className="grid grid-cols-3 gap-3">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="bg-muted/50 hover:bg-muted cursor-pointer rounded-lg p-4 text-center transition-all">
                  <IconBook size={24} className="mx-auto mb-2 text-blue-500" />
                  <p className="text-2xl font-bold">
                    {learningStats.testsCompleted}
                  </p>
                  <p className="text-muted-foreground text-xs">تست زده</p>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>تعداد کل تست‌های حل شده</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="bg-muted/50 hover:bg-muted cursor-pointer rounded-lg p-4 text-center transition-all">
                  <IconFlame
                    size={24}
                    className="mx-auto mb-2 text-orange-500"
                  />
                  <p className="text-2xl font-bold">
                    {learningStats.streakDays}
                  </p>
                  <p className="text-muted-foreground text-xs">روز پیوسته</p>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>تعداد روزهای متوالی حضور در پلتفرم</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="bg-muted/50 hover:bg-muted cursor-pointer rounded-lg p-4 text-center transition-all">
                  <IconTrophy
                    size={24}
                    className="mx-auto mb-2 text-yellow-500"
                  />
                  <p className="text-2xl font-bold">
                    {learningStats.accuracy}٪
                  </p>
                  <p className="text-muted-foreground text-xs">دقت</p>
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
        className="mb-6"
      >
        <h2 className="mb-3 text-xl font-semibold">مدال‌ها و دستاوردها</h2>
        <div className="bg-muted/50 flex space-x-4 space-x-reverse overflow-x-auto rounded-xl p-4 pb-5">
          <TooltipProvider>
            {placeholderMedals.map((medal, index) => (
              <Tooltip key={medal.id}>
                <TooltipTrigger asChild>
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, delay: 0.1 * index }}
                    className={`hover:bg-muted/50 flex shrink-0 cursor-pointer flex-col items-center space-y-2 rounded-lg p-3 transition-all ${
                      medal.earned ? "opacity-100" : "opacity-40 grayscale"
                    }`}
                    role="button"
                    tabIndex={0}
                    aria-label={`مدال ${medal.title}: ${medal.desc}`}
                  >
                    <div
                      className={`flex size-14 items-center justify-center rounded-full ${
                        medal.earned
                          ? "bg-primary/10 text-primary"
                          : "bg-muted-foreground/10"
                      }`}
                    >
                      <medal.icon size={28} />
                    </div>
                    <span className="w-16 truncate text-center text-xs font-medium">
                      {medal.title}
                    </span>
                    <div className="bg-muted h-1 w-full rounded-full">
                      <div
                        className="bg-primary h-full rounded-full transition-all"
                        style={{ width: `${medal.progress}%` }}
                      />
                    </div>
                  </motion.div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{medal.desc}</p>
                  <p className="text-muted-foreground text-xs">
                    پیشرفت: {medal.progress}%
                  </p>
                </TooltipContent>
              </Tooltip>
            ))}
          </TooltipProvider>
        </div>
      </motion.section>

      {/* ----- بخش کسب درآمد ----- */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.4 }}
        className="mb-6"
      >
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-xl font-semibold">کیف پول شما</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/transactions")}
            aria-label="مشاهده تاریخچه تراکنش‌ها"
          >
            <IconHistory size={16} className="ml-1" />
            تاریخچه
          </Button>
        </div>
        <div className="bg-muted/50 rounded-xl p-4">
          <div className="mb-4 text-center">
            <p className="text-muted-foreground text-sm">موجودی قابل استفاده</p>
            <p className="text-4xl font-bold">
              ۱۲,۵۰۰ <span className="text-lg">تومان</span>
            </p>
          </div>
          <div className="mb-4 grid grid-cols-2 gap-3 text-center">
            <div className="bg-background rounded-lg p-3">
              <p className="text-muted-foreground text-sm">از مدال‌ها</p>
              <p className="text-lg font-semibold">۵,۰۰۰ ت</p>
            </div>
            <div className="bg-background rounded-lg p-3">
              <p className="text-muted-foreground text-sm">از معرفی</p>
              <p className="text-lg font-semibold">۷,۵۰۰ ت</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline" className="w-full">
              <IconWallet size={16} className="ml-2" />
              برداشت وجه
            </Button>
            <Button variant="default" className="w-full">
              <IconGift size={16} className="ml-2" />
              دعوت دوستان
            </Button>
          </div>
        </div>
      </motion.section>

      {/* ----- بخش تنظیمات ----- */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.5 }}
      >
        <h2 className="mb-3 text-xl font-semibold">تنظیمات</h2>
        <div className="bg-muted/50 flex items-center justify-between rounded-xl p-4">
          <p className="font-medium">پوسته برنامه</p>
          <ThemeSwitcher />
        </div>
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
                className="pl-10"
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
          >
            ذخیره
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
