// app/[locale]/upload/page.tsx

import { Suspense } from "react"
import { IconSchool, IconPlus } from "@tabler/icons-react"
import { RippleButton } from "@/components/material/MaterialUI"
import UploadContent from "./upload-content"

interface UploadPageProps {
  params: Promise<{
    locale: string
  }>
}

export default async function UploadPage(props: UploadPageProps) {
  // در Next.js 16 باید حتما await شود
  const params = await props.params
  const { locale } = params

  return (
    <div
      className="bg-background text-foreground relative min-h-screen w-full transition-colors duration-500"
      dir="rtl"
    >
      {/* پس‌زمینه ثابت */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -left-[10%] -top-[10%] size-[600px] animate-pulse rounded-full bg-blue-400/10 blur-[130px] dark:bg-blue-600/5" />
        <div className="absolute -bottom-[10%] right-[10%] size-[500px] rounded-full bg-purple-400/10 blur-[100px] dark:bg-purple-900/5" />
        <div className="bg-grid-black/[0.02] dark:bg-grid-white/[0.02] absolute inset-0" />
      </div>

      <main className="container mx-auto max-w-7xl px-4 py-6 md:py-12">
        {/* هدر دسکتاپ (استاتیک و سریع) */}
        <div className="mb-8 hidden items-center justify-between md:flex">
          <div>
            <h1 className="flex items-center gap-3 text-3xl font-black text-slate-900 md:text-4xl dark:text-white">
              <IconSchool
                className="text-blue-600 dark:text-blue-400"
                size={40}
              />
              جعبه لایتنر هوشمند
            </h1>
            <p className="mt-2 text-lg text-slate-600 dark:text-slate-400">
              مرور کارت‌های حافظه و تثبیت مطالب در ذهن
            </p>
          </div>
          <div className="flex gap-3">
            {/* دکمه غیرفعال تا لود شدن کلاینت */}
            <RippleButton className="pointer-events-none bg-blue-600 opacity-50">
              <span className="flex items-center gap-2">
                <IconPlus size={18} />
                کارت جدید
              </span>
            </RippleButton>
          </div>
        </div>

        {/* لود محتوای اصلی با Suspense */}
        <Suspense fallback={<UploadSkeleton />}>
          <UploadContent locale={locale} />
        </Suspense>
      </main>
    </div>
  )
}

function UploadSkeleton() {
  return (
    <div className="grid animate-pulse grid-cols-1 gap-8 lg:grid-cols-12">
      {/* سایدبار اسکلت */}
      <div className="hidden h-64 rounded-3xl bg-white/5 lg:col-span-4 lg:block"></div>
      {/* بدنه اصلی اسکلت */}
      <div className="space-y-8 lg:col-span-8">
        <div className="mb-6 flex justify-between md:hidden">
          <div className="h-8 w-40 rounded-xl bg-white/5"></div>
          <div className="flex gap-2">
            <div className="size-10 rounded-xl bg-white/5"></div>
            <div className="size-10 rounded-xl bg-white/5"></div>
          </div>
        </div>
        <div className="mx-auto h-[450px] w-full max-w-2xl rounded-3xl border border-white/10 bg-white/5"></div>
      </div>
    </div>
  )
}
