"use client"

import Link from "next/link"
import { FC } from "react"

interface BrandProps {
  theme?: "dark" | "light"
}

export const Brand: FC<BrandProps> = ({ theme = "dark" }) => {
  return (
    <div className="flex cursor-pointer flex-col items-center hover:opacity-50">
      <div className="mb-2">
        <h1 className="text-center text-4xl font-bold tracking-wide">
          !از پرسینو بپرس
        </h1>
      </div>
    </div>
  )
}
