import { IconMoon, IconSun } from "@tabler/icons-react"
import { useTheme } from "next-themes"
import { FC } from "react"
import { SIDEBAR_ICON_SIZE } from "../sidebar/sidebar-switcher"
import { Button } from "../ui/button"

interface ThemeSwitcherProps {}

export const ThemeSwitcher: FC<ThemeSwitcherProps> = () => {
  const { setTheme, theme } = useTheme()

  // The bug was caused by manually setting localStorage, which is already handled by next-themes.
  // Removing `localStorage.setItem` fixes the issue where the first click didn't work.
  const handleChange = (newTheme: "dark" | "light") => {
    setTheme(newTheme)
  }

  return (
    <Button
      className="cursor-pointer"
      variant="ghost"
      size="icon"
      onClick={() => handleChange(theme === "light" ? "dark" : "light")}
    >
      {theme === "dark" ? (
        <IconMoon size={SIDEBAR_ICON_SIZE} />
      ) : (
        <IconSun size={SIDEBAR_ICON_SIZE} />
      )}
    </Button>
  )
}
