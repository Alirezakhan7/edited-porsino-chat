// app/[locale]/profile/edit-profile-modal.tsx
"use client"

import { useState, useEffect, useRef, useCallback, useContext } from "react"
import { ChatbotUIContext } from "@/context/context"
import { updateProfile } from "@/db/profile"
import { uploadProfileImage } from "@/db/storage/profile-images"
import { PROFILE_USERNAME_MAX, PROFILE_USERNAME_MIN } from "@/db/limits"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import ImagePicker from "@/components/ui/image-picker"
import {
  IconLoader2,
  IconCircleCheckFilled,
  IconCircleXFilled
} from "@tabler/icons-react"
import { toast } from "sonner"
import { Tables } from "@/supabase/types"

// --- تغییر مهم اینجاست ---
interface EditProfileModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  // ما پراپ profile را به initialProfile تغییر دادیم و اختیاری کردیم
  initialProfile?: Tables<"profiles"> | null
}

export function EditProfileModal({
  open,
  onOpenChange,
  initialProfile
}: EditProfileModalProps) {
  const { profile: contextProfile, setProfile } = useContext(ChatbotUIContext)

  // اولویت با پروفایل کانتکست است، اگر نبود از پراپ استفاده کن
  const profile = contextProfile || initialProfile

  const buttonRef = useRef<HTMLButtonElement>(null)

  const [displayName, setDisplayName] = useState("")
  const [username, setUsername] = useState("")
  const [usernameAvailable, setUsernameAvailable] = useState(true)
  const [loadingUsername, setLoadingUsername] = useState(false)
  const [profileImageSrc, setProfileImageSrc] = useState("")
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (profile && open) {
      setDisplayName(profile.display_name || "")
      setUsername(profile.username || "")
      setProfileImageSrc(profile.image_url || "")
    }
  }, [profile, open])

  const handleSave = async () => {
    if (!profile) return
    setIsSaving(true)
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
    } finally {
      setIsSaving(false)
    }
  }

  const checkUsernameAvailability = useCallback(async (u: string) => {
    if (!u) return
    if (u.length < PROFILE_USERNAME_MIN || u.length > PROFILE_USERNAME_MAX) {
      setUsernameAvailable(false)
      return
    }
    const usernameRegex = /^[a-zA-Z0-9_]+$/
    if (!usernameRegex.test(u)) {
      setUsernameAvailable(false)
      toast.error("نام کاربری نامعتبر است")
      return
    }
    setLoadingUsername(true)
    // شبیه‌سازی API check
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
            disabled={!usernameAvailable || loadingUsername || isSaving}
            className="bg-blue-600 text-white hover:bg-blue-700"
          >
            {isSaving ? "در حال ذخیره..." : "ذخیره تغییرات"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
