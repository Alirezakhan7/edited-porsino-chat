// app/[locale]/upload/upload-content.tsx
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import UploadClient, { Flashcard } from "./upload-client"

export default async function UploadContent({ locale }: { locale: string }) {
  const supabase = await createClient()

  const {
    data: { user }
  } = await supabase.auth.getUser()

  if (!user) {
    redirect(`/${locale}/login`)
  }

  const now = new Date().toISOString()

  // دریافت همزمان کارت‌های امروز و آرشیو (بسیار سریع‌تر از useEffect)
  const [dueCardsResult, allCardsResult] = await Promise.all([
    supabase
      .from("leitner_box")
      .select("*")
      .eq("user_id", user.id)
      .lte("next_review_at", now)
      .order("next_review_at", { ascending: true }),

    supabase
      .from("leitner_box")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
  ])

  const dueCards = (dueCardsResult.data || []) as Flashcard[]
  const allCards = (allCardsResult.data || []) as Flashcard[]

  return (
    <UploadClient
      initialDueCards={dueCards}
      initialAllCards={allCards}
      userId={user.id}
    />
  )
}
