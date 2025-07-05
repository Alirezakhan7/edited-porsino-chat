import { FC, ReactNode, useEffect, useState } from "react"
import { createPortal } from "react-dom"

interface PortalProps {
  children: ReactNode
}

const Portal: FC<PortalProps> = ({ children }) => {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])

  return mounted
    ? createPortal(
        children,
        document.querySelector("#portals") || document.body
      )
    : null
}

export default Portal
