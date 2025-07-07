import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog"
import { ChatbotUIContext } from "@/context/context"
import { deleteFolder } from "@/db/folders"
import { supabase } from "@/lib/supabase/browser-client"
import { Tables } from "@/supabase/types"
import { ContentType } from "@/types"
import { IconTrash } from "@tabler/icons-react"
import { FC, useContext, useRef, useState } from "react"
import { toast } from "sonner"

interface DeleteFolderProps {
  folder: Tables<"folders">
  contentType: ContentType
}

export const DeleteFolder: FC<DeleteFolderProps> = ({
  folder,
  contentType
}) => {
  const {
    setChats,
    setFolders,
    setPresets,
    setPrompts,
    setFiles,
    setCollections,
    setAssistants,
    setTools,
    setModels
  } = useContext(ChatbotUIContext)

  const buttonRef = useRef<HTMLButtonElement>(null)

  const [showFolderDialog, setShowFolderDialog] = useState(false)

  const stateUpdateFunctions = {
    chats: setChats,
    presets: setPresets,
    prompts: setPrompts,
    files: setFiles,
    collections: setCollections,
    assistants: setAssistants,
    tools: setTools,
    models: setModels
  }

  const handleDeleteFolderOnly = async () => {
    await deleteFolder(folder.id)

    setFolders(prevState => prevState.filter(c => c.id !== folder.id))

    setShowFolderDialog(false)

    const setStateFunction = stateUpdateFunctions[contentType]

    if (!setStateFunction) return

    setStateFunction((prevItems: any) =>
      prevItems.map((item: any) => {
        if (item.folder_id === folder.id) {
          return {
            ...item,
            folder_id: null
          }
        }

        return item
      })
    )
  }

  const handleDeleteFolderAndItems = async () => {
    const setStateFunction = stateUpdateFunctions[contentType]

    if (!setStateFunction) return

    const { error } = await supabase
      .from(contentType)
      .delete()
      .eq("folder_id", folder.id)

    if (error) {
      toast.error(error.message)
    }

    setStateFunction((prevItems: any) =>
      prevItems.filter((item: any) => item.folder_id !== folder.id)
    )

    handleDeleteFolderOnly()
  }

  return (
    <Dialog open={showFolderDialog} onOpenChange={setShowFolderDialog}>
      <DialogTrigger asChild>
        <IconTrash className="text-neutral-900 transition-colors hover:text-red-500 dark:text-neutral-200 dark:hover:text-red-500" />
      </DialogTrigger>

      <DialogContent className="min-w-[550px]">
        <DialogHeader>
          <DialogTitle>پاک کردن {folder.name}</DialogTitle>

          <DialogDescription>آیا مطمئنی که این پوشه پاک بشه؟</DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button variant="ghost" onClick={() => setShowFolderDialog(false)}>
            منصرف شدم
          </Button>

          <Button
            ref={buttonRef}
            variant="destructive"
            onClick={handleDeleteFolderAndItems}
          >
            پوشه و فایل های داخلش را پاک کن
          </Button>

          <Button
            ref={buttonRef}
            variant="destructive"
            onClick={handleDeleteFolderOnly}
          >
            فقط پوشه را پاک کن
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
