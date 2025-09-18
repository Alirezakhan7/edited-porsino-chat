"use client"

import { FC } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { IconBrandTelegram, IconExternalLink } from "@tabler/icons-react"

interface SupportModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export const SupportModal: FC<SupportModalProps> = ({ open, onOpenChange }) => {
  const tgUrl = "https://t.me/porsino_support"

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="w-[92vw] max-w-md rounded-2xl border-0 p-0 shadow-2xl"
        // 👇 RTL و راست‌چین
        dir="rtl"
      >
        <div className="rounded-2xl bg-white p-5 text-right dark:bg-[#232427] ">
          <DialogHeader className="space-y-1">
            <DialogTitle className="text-right text-xl font-bold">
              پشتیبانی از طریق تلگرام
            </DialogTitle>
            <DialogDescription className="text-right text-sm leading-6">
              برای ارتباط مستقیم با تیم پشتیبانی پرسینو روی دکمه زیر بزنید.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 rounded-xl border border-gray-200/60 p-4 dark:border-white/10">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-full bg-[#229ED9]/10">
                <IconBrandTelegram size={22} className="text-[#229ED9]" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm text-gray-500">تلگرام</span>
                <span dir="ltr" className="font-medium ">
                  @porsino_support
                </span>
              </div>
            </div>
          </div>

          <DialogFooter className="mt-6 flex-col-reverse gap-2 sm:flex-row sm:justify-between">
            <Button
              variant="outline"
              className="w-full sm:w-auto"
              onClick={() => onOpenChange(false)}
            >
              بستن
            </Button>

            <a
              href={tgUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto"
            >
              <Button className="w-full gap-2 sm:w-auto">
                <IconExternalLink size={18} />
                رفتن به تلگرام
              </Button>
            </a>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  )
}
