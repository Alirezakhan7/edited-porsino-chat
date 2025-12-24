// components/auth/auth-form.tsx
"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { SubmitButton } from "@/components/ui/submit-button"
import { Label } from "@/components/ui/label"
import { motion, AnimatePresence } from "framer-motion"
import { toast } from "sonner"

interface Props {
  signIn: (formData: FormData) => Promise<{ message?: string } | void>
  sendOtp: (
    formData: FormData
  ) => Promise<{ success: boolean; message: string }>
  verifyAndSignUp: (
    formData: FormData
  ) => Promise<{ success: boolean; message: string } | void>
  defaultMode?: "login" | "signup"
}

export default function AuthForm({
  signIn,
  sendOtp,
  verifyAndSignUp,
  defaultMode
}: Props) {
  const [mode, setMode] = useState<"login" | "signup">(
    defaultMode === "signup" ? "signup" : "login"
  )

  // مراحل ثبت‌نام: 1=گرفتن شماره، 2=گرفتن کد تایید و رمز
  const [signupStep, setSignupStep] = useState<1 | 2>(1)
  const [mobileForSignup, setMobileForSignup] = useState("")

  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const toggleMode = () => {
    setMode(prev => (prev === "login" ? "signup" : "login"))
    setSignupStep(1)
    setError(null)
  }

  // هندل کردن لاگین
  const handleLoginSubmit = async (formData: FormData) => {
    setError(null)
    setIsSubmitting(true)
    try {
      const result = await signIn(formData)
      if (result?.message) setError(result.message)
    } catch (err: any) {
      setError("خطایی رخ داده است")
    } finally {
      setIsSubmitting(false)
    }
  }

  // هندل کردن ثبت‌نام (مرحله ۱: ارسال کد)
  const handleSendOtp = async (formData: FormData) => {
    setError(null)
    setIsSubmitting(true)
    const mobile = formData.get("mobile") as string

    if (!/^09[0-9]{9}$/.test(mobile)) {
      setError("شماره موبایل نامعتبر است (مثال: 09123456789)")
      setIsSubmitting(false)
      return
    }

    try {
      const res = await sendOtp(formData)
      if (res.success) {
        setMobileForSignup(mobile)
        setSignupStep(2)
        toast.success(res.message)
      } else {
        setError(res.message)
      }
    } catch (err) {
      setError("خطا در ارسال پیامک")
    } finally {
      setIsSubmitting(false)
    }
  }

  // هندل کردن ثبت‌نام (مرحله ۲: تایید کد و ساخت اکانت)
  const handleVerifySubmit = async (formData: FormData) => {
    setError(null)
    setIsSubmitting(true)

    // اضافه کردن موبایل به فرم دیتا چون در این مرحله اینپوت موبایل نداریم
    formData.append("mobile", mobileForSignup)

    const password = formData.get("password") as string
    const confirm = formData.get("confirm-password") as string

    if (password !== confirm) {
      setError("رمز عبور با تکرار آن مطابقت ندارد")
      setIsSubmitting(false)
      return
    }

    try {
      const res = await verifyAndSignUp(formData)
      if (res && !res.success) {
        setError(res.message)
      }
    } catch (err) {
      setError("خطا در ثبت‌نام")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex h-screen w-full flex-col items-center justify-start px-4 pt-12 sm:justify-center sm:pt-20">
      <h2 className="mb-6 text-center text-xl font-semibold text-[#D6D6D6] sm:text-2xl">
        {mode === "login"
          ? "ورود به حساب کاربری"
          : signupStep === 1
            ? "ثبت‌نام با شماره موبایل"
            : "تایید شماره موبایل"}
      </h2>

      <AnimatePresence mode="wait">
        <motion.form
          key={mode + signupStep}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.4 }}
          onSubmit={e => {
            e.preventDefault()
            const formData = new FormData(e.currentTarget)

            if (mode === "login") {
              handleLoginSubmit(formData)
            } else {
              if (signupStep === 1) handleSendOtp(formData)
              else handleVerifySubmit(formData)
            }
          }}
          className="w-full max-w-md rounded-2xl border border-[#5D5D5D]/50 bg-[#2C2C2C]/80 p-6 backdrop-blur-md sm:max-w-lg sm:p-8"
          dir="rtl"
        >
          {/* --- حالت ورود --- */}
          {mode === "login" && (
            <>
              <Label htmlFor="login-identifier" className="text-[#D6D6D6]">
                شماره موبایل یا ایمیل
              </Label>
              <Input
                name="identifier"
                id="login-identifier"
                placeholder="مثلاً: 0912... یا email@..."
                className="mb-4 mt-1 w-full rounded-xl bg-[#1E1E1E]/80 px-4 py-3 text-[#D6D6D6] placeholder:text-gray-500"
                required
              />
              <Label htmlFor="password" className="text-[#D6D6D6]">
                رمز عبور
              </Label>
              <Input
                type="password"
                name="password"
                placeholder="••••••••"
                className="mb-4 mt-1 w-full rounded-xl bg-[#1E1E1E]/80 px-4 py-3 text-[#D6D6D6]"
                required
              />
            </>
          )}

          {/* --- حالت ثبت نام (مرحله ۱) --- */}
          {mode === "signup" && signupStep === 1 && (
            <>
              <Label htmlFor="mobile" className="text-[#D6D6D6]">
                شماره موبایل
              </Label>
              <Input
                type="tel"
                name="mobile"
                id="mobile"
                placeholder="0912xxxxxxx"
                className="mb-4 mt-1 w-full rounded-xl bg-[#1E1E1E]/80 px-4 py-3 text-left text-[#D6D6D6] placeholder:text-right placeholder:text-gray-500"
                required
                dir="ltr"
              />
            </>
          )}

          {/* --- حالت ثبت نام (مرحله ۲) --- */}
          {mode === "signup" && signupStep === 2 && (
            <>
              <div className="mb-4 text-center text-sm text-gray-400">
                کد تایید به شماره {mobileForSignup} ارسال شد.
                <button
                  type="button"
                  onClick={() => setSignupStep(1)}
                  className="mr-1 text-blue-400 hover:underline"
                >
                  (ویرایش شماره)
                </button>
              </div>

              <Label className="text-[#D6D6D6]">کد تایید پیامک شده</Label>
              <Input
                type="text"
                name="otp"
                placeholder="کد ۵ رقمی"
                className="mb-4 mt-1 w-full rounded-xl bg-[#1E1E1E]/80 px-4 py-3 text-center text-xl font-bold tracking-widest text-[#D6D6D6]"
                required
                maxLength={5}
              />

              <Label className="text-[#D6D6D6]">رمز عبور دلخواه</Label>
              <Input
                type="password"
                name="password"
                placeholder="••••••••"
                className="mb-4 mt-1 w-full rounded-xl bg-[#1E1E1E]/80 px-4 py-3 text-[#D6D6D6]"
                required
              />

              <Label className="text-[#D6D6D6]">تکرار رمز عبور</Label>
              <Input
                type="password"
                name="confirm-password"
                placeholder="••••••••"
                className="mb-4 mt-1 w-full rounded-xl bg-[#1E1E1E]/80 px-4 py-3 text-[#D6D6D6]"
                required
              />

              {/* کد معرف اینجا هم هست */}
              <Label className="text-[#D6D6D6]">کد معرف (اختیاری)</Label>
              <Input
                type="text"
                name="referral-code"
                placeholder="123456"
                className="mt-1 w-full rounded-xl border-dashed border-[#5D5D5D] bg-[#1E1E1E]/50 px-4 py-3 text-center text-lg font-bold tracking-widest text-[#D6D6D6]"
              />
            </>
          )}

          {error && <p className="mb-4 text-sm text-red-400">{error}</p>}

          <SubmitButton className="mb-4 w-full rounded-full bg-[#ACACAC] py-2 text-[#1E1E1E] hover:bg-[#8F8F8F]">
            {isSubmitting ? (
              <span className="animate-pulse">لطفاً صبر کنید...</span>
            ) : mode === "login" ? (
              "ورود به حساب"
            ) : signupStep === 1 ? (
              "ارسال کد تایید"
            ) : (
              "تایید و تکمیل ثبت‌نام"
            )}
          </SubmitButton>

          <p className="text-center text-sm text-[#8F8F8F]">
            {mode === "login"
              ? "حساب کاربری ندارید؟"
              : "قبلاً ثبت‌نام کرده‌اید؟"}{" "}
            <button
              type="button"
              onClick={toggleMode}
              className="text-[#D6D6D6] underline hover:opacity-80"
            >
              {mode === "login" ? "ثبت‌نام کنید" : "وارد شوید"}
            </button>
          </p>
        </motion.form>
      </AnimatePresence>
    </div>
  )
}
