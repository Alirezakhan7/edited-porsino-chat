"use client"

interface SampleQuestionsProps {
  onQuestionClick: (question: string) => void
}

const sampleQuestions = [
  "متابولیسم بدن در سرما چه تغییری می‌کند؟",
  "نقش میتوکندری در سلول چیست؟",
  "در مورد چرخه کربس به زبان ساده توضیح بده.",
  "تفاوت اصلی بین DNA و RNA را بگو."
]

export function SampleQuestions({ onQuestionClick }: SampleQuestionsProps) {
  return (
    <div className="w-full max-w-2xl px-4">
      {/* The title below the main heading is removed as requested */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {sampleQuestions.map((question, index) => (
          <div
            key={index}
            onClick={() => onQuestionClick(question)}
            // START: Padding Change
            // Changed p-4 to p-3 to reduce button size
            className="cursor-pointer rounded-xl border border-black/10 bg-black/5 p-3
                       text-center text-sm backdrop-blur-sm
                       transition-colors duration-200 ease-in-out
                       hover:bg-black/15 dark:border-white/10 dark:bg-white/5
                       dark:hover:bg-white/20"
            // END: Padding Change
          >
            {question}
          </div>
        ))}
      </div>
    </div>
  )
}
