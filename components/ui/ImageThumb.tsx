// src/components/ui/ImageThumb.tsx
import React from "react"

type Props = {
  src: string
  uploading?: boolean
}

export function ImageThumb({ src, uploading }: Props) {
  return (
    <div className="relative size-28 overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
      <img
        src={src}
        alt="Uploaded thumbnail"
        className="size-full object-cover"
      />
      {uploading && (
        <div className="absolute inset-0 grid place-items-center bg-black/40">
          {/* دایره در حال چرخش */}
          <div className="size-8 animate-spin rounded-full border-4 border-white/30 border-t-white" />
        </div>
      )}
    </div>
  )
}
