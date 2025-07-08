"use client"

interface SampleQuestionsProps {
  onQuestionClick: (question: string) => void
}

const sampleQuestions = [
  "متابولیسم بدن در سرما چه تغییری می‌کند؟",
  "فصل سوم زیست شناسی دوازدهم را برام خلاصه کن",
  "فردااز فصل ماده به انرژی امتحان دارم بهم خلاصه بگو چی بخونم",
  "یک امتحان تستی 10 سواله از فصل تقسیم یاخته برام طراحی کن"
]

export function SampleQuestions({ onQuestionClick }: SampleQuestionsProps) {
  return (
    <div className="w-full max-w-2xl px-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {sampleQuestions.map((question, index) => (
          <div
            key={index}
            onClick={() => onQuestionClick(question)}
            className="dark:via-white/2 dark:hover:to-green-700/2 group relative cursor-pointer
                       overflow-hidden rounded-2xl border border-white/20
                       bg-gradient-to-br from-white/10 via-white/5 to-transparent
                       p-4 text-center
                       text-sm font-medium shadow-lg shadow-black/5
                       backdrop-blur-xl backdrop-saturate-150 transition-all
                       duration-200 ease-out hover:scale-[1.05]
                       hover:border-green-400/40 hover:bg-gradient-to-br 
                       hover:from-green-50/20 hover:via-green-100/10 hover:to-emerald-50/5
                       hover:shadow-xl hover:shadow-green-500/10 active:scale-[0.95]
                       active:transition-transform active:duration-75 dark:border-white/10
                       dark:from-white/5 dark:to-transparent 
                       dark:hover:border-green-400/30 dark:hover:from-green-900/10
                       dark:hover:via-green-800/5 dark:hover:shadow-green-400/10"
          >
            {/* Subtle gradient overlay that appears on hover */}
            <div
              className="from-green-500/8 via-emerald-500/6 to-teal-500/4 absolute inset-0 bg-gradient-to-br 
                           opacity-0 transition-opacity duration-200 group-hover:opacity-100"
            />

            {/* Content */}
            <div className="relative z-10 text-xs leading-snug text-gray-800 dark:text-gray-100">
              {question}
            </div>

            {/* Animated border effect */}
            <div
              className="via-emerald-500/12 absolute inset-0 -z-10 rounded-2xl bg-gradient-to-r from-green-500/15 
                           to-teal-500/10 opacity-0 transition-opacity duration-200 group-hover:opacity-100"
            />
          </div>
        ))}
      </div>
    </div>
  )
}

export default SampleQuestions
