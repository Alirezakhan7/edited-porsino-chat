// app/[locale]/login/actions.ts
"use server"

import { redirect } from "next/navigation"

function toEnglishDigits(str: string) {
  if (!str) return str
  return str
    .replace(/[۰-۹]/g, d => "۰۱۲۳۴۵۶۷۸۹".indexOf(d).toString())
    .replace(/[٠-٩]/g, d => "٠١٢٣٤٥٦٧٨٩".indexOf(d).toString())
}

export async function signIn(formData: FormData) {
  const rawIdentifier = formData.get("identifier") as string
  const identifier = toEnglishDigits(rawIdentifier)

  if (!/^09[0-9]{9}$/.test(identifier)) {
    return { message: "لطفاً یک شماره موبایل معتبر وارد کنید." }
  }

  console.log("[Demo mode] signIn — redirecting to /chat")
  return redirect("/chat")
}

export async function sendOtp(formData: FormData) {
  const rawMobile = formData.get("mobile") as string
  const mobile = toEnglishDigits(rawMobile)

  if (!/^09[0-9]{9}$/.test(mobile)) {
    return { success: false, message: "شماره موبایل نامعتبر است." }
  }

  console.log("[Demo mode] sendOtp — code: 12345")
  return {
    success: true,
    message: "کد تایید ارسال شد (حالت دمو: 12345)"
  }
}

export async function verifyAndSignUp(formData: FormData) {
  const rawMobile = formData.get("mobile") as string
  const mobile = toEnglishDigits(rawMobile)
  const rawCode = formData.get("otp") as string
  const code = toEnglishDigits(rawCode)

  if (!/^09[0-9]{9}$/.test(mobile)) {
    return { success: false, message: "شماره موبایل نامعتبر است." }
  }

  if (code !== "12345") {
    return {
      success: false,
      message: "در حالت دمو کد تایید 12345 است."
    }
  }

  console.log("[Demo mode] verifyAndSignUp — redirecting to /setup")
  return redirect("/setup")
}
