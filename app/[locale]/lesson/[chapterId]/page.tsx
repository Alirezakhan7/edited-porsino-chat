// app/[locale]/lesson/[chapterId]/page.tsx

import { Suspense } from "react"
import { getChapterConfig } from "@/lib/lessons/config"
import LessonContent from "./lesson-content"

interface PageProps {
  params: Promise<{
    chapterId: string
    locale: string
  }>
}

export default async function MapPage({ params }: PageProps) {
  const { chapterId, locale } = await params
  const config = getChapterConfig(chapterId)

  if (!config) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4 text-center">
        <h1 className="text-3xl font-black text-slate-800 dark:text-white">
          فصل پیدا نشد 🚫
        </h1>
        <a href={`/${locale}/path`} className="text-blue-500 hover:underline">
          بازگشت به مسیر
        </a>
      </div>
    )
  }

  const themeGradient = config.themeColor || "from-blue-500 to-indigo-500"

  return (
    <div
      className="bg-background text-foreground relative min-h-screen w-full font-sans transition-colors duration-500"
      dir="rtl"
    >
      {/* 1. پس‌زمینه هوشمند (بلافاصله رندر می‌شود) */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div
          className={`absolute -left-[10%] -top-[10%] size-[600px] rounded-full bg-gradient-to-br opacity-20 blur-[130px] ${themeGradient} animate-pulse`}
        />
        <div className="absolute -bottom-[10%] right-[10%] size-[500px] rounded-full bg-purple-400/10 blur-[100px] dark:bg-purple-900/5" />
        <div className="bg-grid-black/[0.02] dark:bg-grid-white/[0.02] absolute inset-0" />
      </div>

      <main className="container mx-auto max-w-7xl px-4 py-6 md:py-12">
        {/* 2. محتوای سنگین در Suspense */}
        <Suspense fallback={<MapLoadingSkeleton />}>
          <LessonContent
            chapterId={chapterId}
            locale={locale}
            config={config}
          />
        </Suspense>
      </main>
    </div>
  )
}

function MapLoadingSkeleton() {
  return (
    <div className="grid animate-pulse grid-cols-1 gap-8 lg:grid-cols-12">
      {/* موبایل هدر اسکلت */}
      <div className="fixed inset-x-0 top-0 z-50 flex justify-center px-4 pt-6 md:hidden">
        <div className="h-20 w-full max-w-md rounded-[2rem] bg-white/50 backdrop-blur-md"></div>
      </div>

      {/* دسکتاپ سایدبار */}
      <div className="hidden h-96 rounded-3xl bg-white/5 lg:col-span-4 lg:block"></div>

      {/* نقشه */}
      <div className="h-screen space-y-8 pt-24 lg:col-span-8 lg:pt-0">
        <div className="mx-auto size-20 rounded-full bg-white/10"></div>
        <div className="mx-auto size-20 rounded-full bg-white/10"></div>
        <div className="mx-auto size-20 rounded-full bg-white/10"></div>
      </div>
    </div>
  )
}
