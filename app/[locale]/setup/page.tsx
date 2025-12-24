"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { supabase } from "@/lib/supabase/browser-client"
// import { updateProfile } from "@/db/profile" // 👈 این را حذف یا کامنت کنید، مستقیم می‌نویسیم
import { motion, AnimatePresence } from "framer-motion"

export default function SetupPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [finished, setFinished] = useState(false)

  // استیت‌های فرم
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("") // ایمیل واقعی کاربر
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
      // ✅ ذخیره مستقیم در جدول profiles
      // ما از as any استفاده می‌کنیم تا به تغییرات جدید تایپ‌اسکریپت گیر ندهد
      const { error: dbError } = await (supabase.from("profiles") as any)
        .update({
          full_name: fullName,
          email: email, // 👈 ایمیل اینجا ذخیره می‌شود (فقط به عنوان متن)
          user_profile: userProfile,
          user_grade: userGrade,
          has_onboarded: true,
          updated_at: new Date().toISOString()
        })
        .eq("user_id", session.user.id)

      if (dbError) throw dbError

      // پایان کار
      setFinished(true)
      setTimeout(() => router.push("/chat"), 3000)
    } catch (err: any) {
      console.error(err)
      setError("خطا در ذخیره اطلاعات: " + err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="fixed inset-0 -z-10 bg-[#1E1E1E]" />

      <div className="flex min-h-screen items-center justify-center px-4">
        <AnimatePresence mode="wait">
          {finished ? (
            <motion.div
              key="welcome"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center"
            >
              <div className="mb-4 text-4xl font-bold text-[#D6D6D6]">
                به پرسینو خوش اومدی 🎉
              </div>
              <p className="text-gray-400">در حال انتقال به پنل...</p>
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
                تکمیل اطلاعات کاربری
              </h2>

              {/* نام و نام خانوادگی */}
              <div>
                <label className="mb-2 block text-right text-lg text-[#D6D6D6]">
                  نام و نام خانوادگی
                </label>
                <input
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  placeholder="مثلاً سارا محمدی"
                  required
                  className="w-full rounded-xl bg-[#1E1E1E]/80 px-4 py-3 text-[#D6D6D6] focus:outline-none focus:ring-2 focus:ring-[#ACACAC]"
                />
              </div>

              {/* ✅ فیلد ایمیل (فقط ذخیره می‌شود) */}
              <div>
                <label className="mb-2 block text-right text-lg text-[#D6D6D6]">
                  ایمیل (اختیاری - جهت اطلاع‌رسانی)
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="example@gmail.com"
                  className="w-full rounded-xl bg-[#1E1E1E]/80 px-4 py-3 text-[#D6D6D6] focus:outline-none focus:ring-2 focus:ring-[#ACACAC]"
                />
              </div>

              {/* سایر فیلدها */}
              <div className="grid grid-cols-2 gap-4">
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
                      انتخاب کنید
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
                      انتخاب کنید
                    </option>
                    <option value="دهم">دهم</option>
                    <option value="یازدهم">یازدهم</option>
                    <option value="دوازدهم">دوازدهم</option>
                  </select>
                </div>
              </div>

              {error && (
                <div className="rounded-lg bg-red-500/10 p-3 text-center text-sm text-red-400">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-full bg-[#ACACAC] py-3 font-semibold text-[#1E1E1E] transition-colors hover:bg-[#8F8F8F] disabled:opacity-50"
              >
                {loading ? "در حال ذخیره..." : "شروع کنید"}
              </button>
            </motion.form>
          )}
        </AnimatePresence>
      </div>
    </>
  )
}
