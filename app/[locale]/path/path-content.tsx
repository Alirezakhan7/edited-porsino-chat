// app/[locale]/path/path-content.tsx

import PathClient from "./path-client"

export default async function PathContent({ locale }: { locale: string }) {
  return <PathClient locale={locale} initialUserSteps={{}} />
}
