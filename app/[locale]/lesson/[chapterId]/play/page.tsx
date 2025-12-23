// app/[locale]/lesson/[chapterId]/play/page.tsx

import { Suspense } from "react"
import PlayContent from "./play-content"

interface PlayPageProps {
  params: Promise<{
    chapterId: string
    locale: string
  }>
  searchParams: Promise<{
    step?: string
  }>
}

export default async function PlayPage({
  params,
  searchParams
}: PlayPageProps) {
  const { chapterId, locale } = await params
  const { step } = await searchParams

  // 1. تعیین شماره مرحله
  const stepNumber = parseInt(step || "1")

  return (
    // در اینجا ما یک پس‌زمینه ساده می‌گذاریم تا حس پرش وجود نداشته باشد
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <Suspense fallback={<PlayerSkeleton />}>
        <PlayContent
          chapterId={chapterId}
          locale={locale}
          stepNumber={stepNumber}
        />
      </Suspense>
    </div>
  )
}

// یک لودینگ شبیه به پلیر واقعی می‌سازیم تا UX بهتر شود
function PlayerSkeleton() {
  return (
    <div className="flex min-h-screen animate-pulse flex-col bg-slate-50 dark:bg-slate-950">
      {/* هدر */}
      <div className="h-16 w-full border-b border-slate-200 bg-white/50 dark:border-slate-800 dark:bg-slate-900/50" />

      {/* بدنه اصلی */}
      <div className="flex flex-1 flex-col items-center justify-center p-4">
        {/* کارت سوال */}
        <div className="h-[400px] w-full max-w-2xl rounded-3xl bg-slate-200 dark:bg-slate-800" />

        {/* گزینه‌ها */}
        <div className="mt-8 grid w-full max-w-2xl grid-cols-1 gap-4 md:grid-cols-2">
          <div className="h-16 rounded-xl bg-slate-200 dark:bg-slate-800" />
          <div className="h-16 rounded-xl bg-slate-200 dark:bg-slate-800" />
          <div className="h-16 rounded-xl bg-slate-200 dark:bg-slate-800" />
          <div className="h-16 rounded-xl bg-slate-200 dark:bg-slate-800" />
        </div>
      </div>
    </div>
  )
}
