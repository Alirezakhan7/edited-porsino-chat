import { useState } from "react"
import { createClient } from "@supabase/supabase-js"

// اتصال به Supabase واقعی
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface FeedbackFormProps {
  conversationId?: string
}

export default function FeedbackForm({
  conversationId = "demo-123"
}: FeedbackFormProps) {
  const [modalOpen, setModalOpen] = useState(false)
  const [reasons, setReasons] = useState<string[]>([])
  const [comment, setComment] = useState("")
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [likePressed, setLikePressed] = useState(false)

  // دلایل به فارسی
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

  // ارسال بازخورد دیسلایک
  const submitFeedback = async () => {
    setLoading(true)

    const { error } = await supabase.from("feedbacks").insert([
      {
        conversation_id: conversationId,
        feedback_type: "dislike",
        feedback_reasons: reasons,
        extra_comment: comment
      }
    ])
    setLoading(false)

    if (error) {
      alert("خطا در ارسال بازخورد.")
      console.error(error)
    } else {
      setSubmitted(true)
      setTimeout(() => {
        setModalOpen(false)
        setReasons([])
        setComment("")
        setSubmitted(false)
      }, 2000)
    }
  }

  // ارسال لایک
  const submitLike = async () => {
    setLikePressed(true)
    await supabase
      .from("feedbacks")
      .insert([{ conversation_id: conversationId, feedback_type: "like" }])
  }

  return (
    <div className="flex items-center gap-1 pt-2">
      {/* دکمه لایک */}
      <button
        className={`group relative overflow-hidden rounded-full bg-transparent p-1 transition-all duration-300 hover:scale-110`}
        aria-label="لایک"
        title="لایک"
        onClick={submitLike}
        disabled={likePressed}
        style={{ border: "none" }}
      >
        <div className="relative flex items-center justify-center">
          <svg
            width="14"
            height="14"
            className="text-black dark:text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2.2}
              d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"
            />
          </svg>
        </div>
      </button>

      {/* دکمه دیسلایک */}
      <button
        className="group relative overflow-hidden rounded-full bg-transparent p-1 transition-all duration-300 hover:scale-110"
        aria-label="گزارش"
        title="گزارش"
        onClick={() => setModalOpen(true)}
        style={{ border: "none" }}
      >
        <div className="relative flex items-center justify-center">
          <svg
            width="14"
            height="14"
            className="text-black dark:text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2.2}
              d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17"
            />
          </svg>
        </div>
      </button>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm dark:bg-black/80"
            onClick={() => setModalOpen(false)}
          ></div>

          {/* Modal Content */}
          <div className="animate-modal-enter relative max-h-[90vh] w-full max-w-xs overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-gray-900">
            {/* Header */}
            <div className="rounded-t-2xl bg-gradient-to-r from-red-500 to-rose-600 p-3 text-white">
              <button
                className="absolute right-2 top-2 rounded-full p-1 hover:bg-white/20"
                onClick={() => setModalOpen(false)}
                aria-label="بستن"
                style={{ border: "none" }}
              >
                <svg
                  width="13"
                  height="13"
                  className="text-white"
                  viewBox="0 0 20 20"
                >
                  <path
                    d="M6 6l8 8M6 14L14 6"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
              <div className="flex items-center gap-2">
                <div className="rounded-full bg-white/20 p-1">
                  <svg
                    width="13"
                    height="13"
                    className=""
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-base font-bold">گزارش پاسخ</h3>
                  <p className="text-xs text-white/80">
                    به بهبود کیفیت کمک کنید
                  </p>
                </div>
              </div>
            </div>

            {/* Body */}
            <div className="max-h-[calc(90vh-70px)] overflow-y-auto p-3">
              <div className="mb-3">
                <label className="mb-2 block text-xs font-semibold text-gray-700 dark:text-gray-300">
                  ایراد این پاسخ چه بود؟
                </label>
                <div className="space-y-2">
                  {reasonOptions.map(reason => (
                    <label
                      key={reason.id}
                      className={`flex cursor-pointer items-center gap-2 rounded-lg p-1.5 text-xs ${
                        reasons.includes(reason.label)
                          ? "bg-red-50 dark:bg-red-900/30"
                          : "hover:bg-gray-50 dark:hover:bg-gray-800/40"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={reasons.includes(reason.label)}
                        onChange={() => toggleReason(reason.label)}
                        className="size-3 rounded accent-red-600"
                      />
                      <span className="text-base">{reason.icon}</span>
                      <span className="font-medium text-gray-700 dark:text-gray-300">
                        {reason.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="mb-3">
                <label className="mb-1 block text-xs font-semibold text-gray-700 dark:text-gray-300">
                  توضیحات بیشتر (اختیاری)
                </label>
                <textarea
                  placeholder="نظرت را بنویس..."
                  className="w-full resize-none rounded-lg border-2 border-gray-200 bg-white p-2 text-xs text-gray-900 transition-colors duration-200 placeholder:text-gray-500 focus:border-red-400 focus:ring-0 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-400 dark:focus:border-red-500"
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                  rows={2}
                  maxLength={300}
                />
                <div className="text-2xs mt-1 text-left text-gray-400">
                  {comment.length}/300
                </div>
              </div>

              <button
                className={`w-full rounded-lg py-2 text-xs font-bold transition-all duration-300 ${
                  loading
                    ? "cursor-not-allowed bg-gray-400 text-white"
                    : submitted
                      ? "bg-green-500 text-white hover:bg-green-600"
                      : "bg-gradient-to-r from-red-500 to-rose-600 text-white shadow-lg hover:from-red-600 hover:to-rose-700"
                }`}
                disabled={loading || submitted}
                onClick={submitFeedback}
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="size-3 animate-spin rounded-full border-2 border-white/30 border-t-white"></div>
                    در حال ارسال...
                  </div>
                ) : submitted ? (
                  <div className="flex items-center justify-center gap-2">
                    <svg
                      width="12"
                      height="12"
                      className=""
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    ممنون بابت بازخوردت!
                  </div>
                ) : (
                  "ارسال بازخورد"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes modal-enter {
          from {
            opacity: 0;
            transform: scale(0.9) translateY(20px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
        .animate-modal-enter {
          animation: modal-enter 0.3s ease-out;
        }
      `}</style>
    </div>
  )
}
