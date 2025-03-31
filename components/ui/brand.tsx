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
      href="http://localhost:3000"
      target="_blank"
      rel="noopener noreferrer"
    >
      <div className="mb-2">
        {/* نمایش متن به جای لوگو */}
        <h1 className="text-center text-4xl font-bold tracking-wide">
          !از نوتیک بپرس
        </h1>
      </div>

      {/* حذف متن "Chatbot UI" */}
      {/* اگر بخواهید متن دیگری نمایش دهید */}
      {/* <div className="text-4xl font-bold tracking-wide">Your New Brand Name</div> */}
    </Link>
  )
}

/*
"use client"

import Link from "next/link"
import { FC } from "react"
import { ChatbotUISVG } from "../icons/chatbotui-svg"

interface BrandProps {
  theme?: "dark" | "light"
}

export const Brand: FC<BrandProps> = ({ theme = "dark" }) => {
  return (
    <Link
      className="flex cursor-pointer flex-col items-center hover:opacity-50"
      href="https://www.chatbotui.com"
      target="_blank"
      rel="noopener noreferrer"
    >
      <div className="mb-2">
        <ChatbotUISVG theme={theme === "dark" ? "dark" : "light"} scale={0.3} />
      </div>

      <div className="text-4xl font-bold tracking-wide">Chatbot UI</div>
    </Link>
  )
}
*/
