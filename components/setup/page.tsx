// ✅ فایل setup/page.tsx - فقط یک مرحله ساده برای اطلاعات کاربر
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { motion, AnimatePresence } from "framer-motion"

export default function SetupPage() {
  const router = useRouter()
  const supabase = createClient()

  const [fullName, setFullName] = useState("")
  const [userProfile, setUserProfile] = useState("")
  const [userGrade, setUserGrade] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [finished, setFinished] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const {
      data: { user },
      error: userError
    } = await supabase.auth.getUser()
    if (userError || !user) {
      setError("کاربر یافت نشد.")
      setLoading(false)
      return
    }

    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        full_name: fullName,
        user_profile: userProfile,
        user_grade: userGrade
      })
      .eq("id", user.id)

    if (updateError) {
      setError("خطا در ذخیره اطلاعات: " + updateError.message)
    } else {
      setFinished(true)
      setTimeout(() => router.push("/chat"), 3000)
    }

    setLoading(false)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#1E1E1E] px-4">
      <AnimatePresence mode="wait">
        {finished ? (
          <motion.div
            key="welcome"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center text-3xl font-bold text-[#D6D6D6]"
          >
            به پرسینو خوش اومدی 🎉
          </motion.div>
        ) : (
          <motion.form
            key="form"
            onSubmit={handleSubmit}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
            className="w-full max-w-md space-y-4 rounded-2xl border border-[#5D5D5D]/50 bg-[#2C2C2C]/80 p-6 backdrop-blur-md"
          >
            <h2 className="text-center text-xl font-semibold text-[#D6D6D6]">
              ثبت اطلاعات اولیه
            </h2>

            <div>
              <label className="mb-1 block text-[#D6D6D6]">
                نام و نام خانوادگی
              </label>
              <input
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                placeholder="مثلاً سارا محمدی"
                required
                className="w-full rounded-lg bg-[#1E1E1E]/80 px-4 py-2 text-[#D6D6D6]"
              />
            </div>

            <div>
              <label className="mb-1 block text-[#D6D6D6]">مقطع تحصیلی</label>
              <input
                value={userProfile}
                onChange={e => setUserProfile(e.target.value)}
                placeholder="مثلاً کنکور ریاضی"
                required
                className="w-full rounded-lg bg-[#1E1E1E]/80 px-4 py-2 text-[#D6D6D6]"
              />
            </div>

            <div>
              <label className="mb-1 block text-[#D6D6D6]">پایه تحصیلی</label>
              <input
                value={userGrade}
                onChange={e => setUserGrade(e.target.value)}
                placeholder="مثلاً دوازدهم"
                required
                className="w-full rounded-lg bg-[#1E1E1E]/80 px-4 py-2 text-[#D6D6D6]"
              />
            </div>

            {error && (
              <p className="text-center text-sm text-red-400">{error}</p>
            )}

            <button
              type="submit"
              className="w-full rounded-full bg-[#ACACAC] py-2 text-[#1E1E1E] hover:bg-[#8F8F8F]"
              disabled={loading}
            >
              {loading ? "در حال ذخیره..." : "ادامه"}
            </button>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  )
}
