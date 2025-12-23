// app/[locale]/path/page.tsx

import { Suspense } from "react"
import { IconLayoutDashboard } from "@tabler/icons-react"
import PathContent from "./path-content" // کامپوننت جدید که می‌سازیم
import { Skeleton } from "@/components/ui/skeleton" // یا هر لودینگ دیگر

interface PathPageProps {
  params: Promise<{
    locale: string
  }>
}

export default async function PathPage({ params }: PathPageProps) {
  const { locale } = await params

  return (
    <div
      className="bg-background text-foreground relative min-h-screen w-full transition-colors duration-500"
      dir="rtl"
    >
      {/* 1. پس‌زمینه ثابت - بلافاصله رندر می‌شود */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -left-[10%] -top-[10%] size-[600px] animate-pulse rounded-full bg-blue-400/20 blur-2xl md:blur-[100px] dark:bg-blue-600/10" />
        <div className="absolute -bottom-[10%] right-[10%] size-[500px] rounded-full bg-purple-400/10 blur-2xl md:blur-[100px] dark:bg-purple-900/5" />
        <div className="bg-grid-black/[0.02] dark:bg-grid-white/[0.02] absolute inset-0" />
      </div>

      <main className="container mx-auto max-w-7xl px-4 py-8 md:py-12">
        {/* 2. تیتر اصلی - بلافاصله رندر می‌شود و LCP را پر می‌کند */}
        <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="flex items-center gap-3 text-3xl font-black md:text-4xl">
              <IconLayoutDashboard
                className="text-blue-600 dark:text-blue-400"
                size={36}
              />
              مسیر یادگیری هوشمند
            </h1>
            <p className="text-muted-foreground mt-2">
              پیشرفت خود را در دروس زیست‌شناسی دنبال کنید
            </p>
          </div>
        </div>

        {/* 3. بخش سنگین - در Suspense قرار می‌گیرد */}
        <Suspense fallback={<PathLoadingSkeleton />}>
          <PathContent locale={locale} />
        </Suspense>
      </main>
    </div>
  )
}

function PathLoadingSkeleton() {
  return (
    <div className="grid animate-pulse grid-cols-1 gap-8 lg:grid-cols-12">
      <div className="h-64 rounded-2xl bg-white/5 lg:col-span-4"></div>
      <div className="space-y-4 lg:col-span-8">
        <div className="h-16 rounded-xl bg-white/5"></div>
        <div className="h-16 rounded-xl bg-white/5"></div>
        <div className="h-16 rounded-xl bg-white/5"></div>
      </div>
    </div>
  )
}
