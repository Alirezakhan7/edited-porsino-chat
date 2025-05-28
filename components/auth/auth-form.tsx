"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { SubmitButton } from "@/components/ui/submit-button"
import { Label } from "@/components/ui/label"
import { motion, AnimatePresence } from "framer-motion"

interface Props {
  signIn: (data: FormData) => Promise<{ message?: string } | void>
  signUp: (data: FormData) => Promise<{ message?: string } | void>
  resetPassword: (data: FormData) => Promise<void>
  defaultMode?: "login" | "signup" // ← این خط جدید
}

interface Props {
  signIn: (data: FormData) => Promise<{ message?: string } | void>
  signUp: (data: FormData) => Promise<{ message?: string } | void>
  resetPassword: (data: FormData) => Promise<void>
  defaultMode?: "login" | "signup" // ← prop جدید برای تعیین حالت پیش‌فرض
}

export default function AuthForm({
  signIn,
  signUp,
  resetPassword,
  defaultMode // ← حواست باشه اینجا هم destructure بشه
}: Props) {
  const [mode, setMode] = useState<"login" | "signup" | "forgot">(
    defaultMode === "signup" ? "signup" : "login"
  )

  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const toggleMode = () =>
    setMode(prev => (prev === "login" ? "signup" : "login"))
  const switchToForgot = () => setMode("forgot")

  const handleSubmit = async (formData: FormData) => {
    setError(null)
    setIsSubmitting(true)

    try {
      if (mode === "login") {
        const result = await signIn(formData)
        if (result?.message) setError(result.message)
      } else if (mode === "signup") {
        const password = formData.get("password") as string
        const confirmPassword = formData.get("confirm-password") as string
        if (password !== confirmPassword) {
          setError("رمز عبور با تکرار آن یکسان نیست.")
          return
        }
        const result = await signUp(formData)
        if (result?.message) setError(result.message)
      } else if (mode === "forgot") {
        await resetPassword(formData)
      }
    } catch (err: any) {
      setError(err?.message || "خطایی رخ داده است")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex h-screen w-full flex-col items-center justify-start px-4 pt-12 sm:justify-center sm:pt-20">
      <h2 className="mb-6 text-center text-xl font-semibold text-[#D6D6D6] sm:text-2xl">
        {mode === "login"
          ? "وارد پرسینو شو"
          : mode === "signup"
            ? "در پرسینو ثبت‌نام کن"
            : "بازیابی رمز عبور"}
      </h2>

      <AnimatePresence mode="wait">
        <motion.form
          key={mode}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.4 }}
          onSubmit={e => {
            e.preventDefault()
            handleSubmit(new FormData(e.currentTarget))
          }}
          className="w-full max-w-md rounded-2xl border border-[#5D5D5D]/50 bg-[#2C2C2C]/80 p-6 backdrop-blur-md sm:max-w-lg sm:p-8"
          dir="rtl"
        >
          <Label htmlFor="email" className="text-[#D6D6D6]">
            ایمیل
          </Label>
          <Input
            name="email"
            id="email"
            placeholder="ایمیل شما"
            className="mb-4 mt-1 w-full rounded-xl bg-[#1E1E1E]/80 px-4 py-3 text-[#D6D6D6]"
            required
          />

          {mode !== "forgot" && (
            <>
              <Label htmlFor="password" className="text-[#D6D6D6]">
                رمز عبور
              </Label>
              <Input
                type="password"
                name="password"
                id="password"
                placeholder="••••••••"
                className="mb-4 mt-1 w-full rounded-xl bg-[#1E1E1E]/80 px-4 py-3 text-[#D6D6D6]"
                required
              />
            </>
          )}

          {mode === "signup" && (
            <>
              <Label htmlFor="confirm-password" className="text-[#D6D6D6]">
                تکرار رمز عبور
              </Label>
              <Input
                type="password"
                name="confirm-password"
                id="confirm-password"
                placeholder="••••••••"
                className="mb-4 mt-1 w-full rounded-xl bg-[#1E1E1E]/80 px-4 py-3 text-[#D6D6D6]"
                required
              />
            </>
          )}

          {error && <p className="mb-4 text-sm text-red-400">{error}</p>}

          {isSubmitting ? (
            <div className="mb-4 flex w-full items-center justify-center gap-2 py-2 text-[#D6D6D6]">
              <svg
                className="size-5 animate-spin"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v8H4z"
                ></path>
              </svg>
              <span>
                {mode === "login"
                  ? "در حال ورود..."
                  : mode === "signup"
                    ? "در حال ثبت‌نام..."
                    : "در حال ارسال لینک..."}
              </span>
            </div>
          ) : (
            <SubmitButton className="mb-4 w-full rounded-full bg-[#ACACAC] py-2 text-[#1E1E1E] hover:bg-[#8F8F8F]">
              {mode === "login"
                ? "ورود"
                : mode === "signup"
                  ? "ثبت‌نام"
                  : "ارسال لینک بازیابی"}
            </SubmitButton>
          )}

          {mode === "login" && (
            <button
              type="button"
              onClick={switchToForgot}
              className="mx-auto mb-4 block text-sm text-[#D6D6D6] underline hover:opacity-80"
            >
              رمز عبور را فراموش کرده‌اید؟
            </button>
          )}

          {mode !== "forgot" ? (
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
          ) : (
            <p className="text-center text-sm text-[#8F8F8F]">
              <button
                type="button"
                onClick={() => setMode("login")}
                className="text-[#D6D6D6] underline hover:opacity-80"
              >
                بازگشت به ورود
              </button>
            </p>
          )}
        </motion.form>
      </AnimatePresence>
    </div>
  )
}
