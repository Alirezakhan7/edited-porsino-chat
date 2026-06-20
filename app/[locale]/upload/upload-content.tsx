// app/[locale]/upload/upload-content.tsx
import { MOCK_USER_ID } from "@/lib/mock/data"
import UploadClient from "./upload-client"

export default async function UploadContent({
  locale: _locale
}: {
  locale: string
}) {
  return (
    <UploadClient
      initialDueCards={[]}
      initialAllCards={[]}
      userId={MOCK_USER_ID}
    />
  )
}
