import AppShell from "@/components/layout/AppShell"
import { MOCK_WORKSPACE } from "@/lib/mock/data"

export default async function ChatLayout({
  children
}: {
  children: React.ReactNode
}) {
  return <AppShell workspaceData={MOCK_WORKSPACE}>{children}</AppShell>
}
