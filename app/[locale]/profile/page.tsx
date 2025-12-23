// app/[locale]/profile/page.tsx
import { Suspense } from "react"
import { IconUsers } from "@tabler/icons-react"
import ProfileContent from "./profile-content"

interface ProfilePageProps {
  params: Promise<{
    locale: string
  }>
}

export default async function ProfilePage(props: ProfilePageProps) {
  const params = await props.params
  const { locale } = params

  return (
    <div
      className="bg-background text-foreground relative min-h-screen w-full transition-colors duration-500"
      dir="rtl"
    >
      {/* 1. پس‌زمینه هوشمند */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -left-[10%] -top-[10%] size-[600px] animate-pulse rounded-full bg-blue-400/10 blur-[130px] dark:bg-blue-600/5" />
        <div className="absolute -bottom-[10%] right-[10%] size-[500px] rounded-full bg-purple-400/10 blur-[100px] dark:bg-purple-900/5" />
        <div className="bg-grid-black/[0.02] dark:bg-grid-white/[0.02] absolute inset-0" />
      </div>

      <main className="container mx-auto max-w-7xl px-4 py-6 md:py-12">
        <div className="mb-8 hidden md:block">
          <h1 className="flex items-center gap-3 text-3xl font-black text-slate-900 md:text-4xl dark:text-white">
            <IconUsers className="text-blue-600 dark:text-blue-400" size={40} />
            پنل کاربری
          </h1>
          <p className="mt-2 text-lg text-slate-600 dark:text-slate-400">
            مدیریت حساب کاربری و مشاهده دستاوردها
          </p>
        </div>

        <Suspense fallback={<ProfileSkeleton />}>
          <ProfileContent locale={locale} />
        </Suspense>
      </main>
    </div>
  )
}

function ProfileSkeleton() {
  return (
    <div className="grid animate-pulse grid-cols-1 gap-8 lg:grid-cols-12">
      <div className="h-96 rounded-3xl bg-white/5 lg:col-span-4"></div>
      <div className="space-y-6 lg:col-span-8">
        <div className="h-40 rounded-3xl bg-white/5"></div>
        <div className="h-40 rounded-3xl bg-white/5"></div>
      </div>
    </div>
  )
}
