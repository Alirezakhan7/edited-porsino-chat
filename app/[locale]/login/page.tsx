// app/[locale]/login/page.tsx
import AuthForm from "@/components/auth/auth-form"
import AnimatedMessage from "@/components/ui/animated-message"
import { Metadata } from "next"
import { signIn, sendOtp, verifyAndSignUp } from "./actions"

export const metadata: Metadata = {
  title: "ورود یا ثبت‌نام"
}

export default async function Login({
  searchParams
}: {
  searchParams: Promise<{ message?: string; mode?: string }>
}) {
  const sp = await searchParams
  const mode = sp?.mode === "signup" ? "signup" : "login"

  return (
    <div
      className="flex w-full flex-1 flex-col items-center justify-center px-4"
      style={{ backgroundColor: "#1E1E1E" }}
    >
      <div className="w-full max-w-md">
        {sp?.message && <AnimatedMessage message={sp.message} />}
        <AuthForm
          signIn={signIn}
          sendOtp={sendOtp}
          verifyAndSignUp={verifyAndSignUp}
          defaultMode={mode}
        />
      </div>
    </div>
  )
}
