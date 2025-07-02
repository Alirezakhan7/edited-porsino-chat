import { useState, useContext } from "react"
// برای حل مشکل، کلاینت سوپابیس را از کانتکست کلی برنامه شما می‌خوانیم.
// این روش استاندارد در پروژه شماست و از بروز خطاهای بعدی (مانند احراز هویت) جلوگیری می‌کند.
//
// !!! نکته مهم !!!
// اگر این خط باعث خطای کامپایل می‌شود، لطفاً فقط همین یک خط را بر اساس ساختار پروژه خود اصلاح کنید.
// مسیر صحیح باید به فایل ChatbotUIContext شما اشاره کند (مثلاً ../../../context/context).
import { ChatbotUIContext } from "@/context/context"
import type { SupabaseClient } from "@supabase/supabase-js"
interface FeedbackFormProps {
  // پراپرتی ما مطابق راه‌حل نهایی، messageId است
  messageId: string
}

export default function FeedbackForm({ messageId }: FeedbackFormProps) {
  // --- دریافت کلاینت سوپابیس از کانتکست ---
  const { supabase } = useContext(ChatbotUIContext)

  // --- State Management ---
  const [feedbackSent, setFeedbackSent] = useState<"like" | "dislike" | null>(
    null
  )
  const [modalOpen, setModalOpen] = useState(false)
  const [reasons, setReasons] = useState<string[]>([])
  const [comment, setComment] = useState("")
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  // اگر کلاینت سوپابیس در دسترس نباشد یا شناسه پیام وجود نداشته باشد، کامپوننت را رندر نمی‌کنیم
  if (!supabase || !messageId) {
    return null
  }

  const reasonOptions = [
    { id: "incorrect", label: "پاسخ اشتباه بود", icon: "❌" },
    { id: "generic", label: "خیلی کلی بود", icon: "📝" },
    { id: "irrelevant", label: "ربطی به سؤال نداشت", icon: "🔄" },
    { id: "language", label: "نگارش ضعیف بود", icon: "💬" },
    { id: "repetitive", label: "تکراری بود", icon: "🔁" }
  ]

  const toggleReason = (reason: string) => {
    setReasons(prev =>
      prev.includes(reason) ? prev.filter(r => r !== reason) : [...prev, reason]
    )
  }

  // --- فراخوانی تابع Supabase ---
  const submitFeedbackViaFunction = async (feedbackData: object) => {
    setLoading(true)
    // کلاینت سوپابیس که از کانتکست گرفته شده، به طور خودکار توکن کاربر را ارسال می‌کند
    const { error } = await supabase.functions.invoke("submit-feedback", {
      body: {
        message_id: messageId,
        ...feedbackData
      }
    })
    setLoading(false)

    if (error) {
      console.error("Error calling Supabase function:", error)
      alert("خطا در ارسال بازخورد. لطفاً دوباره تلاش کنید.")
      return false
    }
    return true
  }

  const submitDislikeFeedback = async () => {
    if (reasons.length === 0 && !comment) {
      alert("لطفاً حداقل یک دلیل انتخاب کنید یا نظری بنویسید.")
      return
    }

    const success = await submitFeedbackViaFunction({
      feedback_type: "dislike",
      feedback_reasons: reasons,
      extra_comment: comment
    })

    if (success) {
      setSubmitted(true)
      setTimeout(() => {
        setModalOpen(false)
        setFeedbackSent("dislike")
      }, 1500)
    }
  }

  const submitLike = async () => {
    setFeedbackSent("like") // آپدیت خوش‌بینانه در UI
    const success = await submitFeedbackViaFunction({ feedback_type: "like" })
    if (!success) {
      setFeedbackSent(null) // بازگرداندن UI به حالت قبل در صورت خطا
    }
  }

  // --- Render ---
  return (
    <div className="flex items-center gap-2 pt-2">
      <button
        className={`flex items-center justify-center rounded-full p-1.5 transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-60 ${
          feedbackSent === "like"
            ? "bg-green-100 text-green-600 dark:bg-green-500/20 dark:text-green-400"
            : "text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200"
        }`}
        aria-label="لایک"
        title="لایک"
        onClick={submitLike}
        disabled={!!feedbackSent}
      >
        <svg
          width="16"
          height="16"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"
          />
        </svg>
      </button>

      <button
        className={`flex items-center justify-center rounded-full p-1.5 transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-60 ${
          feedbackSent === "dislike"
            ? "bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400"
            : "text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200"
        }`}
        aria-label="گزارش"
        title="گزارش"
        onClick={() => setModalOpen(true)}
        disabled={!!feedbackSent}
      >
        <svg
          width="16"
          height="16"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17"
          />
        </svg>
      </button>

      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 text-right"
          dir="rtl"
        >
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => !loading && setModalOpen(false)}
          ></div>
          <div className="animate-modal-enter relative flex max-h-[90vh] w-full max-w-sm flex-col overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-gray-900">
            <div className="shrink-0 bg-gray-50 p-4 dark:bg-gray-800/50">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                گزارش پاسخ
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 ">
                به ما در بهبود کیفیت پاسخ‌ها کمک کنید
              </p>
            </div>
            <div className="grow overflow-y-auto p-4">
              <div className="mb-4">
                <label className="mb-2 block text-sm font-semibold text-gray-800 dark:text-gray-200">
                  ایراد این پاسخ چه بود؟
                </label>
                <div className="space-y-2">
                  {reasonOptions.map(reason => (
                    <label
                      key={reason.id}
                      className={`flex cursor-pointer items-center gap-3 rounded-lg border-2 p-3 transition-colors ${reasons.includes(reason.label) ? "border-red-500 bg-red-50 dark:border-red-500 dark:bg-red-900/30" : "border-gray-200 bg-transparent hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600"}`}
                    >
                      <input
                        type="checkbox"
                        checked={reasons.includes(reason.label)}
                        onChange={() => toggleReason(reason.label)}
                        className="size-4 rounded accent-red-600 focus:ring-2 focus:ring-red-500/50"
                      />
                      <span className="text-lg">{reason.icon}</span>
                      <span className="font-medium text-gray-800 dark:text-gray-200">
                        {reason.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label
                  htmlFor="comment"
                  className="mb-1 block text-sm font-semibold text-gray-800 dark:text-gray-200"
                >
                  توضیحات بیشتر (اختیاری)
                </label>
                <textarea
                  id="comment"
                  placeholder="نظرت را بنویس..."
                  className="w-full resize-none rounded-lg border-2 border-gray-200 bg-white p-2 text-sm text-gray-900 transition-colors duration-200 placeholder:text-gray-400 focus:border-red-500 focus:ring-1 focus:ring-red-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-500 dark:focus:border-red-500"
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                  rows={3}
                  maxLength={300}
                />
                <div className="mt-1 text-left text-xs text-gray-400">
                  {comment.length}/300
                </div>
              </div>
            </div>
            <div className="shrink-0 border-t border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800/50">
              <button
                className={`w-full rounded-lg px-4 py-2.5 text-sm font-bold text-white transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-900 ${loading ? "cursor-not-allowed bg-gray-400" : submitted ? "bg-green-500 hover:bg-green-600 focus:ring-green-500" : "bg-red-600 hover:bg-red-700 focus:ring-red-600"}`}
                disabled={loading || submitted}
                onClick={submitDislikeFeedback}
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="size-4 animate-spin rounded-full border-2 border-white/30 border-t-white"></div>
                    <span>در حال ارسال...</span>
                  </div>
                ) : submitted ? (
                  <div className="flex items-center justify-center gap-2">
                    <svg
                      width="16"
                      height="16"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span>ممنون از بازخورد شما!</span>
                  </div>
                ) : (
                  "ارسال بازخورد"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
