export interface MessageImage {
  messageId: string
  path: string | null
  base64?: string | null
  url: string
  file: File | null
  isUploading?: boolean // ✅ این خط را اضافه کنید
}
