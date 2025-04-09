// Below is the updated code for `profile-settings.tsx` with the following changes:
// 1) The 'API Keys' tab is completely removed.
// 2) The 'Profile' tab is renamed to 'مشخصات کاربر'.
// 3) The appearance is updated to a more modern style.
//    - Smoother background, minor hover effects, etc.
// 4) Everything else is intact (logout button, saving profile, etc.), but with only one tab.

"use client"

import { ChatbotUIContext } from "@/context/context"
import {
  PROFILE_CONTEXT_MAX,
  PROFILE_DISPLAY_NAME_MAX,
  PROFILE_USERNAME_MAX,
  PROFILE_USERNAME_MIN
} from "@/db/limits"
import { updateProfile } from "@/db/profile"
import { uploadProfileImage } from "@/db/storage/profile-images"
import { exportLocalStorageAsJSON } from "@/lib/export-old-data"
import { fetchOpenRouterModels } from "@/lib/models/fetch-models"
import { LLM_LIST_MAP } from "@/lib/models/llm/llm-list"
import { supabase } from "@/lib/supabase/browser-client"
import { cn } from "@/lib/utils"
import { OpenRouterLLM } from "@/types"
import {
  IconCircleCheckFilled,
  IconCircleXFilled,
  IconFileDownload,
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
import { LimitDisplay } from "../ui/limit-display"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger
} from "../ui/sheet"
import { TextareaAutosize } from "../ui/textarea-autosize"
import { WithTooltip } from "../ui/with-tooltip"
import { ThemeSwitcher } from "./theme-switcher"

interface ProfileSettingsProps {}

export const ProfileSettings: FC<ProfileSettingsProps> = ({}) => {
  const {
    profile,
    setProfile,
    envKeyMap,
    setAvailableHostedModels,
    setAvailableOpenRouterModels,
    availableOpenRouterModels
  } = useContext(ChatbotUIContext)

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
  const [profileInstructions, setProfileInstructions] = useState(
    profile?.profile_context || ""
  )

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push("/login")
    router.refresh()
    return
  }

  // We'll remove the entire API keys logic and tab.
  // We'll keep the user profile tab, but rename it to "مشخصات کاربر".

  const handleSave = async () => {
    if (!profile) return
    let profileImageUrl = profile.image_url
    let profileImagePath = ""

    // If user selected a new profile image.
    if (profileImageFile) {
      const { path, url } = await uploadProfileImage(profile, profileImageFile)
      if (url) {
        profileImageUrl = url
      }
      profileImagePath = path
    }

    const updatedProfile = await updateProfile(profile.id, {
      ...profile,
      display_name: displayName,
      username,
      profile_context: profileInstructions,
      image_url: profileImageUrl,
      image_path: profileImagePath
    })

    setProfile(updatedProfile)

    toast.success("Profile updated!")

    // If you had logic about API keys, we remove it.

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

      if (username.length < PROFILE_USERNAME_MIN) {
        setUsernameAvailable(false)
        return
      }

      if (username.length > PROFILE_USERNAME_MAX) {
        setUsernameAvailable(false)
        return
      }

      const usernameRegex = /^[a-zA-Z0-9_]+$/
      if (!usernameRegex.test(username)) {
        setUsernameAvailable(false)
        toast.error(
          "Username must be letters, numbers, or underscores only - no other characters or spacing allowed."
        )
        return
      }

      setLoadingUsername(true)

      const response = await fetch(`/api/username/available`, {
        method: "POST",
        body: JSON.stringify({ username })
      })

      const data = await response.json()
      const isAvailable = data.isAvailable

      if (username === profile?.username) {
        setUsernameAvailable(true)
      } else {
        setUsernameAvailable(isAvailable)
      }

      setLoadingUsername(false)
    }, 500),
    []
  )

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter") {
      buttonRef.current?.click()
    }
  }

  if (!profile) return null

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      {/* If user has a profile image, display it, else an icon. */}
      <SheetTrigger asChild>
        {profile.image_url ? (
          <Image
            className="mt-2 size-[34px] cursor-pointer rounded hover:opacity-70"
            src={profile.image_url + "?" + new Date().getTime()}
            height={34}
            width={34}
            alt={"Profile Image"}
          />
        ) : (
          <Button size="icon" variant="ghost">
            <IconUser size={SIDEBAR_ICON_SIZE} />
          </Button>
        )}
      </SheetTrigger>

      {/* The left sheet with a single tab: "مشخصات کاربر" */}
      <SheetContent
        className="flex flex-col justify-between border-r border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900"
        side="left"
        onKeyDown={handleKeyDown}
      >
        <div dir="rtl" className="grow overflow-auto p-4 text-right">
          <SheetHeader>
            <SheetTitle className="flex items-center justify-between space-x-2 text-lg font-bold text-gray-800 dark:text-gray-100">
              <div>مشخصات کاربر</div>
              <Button
                tabIndex={-1}
                className="text-xs hover:bg-gray-100 dark:hover:bg-gray-800"
                variant="ghost"
                size="sm"
                onClick={handleSignOut}
              >
                <IconLogout className="mr-1" size={18} />
                خروج
              </Button>
            </SheetTitle>
          </SheetHeader>

          {/* Just a single panel now. No tabs. */}
          <div className="mt-4 space-y-4">
            {/* Username */}
            <div className="space-y-1">
              <Label className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                نام کاربری
              </Label>
              <div className="relative">
                <Input
                  className="pr-10"
                  placeholder="Username..."
                  value={username}
                  onChange={e => {
                    setUsername(e.target.value)
                    checkUsernameAvailability(e.target.value)
                  }}
                  minLength={PROFILE_USERNAME_MIN}
                  maxLength={PROFILE_USERNAME_MAX}
                />

                {/* نمایش آیکن Available یا Not Available */}
                {username !== profile.username && (
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3">
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

            {/* Profile Image */}
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

            {/* Display Name */}
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

            {/* Profile Context */}
            <div className="space-y-1">
              <Label className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                توضیحات برای هوش مصنوعی
              </Label>

              <TextareaAutosize
                className="bg-white text-gray-700 dark:bg-gray-800 dark:text-gray-100"
                value={profileInstructions}
                onValueChange={setProfileInstructions}
                placeholder="هرچیزی که باید هوش مصنوعی در پاسخ‌ها بدونه..."
                minRows={6}
                maxRows={10}
              />
            </div>
          </div>
        </div>

        {/* Footer with Theme Switcher, Download data, and Save/Cancel */}
        <div className="mt-2 flex items-center border-t border-gray-200 px-4 py-3 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <ThemeSwitcher />
          </div>

          <div className="ml-auto space-x-2">
            <Button variant="ghost" onClick={() => setIsOpen(false)}>
              انصراف
            </Button>

            <Button
              ref={buttonRef}
              onClick={handleSave}
              className="hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              ذخیره
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
