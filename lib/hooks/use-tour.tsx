// فایل: lib/hooks/use-tour.tsx
"use client"

import { useEffect, useState } from "react"
import { driver } from "driver.js"
import "driver.js/dist/driver.css"
import { createClient } from "@/lib/supabase/client"

export const useTour = (
  tourName: string, // مثلا 'lesson_page'
  steps: any[], // مراحل تور
  userId: string | undefined
) => {
  const [hasSeen, setHasSeen] = useState(true) // پیش‌فرض true میذاریم که پرش نداشته باشه
  const supabase = createClient()

  useEffect(() => {
    if (!userId) return

    const checkAndRun = async () => {
      // 1. دریافت وضعیت از دیتابیس
      const { data } = await supabase
        .from("profiles")
        .select("tour_status")
        .eq("user_id", userId)
        .single()

      const status = data?.tour_status as Record<string, boolean>

      // اگر قبلاً دیده، کاری نکن
      if (status && status[tourName] === true) {
        return
      }

      setHasSeen(false)

      // 2. تنظیمات درایور (ظاهر تور)
      const driverObj = driver({
        showProgress: true,
        steps: steps,
        nextBtnText: "بعدی",
        prevBtnText: "قبلی",
        doneBtnText: "متوجه شدم",
        allowClose: true,
        popoverClass: "driverjs-theme",
        // 👇 نام صحیح در نسخه جدید این است:
        onDestroyed: async () => {
          // 3. وقتی تمام شد، در دیتابیس ذخیره کن
          const newStatus = { ...status, [tourName]: true }

          await supabase
            .from("profiles")
            .update({ tour_status: newStatus })
            .eq("user_id", userId)
        }
      })

      // کمی صبر کن تا صفحه کامل رندر بشه بعد اجرا کن
      setTimeout(() => {
        driverObj.drive()
      }, 1000)
    }

    checkAndRun()
  }, [userId, tourName])

  return hasSeen
}
