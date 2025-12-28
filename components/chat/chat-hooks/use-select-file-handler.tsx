import { ChatbotUIContext } from "@/context/context"
import { LLM_LIST } from "@/lib/models/llm/llm-list"
import { useContext, useEffect, useState } from "react"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"
import { v4 as uuidv4 } from "uuid"

// ❌ دیگر heic2any را اینجا import نمی‌کنیم چون به صورت پویا لود می‌شود

export const ACCEPTED_FILE_TYPES = [
  "text/csv",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/json",
  "text/markdown",
  "application/pdf",
  "text/plain"
].join(",")

const processAndCompressImage = (file: File): Promise<File> => {
  return new Promise(async (resolve, reject) => {
    let fileToProcess = file
    const isHeic =
      file.type === "image/heic" ||
      file.type === "image/heif" ||
      file.name.toLowerCase().endsWith(".heic")
    if (isHeic) {
      try {
        toast.info("Converting HEIC image...")
        const { default: heic2any } = await import("heic2any")
        const convertedBlob = await heic2any({
          blob: file,
          toType: "image/jpeg",
          quality: 0.9
        })
        const finalBlob = Array.isArray(convertedBlob)
          ? convertedBlob[0]
          : convertedBlob
        fileToProcess = new File(
          [finalBlob],
          file.name.replace(/\.[^/.]+$/, ".jpg"),
          { type: "image/jpeg" }
        )
      } catch (error) {
        return reject(new Error("Failed to convert HEIC image."))
      }
    }
    try {
      const bmp = await createImageBitmap(fileToProcess)
      const canvas = document.createElement("canvas")
      let { width, height } = bmp
      const maxWidth = 1920
      const maxHeight = 1080
      if (width > height) {
        if (width > maxWidth) {
          height *= maxWidth / width
          width = maxWidth
        }
      } else {
        if (height > maxHeight) {
          width *= maxHeight / height
          height = maxHeight
        }
      }
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext("2d")
      ctx!.drawImage(bmp, 0, 0, width, height)
      bmp.close()
      canvas.toBlob(
        blob => {
          if (!blob) return reject(new Error("Canvas to Blob failed."))
          const compressedFile = new File([blob], fileToProcess.name, {
            type: "image/jpeg",
            lastModified: Date.now()
          })
          resolve(compressedFile)
        },
        "image/jpeg",
        0.85
      )
    } catch (error) {
      reject(new Error("Failed to process image with createImageBitmap."))
    }
  })
}

export const useSelectFileHandler = () => {
  const {
    selectedWorkspace,
    profile,
    chatSettings,
    setNewMessageImages,
    setNewMessageFiles,
    setShowFilesDisplay,
    setUseRetrieval,
    setIsUploadingFiles
  } = useContext(ChatbotUIContext)

  const [filesToAccept, setFilesToAccept] = useState(ACCEPTED_FILE_TYPES)

  useEffect(() => {
    handleFilesToAccept()
  }, [chatSettings?.model])

  const handleFilesToAccept = () => {
    const model = chatSettings?.model
    const FULL_MODEL = LLM_LIST.find(llm => llm.modelId === model)
    if (!FULL_MODEL) return
    setFilesToAccept(
      FULL_MODEL.imageInput
        ? `${ACCEPTED_FILE_TYPES},image/*,image/heic,image/heif`
        : ACCEPTED_FILE_TYPES
    )
  }

  const handleSelectDeviceFile = async (file: File) => {
    if (!profile || !selectedWorkspace) return
    const MAX_FILE_SIZE_MB = 5
    const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024
    if (file.size > MAX_FILE_SIZE_BYTES) {
      toast.error(
        ".حجم فایل انتخابی بیش از حد مجاز است. حداکثر حجم مجاز ۵ مگابایت می‌باشد"
      )
      return
    }
    setShowFilesDisplay(true)
    setUseRetrieval(true)
    const isImage =
      file.type.includes("image") || file.name.toLowerCase().endsWith(".heic")
    const isPdf = file.type === "application/pdf"
    if (isImage) {
      await handleImageFile(file)
    } else if (isPdf) {
      await handlePdfFile(file)
    } else {
      toast.error(`Unsupported file type: ${file.type}`)
    }
  }

  const handleImageFile = async (file: File) => {
    const tempId = uuidv4()
    const localUrl = URL.createObjectURL(file)
    setIsUploadingFiles(true)
    setNewMessageImages(prev => [
      ...prev,
      {
        messageId: tempId,
        path: "",
        base64: null,
        url: localUrl,
        file,
        isUploading: true
      }
    ])

    try {
      const processedFile = await processAndCompressImage(file)
      const supabase = createClient()
      const fileName = `${uuidv4()}.jpeg`
      const filePath = `${profile!.user_id}/${fileName}`
      const { error: uploadError } = await supabase.storage
        .from("uploads")
        .upload(filePath, processedFile, {
          cacheControl: "604800",
          contentType: "image/jpeg"
        })
      if (uploadError) throw uploadError
      const { data: signedUrlData, error: signedUrlError } =
        await supabase.storage
          .from("uploads")
          .createSignedUrl(filePath, 60 * 60 * 24 * 7)
      if (signedUrlError) throw signedUrlError
      setNewMessageImages(prev =>
        prev.map(item =>
          item.messageId === tempId
            ? {
                ...item,
                path: filePath,
                url: signedUrlData!.signedUrl,
                isUploading: false
              }
            : item
        )
      )
      URL.revokeObjectURL(localUrl)
    } catch (error: any) {
      toast.error(`Image upload failed: ${error.message}`)
      setNewMessageImages(prev =>
        prev.filter(item => item.messageId !== tempId)
      )
    } finally {
      setIsUploadingFiles(false)
    }
  }

  const handlePdfFile = async (file: File) => {
    const tempId = uuidv4()
    setIsUploadingFiles(true)
    setNewMessageFiles(prev => [
      ...prev,
      {
        id: tempId,
        name: file.name,
        type: file.type,
        file: file,
        isUploading: true
      }
    ])

    try {
      const supabase = createClient()
      const fileName = `${uuidv4()}-${file.name}`
      const filePath = `${profile!.user_id}/${fileName}`
      const { error } = await supabase.storage
        .from("uploads")
        .upload(filePath, file, {
          cacheControl: "604800", // کش برای فایل‌های PDF
          contentType: "application/pdf"
        })
      if (error) throw error
      setNewMessageFiles(prev =>
        prev.map(item =>
          item.id === tempId
            ? { ...item, path: filePath, isUploading: false }
            : item
        )
      )
      toast.success("PDF file uploaded successfully!")
    } catch (error: any) {
      toast.error(`PDF upload failed: ${error.message}`)
      setNewMessageFiles(prev => prev.filter(item => item.id !== tempId))
    } finally {
      setIsUploadingFiles(false)
    }
  }

  return {
    handleSelectDeviceFile,
    filesToAccept
  }
}
