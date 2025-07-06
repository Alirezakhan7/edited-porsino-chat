import { IconMoon, IconSun } from "@tabler/icons-react"
import { useTheme } from "next-themes"
import { FC, useEffect, useState } from "react"
import { SIDEBAR_ICON_SIZE } from "../sidebar/sidebar-switcher"
import { Button } from "../ui/button"

interface ThemeSwitcherProps {}

export const ThemeSwitcher: FC<ThemeSwitcherProps> = () => {
  const { setTheme, theme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // وقتی component در کلاینت mount شد، این مقدار true میشه
  useEffect(() => {
    setMounted(true)
  }, [])

  // قبل از mount چیزی رندر نکن
  if (!mounted) return null

  return (
    <Button
      className="cursor-pointer"
      variant="ghost"
      size="icon"
      onClick={() => setTheme(theme === "light" ? "dark" : "light")}
    >
      {theme === "dark" ? (
        <IconMoon size={SIDEBAR_ICON_SIZE} />
      ) : (
        <IconSun size={SIDEBAR_ICON_SIZE} />
      )}
    </Button>
  )
}
