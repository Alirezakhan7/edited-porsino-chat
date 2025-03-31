import { Brand } from "@/components/ui/brand"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { SubmitButton } from "@/components/ui/submit-button"
import { redirect } from "next/navigation"
import { cookies, headers } from "next/headers"

const isTest = process.env.NEXT_PUBLIC_MOCK_SUPABASE === "true"

export const metadata = { title: "Login" }

export default async function Login({
  searchParams
}: {
  searchParams: { message: string }
}) {
  const cookieStore = cookies()
  let session = null

  if (!isTest) {
    // در حالت عادی Supabase مقداردهی می‌شود
    const { createServerClient } = await import("@supabase/ssr")
    const { Database } = await import("@/supabase/types")

    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          }
        }
      }
    )

    session = (await supabase.auth.getSession()).data.session

    if (session) {
      const { data: homeWorkspace, error: workspaceError } = await supabase
        .from("workspaces")
        .select("*")
        .eq("user_id", session.user.id)
        .eq("is_home", true)
        .single()

      if (!homeWorkspace) {
        throw new Error(workspaceError?.message || "Home workspace not found.")
      }

      return redirect(`/${homeWorkspace.id}/chat`)
    }
  } else {
    console.log("⚠️ حالت تست فعال است!")
    session = { user: { id: "test-user", email: "test@example.com" } }
  }

  // متد تستی برای لاگین
  const signIn = async (formData: FormData) => {
    "use server"
    const email = formData.get("email") as string
    const password = formData.get("password") as string

    if (isTest) {
      console.log("⚠️ ورود تستی موفقیت‌آمیز!")
      return redirect("/mock-dashboard")
    }

    const { createClient } = await import("@/lib/supabase/server")
    const supabase = createClient(cookieStore)

    const { data, error: signInError } = await supabase.auth.signInWithPassword(
      {
        email,
        password
      }
    )

    if (signInError) {
      return redirect(`/login?message=${signInError.message}`)
    }

    const { data: homeWorkspace, error: workspaceError } = await supabase
      .from("workspaces")
      .select("*")
      .eq("user_id", data.user.id)
      .eq("is_home", true)
      .single()

    if (!homeWorkspace) {
      throw new Error(workspaceError?.message || "Home workspace not found.")
    }

    return redirect(`/${homeWorkspace.id}/chat`)
  }

  return (
    <div className="flex w-full flex-1 flex-col justify-center gap-2 px-8 sm:max-w-md">
      <form
        className="animate-in text-foreground flex w-full flex-1 flex-col justify-center gap-2"
        action={signIn}
      >
        <Brand />

        <Label className="text-md mt-4" htmlFor="email">
          Email
        </Label>
        <Input
          className="mb-3 rounded-md border bg-inherit px-4 py-2"
          name="email"
          placeholder="you@example.com"
          required
        />

        <Label className="text-md" htmlFor="password">
          Password
        </Label>
        <Input
          className="mb-6 rounded-md border bg-inherit px-4 py-2"
          type="password"
          name="password"
          placeholder="••••••••"
        />

        <SubmitButton className="mb-2 rounded-md bg-blue-700 px-4 py-2 text-white">
          Login
        </SubmitButton>

        {searchParams?.message && (
          <p className="bg-foreground/10 text-foreground mt-4 p-4 text-center">
            {searchParams.message}
          </p>
        )}
      </form>
    </div>
  )
}
