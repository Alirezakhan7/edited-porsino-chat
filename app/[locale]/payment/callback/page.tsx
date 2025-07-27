// app/[locale]/payment/callback/page.tsx
"use client"

import { Suspense } from "react"

function Waiting() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <p className="text-lg text-gray-700">در حال انتقال…</p>
    </div>
  )
}

export default function CallbackPage() {
  return (
    <Suspense fallback={<Waiting />}>
      <Waiting /> {/* یا چیزی که دوست داری نمایش بدهی */}
    </Suspense>
  )
}
