"use client"

import { useState, useEffect, useCallback } from "react"

interface ClientRect {
  x: number
  y: number
  width: number
  height: number
  top: number
  right: number
  bottom: number
  left: number
}

export const useTextSelection = () => {
  const [clientRect, setClientRect] = useState<ClientRect | null>(null)
  const [isCollapsed, setIsCollapsed] = useState(true)
  const [textContent, setTextContent] = useState("")

  const handler = useCallback(() => {
    const selection = window.getSelection()

    if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
      setClientRect(null)
      setIsCollapsed(true)
      setTextContent("")
      return
    }

    const range = selection.getRangeAt(0)
    const rect = range.getBoundingClientRect()
    const text = selection.toString().trim()

    if (text.length === 0) {
      setClientRect(null)
      setIsCollapsed(true)
      setTextContent("")
      return
    }

    setClientRect(rect)
    setIsCollapsed(false)
    setTextContent(text)
  }, [])

  useEffect(() => {
    document.addEventListener("selectionchange", handler)
    document.addEventListener("keydown", handler)
    document.addEventListener("keyup", handler)
    window.addEventListener("resize", handler)

    // ✅ تغییر مهم: استفاده از true برای گرفتن اسکرولِ دایوهای داخلی
    document.addEventListener("scroll", handler, true)

    return () => {
      document.removeEventListener("selectionchange", handler)
      document.removeEventListener("keydown", handler)
      document.removeEventListener("keyup", handler)
      window.removeEventListener("resize", handler)
      document.removeEventListener("scroll", handler, true)
    }
  }, [handler])

  return {
    clientRect,
    isCollapsed,
    textContent
  }
}
