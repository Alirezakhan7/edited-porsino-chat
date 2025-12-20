import AppShell from "@/components/layout/AppShell"

export default function PathLayout({
  children
}: {
  children: React.ReactNode
}) {
  return <AppShell>{children}</AppShell>
}
