// Below is the updated code for `profile-settings.tsx` with the following changes:
// 1) The 'API Keys' tab is completely removed.
// 2) The 'Profile' tab is renamed to 'مشخصات کاربر'.
// 3) The appearance is updated to a more modern style.
//    - Smoother background, minor hover effects, etc.
// 4) The "Profile Instructions" (توضیحات برای هوش مصنوعی) section is removed.
// 5) The sheet animation is made faster to open instantly.

"use client"

import { ChatbotUIContext } from "@/context/context"
import {
  PROFILE_DISPLAY_NAME_MAX,
  PROFILE_USERNAME_MAX,
  PROFILE_USERNAME_MIN
} from "@/db/limits"
import { updateProfile } from "@/db/profile"
import { uploadProfileImage } from "@/db/storage/profile-images"
import { supabase } from "@/lib/supabase/browser-client"
import {
  IconCircleCheckFilled,
  IconCircleXFilled,
  IconLoader2,
  IconLogout,
  IconUser
} from "@tabler/icons-react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { FC, useCallback, useContext, useRef, useState } from "react"
import { toast } from "sonner"
import { SIDEBAR_ICON_SIZE } from "../sidebar/sidebar-switcher"
import { Button } from "../ui/button"
import ImagePicker from "../ui/image-picker"
import { Input } from "../ui/input"
import { Label } from "../ui/label"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger
} from "../ui/sheet"
import { ThemeSwitcher } from "./theme-switcher"

interface ProfileSettingsProps {}

export const ProfileSettings: FC<ProfileSettingsProps> = ({}) => {
  const { profile, setProfile } = useContext(ChatbotUIContext)

  const router = useRouter()
  const buttonRef = useRef<HTMLButtonElement>(null)

  const [isOpen, setIsOpen] = useState(false)

  const [displayName, setDisplayName] = useState(profile?.display_name || "")
  const [username, setUsername] = useState(profile?.username || "")
  const [usernameAvailable, setUsernameAvailable] = useState(true)
  const [loadingUsername, setLoadingUsername] = useState(false)
  const [profileImageSrc, setProfileImageSrc] = useState(
    profile?.image_url || ""
  )
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null)

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push("/login")
    router.refresh()
  }

  const handleSave = async () => {
    if (!profile) return
    let profileImageUrl = profile.image_url
    let profileImagePath = profile.image_path || ""

    if (profileImageFile) {
      const { path, url } = await uploadProfileImage(profile, profileImageFile)
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
    toast.success("Profile updated!")
    setIsOpen(false)
  }

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
        toast.error("Username must be letters, numbers, or underscores only.")
        return
      }

      setLoadingUsername(true)
      const response = await fetch(`/api/username/available`, {
        method: "POST",
        body: JSON.stringify({ username })
      })
      const data = await response.json()
      setUsernameAvailable(username === profile?.username || data.isAvailable)
      setLoadingUsername(false)
    }, 500),
    [profile?.username]
  )

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      buttonRef.current?.click()
    }
  }

  if (!profile) return null

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        {profile.image_url ? (
          <Image
            className="size-[34px] cursor-pointer rounded-full hover:opacity-80"
            src={profile.image_url + "?" + new Date().getTime()}
            height={34}
            width={34}
            alt="Profile Image"
          />
        ) : (
          <Button size="icon" variant="ghost">
            <IconUser size={SIDEBAR_ICON_SIZE} />
          </Button>
        )}
      </SheetTrigger>

      <SheetContent
        className="flex flex-col justify-between border-r bg-white p-0 data-[state=open]:duration-150 dark:border-gray-700 dark:bg-gray-900"
        side="left"
        onKeyDown={handleKeyDown}
      >
        <div dir="rtl" className="grow overflow-auto p-4 text-right">
          <SheetHeader className="mb-4">
            <SheetTitle className="flex items-center justify-between space-x-2 text-lg font-bold text-gray-800 dark:text-gray-100">
              <div>مشخصات کاربر</div>
              <Button
                tabIndex={-1}
                className="text-xs hover:bg-gray-100 dark:hover:bg-gray-800"
                variant="ghost"
                size="sm"
                onClick={handleSignOut}
              >
                <IconLogout className="ml-1" size={18} />
                خروج
              </Button>
            </SheetTitle>
          </SheetHeader>

          <div className="space-y-4">
            <div className="space-y-1">
              <Label className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                نام کاربری
              </Label>
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
                {username !== profile.username && (
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
              <Label className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                عکس پروفایل
              </Label>
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
              <Label className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                نام نمایشی در چت
              </Label>
              <Input
                placeholder="مثلاً علی..."
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                maxLength={PROFILE_DISPLAY_NAME_MAX}
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3 dark:border-gray-700">
          <ThemeSwitcher />
          <div className="space-x-2">
            <Button variant="ghost" onClick={() => setIsOpen(false)}>
              انصراف
            </Button>
            <Button ref={buttonRef} onClick={handleSave}>
              ذخیره
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
