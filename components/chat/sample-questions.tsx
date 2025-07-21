"use client"

import { useContext } from "react"
import { ChatbotUIContext } from "@/context/context"
import { useMediaQuery } from "usehooks-ts"

interface SampleQuestionsProps {
  onQuestionClick: (question: string) => void
}

// نگاشت مدل به موضوع (بدون تغییر)
const modelToSubjectMap: Record<string, string> = {
  "math-advanced": "math",
  "math-simple": "math",
  "phys-advanced": "physics",
  "phys-simple": "physics",
  "bio-advanced": "biology",
  "bio-simple": "biology"
}

// سوالات موضوعی با آیکون‌های مدرن و شیشه‌ای
const subjectQuestions: Record<string, { title: string; content: string }[]> = {
  math: [
    { title: "🫧 کسرها", content: "کسرهای تو در تو چطور ساده می‌شن؟" },
    { title: "💎 مشتق مساحت", content: "چطور مساحت دایره رو با مشتق بگیریم؟" },
    { title: "🔮 احتمال", content: "فرمول احتمال شرطی رو توضیح بده" },
    { title: "✨ معادله درجه ۲", content: "چطور معادله درجه دوم را حل کنیم؟" },
    { title: "💫 تناسب", content: "تناسب و درصد را با مثال توضیح بده" },
    { title: "🌟 حل مسئله", content: "چطور مسائل چندمرحله‌ای رو حل کنیم؟" },
    { title: "🧊 شیب مشتق", content: "مفهوم شیب در مشتق چیه؟" },
    { title: "💧 حد و پیوستگی", content: "پیوستگی تابع یعنی چی؟" },
    { title: "🫐 دنباله‌ها", content: "فرمول دنباله عددی رو چطور بنویسیم؟" },
    { title: "🔹 حجم اجسام", content: "حجم کره و مخروط چطور محاسبه می‌شه؟" }
  ],
  physics: [
    { title: "⚡ قانون اهم", content: "قانون اهم را توضیح بده و مثال بزن" },
    { title: "🌀 مغناطیس", content: "میدان مغناطیسی چگونه ایجاد می‌شود؟" },
    { title: "💨 حرکت یکنواخت", content: "حرکت با سرعت ثابت یعنی چی؟" },
    { title: "💥 برخوردها", content: "برخورد کشسان و ناکشسان رو توضیح بده" },
    { title: "🧊 دما و گرما", content: "تفاوت گرما و دما چیه؟" },
    { title: "🔋 انرژی پتانسیل", content: "فرمول انرژی پتانسیل رو بگو" },
    { title: "🌪️ گشتاور", content: "گشتاور چطور محاسبه میشه؟" },
    { title: "💎 نیروها", content: "نیروهای تماس و غیرتماس چیا هستن؟" },
    { title: "🫧 نوسان", content: "حرکت هماهنگ ساده یعنی چی؟" },
    { title: "✨ بقای انرژی", content: "قانون بقای انرژی رو با مثال بگو" }
  ],
  biology: [
    { title: "🧬 میتوز", content: "مراحل تقسیم میتوز چیست؟" },
    { title: "🌿 فتوسنتز", content: "فرآیند فتوسنتز را ساده توضیح بده" },
    { title: "🧠 نورون‌ها", content: "کارکرد نورون‌ها را توضیح بده" },
    { title: "💉 آنتی‌ژن", content: "آنتی‌ژن و پادتن یعنی چی؟" },
    { title: "🧪 آنزیم‌ها", content: "آنزیم‌ها چطور کار می‌کنن؟" },
    { title: "🫀 گردش خون", content: "چطور خون در بدن حرکت می‌کنه؟" },
    { title: "🧫 یاخته", content: "تفاوت یاخته جانوری و گیاهی چیه؟" },
    { title: "🔮 هموستاز", content: "بدن چطور دماش رو تنظیم می‌کنه؟" },
    { title: "💨 تنفس سلولی", content: "تنفس سلولی چیه؟" },
    { title: "🧵 DNA", content: "DNA چه ساختاری داره؟" }
  ]
}

export function SampleQuestions({ onQuestionClick }: SampleQuestionsProps) {
  const { chatSettings } = useContext(ChatbotUIContext)
  const isMobile = useMediaQuery("(max-width: 767px)")
  const model = chatSettings?.model || ""
  const subject = modelToSubjectMap[model] || "biology"
  const fullList = subjectQuestions[subject] || subjectQuestions["biology"]

  const questions = isMobile ? fullList.slice(0, 5) : fullList.slice(0, 10)

  const line1 = questions.slice(0, 3)
  const line2 = questions.slice(3, 7)
  const line3 = questions.slice(7, 10)

  return (
    <div className="flex w-full justify-center px-4 pt-6">
      <div className="flex max-w-3xl flex-col items-center gap-2">
        {[line1, line2, line3].map(
          (line, i) =>
            line.length > 0 && (
              <div key={i} className="flex flex-wrap justify-center gap-2">
                {line.map(({ title, content }, index) => (
                  <button
                    key={index}
                    onClick={() => onQuestionClick(content)}
                    className="group rounded-2xl border border-white/20 bg-white/10 px-4 py-2.5 text-sm font-medium
                               text-gray-800 shadow-lg backdrop-blur-xl transition-all duration-300
                               hover:rotate-1 hover:scale-105 hover:border-white/40 hover:bg-green-400/10 
                               hover:shadow-xl
                               active:rotate-0 active:scale-95 dark:border-white/10
                               dark:bg-black/15 dark:text-white
                               dark:hover:border-white/20 dark:hover:bg-green-500/40"
                  >
                    <span className="inline-flex items-center gap-2">
                      <span className="text-base transition-all duration-300 group-hover:rotate-12 group-hover:scale-125">
                        {title.split(" ")[0]}
                      </span>
                      <span>{title.split(" ").slice(1).join(" ")}</span>
                    </span>
                  </button>
                ))}
              </div>
            )
        )}
      </div>
    </div>
  )
}
