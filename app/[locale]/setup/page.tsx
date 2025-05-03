"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { supabase } from "@/lib/supabase/browser-client"
import { updateProfile } from "@/db/profile"
import { motion, AnimatePresence } from "framer-motion"

export default function SetupPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [finished, setFinished] = useState(false)

  const [fullName, setFullName] = useState("")
  const [userProfile, setUserProfile] = useState("")
  const [userGrade, setUserGrade] = useState("")
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const session = (await supabase.auth.getSession()).data.session
    if (!session) {
      router.push("/login")
      return
    }

    try {
      await updateProfile(session.user.id, {
        full_name: fullName,
        user_profile: userProfile,
        user_grade: userGrade,
        has_onboarded: true
      })

      setFinished(true)
      setTimeout(() => router.push("/chat"), 3000)
    } catch (err: any) {
      setError("خطا در ذخیره اطلاعات: " + err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* بک‌گراند تمام صفحه */}
      <div className="fixed inset-0 -z-10 bg-[#1E1E1E]" />

      <div className="flex min-h-screen items-center justify-center">
        <AnimatePresence mode="wait">
          {finished ? (
            <motion.div
              key="welcome"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center text-4xl font-bold text-[#D6D6D6]"
            >
              به پرسینو خوش اومدی 🎉
            </motion.div>
          ) : (
            <motion.form
              dir="rtl"
              key="form"
              onSubmit={handleSubmit}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
              className="mx-auto w-full max-w-xl space-y-6 rounded-2xl border border-[#5D5D5D]/40 bg-[#2C2C2C]/90 p-8 shadow-xl backdrop-blur-md"
            >
              <h2 className="text-center text-2xl font-semibold text-[#D6D6D6]">
                ثبت اطلاعات اولیه
              </h2>

              <div>
                <label className="mb-2 block text-right text-lg text-[#D6D6D6]">
                  نام و نام خانوادگی
                </label>
                <input
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  placeholder="مثلاً سارا محمدی"
                  required
                  className="w-full rounded-xl bg-[#1E1E1E]/80 px-4 py-3 text-[#D6D6D6]"
                />
              </div>

              <div>
                <label className="mb-2 block text-right text-lg text-[#D6D6D6]">
                  رشته تحصیلی
                </label>
                <select
                  value={userProfile}
                  onChange={e => setUserProfile(e.target.value)}
                  required
                  className="w-full rounded-xl bg-[#1E1E1E]/80 px-4 py-3 text-[#D6D6D6] focus:outline-none focus:ring-2 focus:ring-[#ACACAC]"
                >
                  <option value="" disabled>
                    رشته خود را انتخاب کنید
                  </option>
                  <option value="ریاضی">ریاضی</option>
                  <option value="تجربی">تجربی</option>
                  <option value="انسانی">انسانی</option>
                  <option value="زبان">زبان</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-right text-lg text-[#D6D6D6]">
                  پایه تحصیلی
                </label>
                <select
                  value={userGrade}
                  onChange={e => setUserGrade(e.target.value)}
                  required
                  className="w-full rounded-xl bg-[#1E1E1E]/80 px-4 py-3 text-[#D6D6D6] focus:outline-none focus:ring-2 focus:ring-[#ACACAC]"
                >
                  <option value="" disabled>
                    پایه خود را انتخاب کنید
                  </option>
                  <option value="دهم">دهم</option>
                  <option value="یازدهم">یازدهم</option>
                  <option value="دوازدهم">دوازدهم</option>
                </select>
              </div>

              {error && (
                <p className="text-center text-sm text-red-400">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-full bg-[#ACACAC] py-3 font-semibold text-[#1E1E1E] hover:bg-[#8F8F8F]"
              >
                {loading ? "در حال ذخیره..." : "ادامه"}
              </button>
            </motion.form>
          )}
        </AnimatePresence>
      </div>
    </>
  )
}
