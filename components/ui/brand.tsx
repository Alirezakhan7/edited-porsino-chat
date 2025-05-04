"use client"

import Link from "next/link"
import { FC } from "react"

interface BrandProps {
  theme?: "dark" | "light"
}

export const Brand: FC<BrandProps> = ({ theme = "dark" }) => {
  return (
    <Link
      className="flex cursor-pointer flex-col items-center hover:opacity-50"
      href="https://chat.porsino.org"
      target="_blank"
      rel="noopener noreferrer"
    >
      <div className="mb-2">
        {/* نمایش متن به جای لوگو */}
        <h1 className="text-center text-4xl font-bold tracking-wide">
          !از پرسینو بپرس
        </h1>
      </div>
    </Link>
  )
}
