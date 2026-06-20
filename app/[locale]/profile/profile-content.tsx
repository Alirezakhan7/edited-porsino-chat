import { MOCK_CHATS, MOCK_PROFILE } from "@/lib/mock/data"
import ProfileClient from "./profile-client"

export default async function ProfileContent({
  locale: _locale
}: {
  locale: string
}) {
  const stats = {
    testsCompleted: 0,
    streakDays: 0,
    accuracy: 0,
    flashcardsCount: 0,
    chatsCount: MOCK_CHATS.length,
    tokenLimit: 10000,
    tokenUsed: 0
  }

  return <ProfileClient initialProfile={MOCK_PROFILE} stats={stats} />
}
