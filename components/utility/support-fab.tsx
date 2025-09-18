"use client"

import { useState } from "react"
import { IconHeadset } from "@tabler/icons-react"
import { SupportModal } from "@/components/utility/support-modal"

export function SupportFab() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        type="button"
        aria-label="چت با پشتیبانی"
        onClick={() => setOpen(true)}
        className="
          /* روز (روشن): پس‌زمینه
          خنثی و ملایم
          */ /* شب
          (تاریک): پس‌زمینه تیرهٔ مات و ملایم */ fixed
          bottom-5 right-5
          z-50 flex size-12
          items-center
          justify-center rounded-full border border-black/5 bg-white/80 text-neutral-700 shadow-md backdrop-blur transition
          hover:bg-white/90 hover:text-neutral-800
          hover:shadow-lg focus:outline-none
          focus-visible:ring-2
          focus-visible:ring-black/10
          active:scale-[0.98] dark:border-white/10
          dark:bg-neutral-800/80 dark:text-neutral-200
          dark:shadow-md
          dark:hover:bg-neutral-800/90 dark:hover:text-white
          dark:focus-visible:ring-white/20
        "
      >
        <IconHeadset size={22} stroke={1.8} />
      </button>

      <SupportModal open={open} onOpenChange={setOpen} />
    </>
  )
}
