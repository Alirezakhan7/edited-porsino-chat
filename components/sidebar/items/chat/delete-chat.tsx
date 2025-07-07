import { useChatHandler } from "@/components/chat/chat-hooks/use-chat-handler"
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
import { deleteChat } from "@/db/chats"
import useHotkey from "@/lib/hooks/use-hotkey"
import { Tables } from "@/supabase/types"
import { IconTrash } from "@tabler/icons-react"
import { FC, useContext, useRef, useState } from "react"

interface DeleteChatProps {
  chat: Tables<"chats">
}

export const DeleteChat: FC<DeleteChatProps> = ({ chat }) => {
  useHotkey("Backspace", () => setShowChatDialog(true))

  const { setChats } = useContext(ChatbotUIContext)
  const { handleNewChat } = useChatHandler()

  const buttonRef = useRef<HTMLButtonElement>(null)

  const [showChatDialog, setShowChatDialog] = useState(false)

  const handleDeleteChat = async () => {
    await deleteChat(chat.id)

    setChats(prevState => prevState.filter(c => c.id !== chat.id))

    setShowChatDialog(false)

    handleNewChat()
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter") {
      buttonRef.current?.click()
    }
  }

  return (
    <Dialog open={showChatDialog} onOpenChange={setShowChatDialog}>
      <DialogTrigger asChild>
        <IconTrash
          stroke="currentColor"
          className="text-neutral-900 transition-colors hover:text-red-500 dark:text-neutral-100 dark:hover:text-red-500"
          size={18}
        />
      </DialogTrigger>

      <DialogContent onKeyDown={handleKeyDown}>
        <DialogHeader>
          <DialogTitle>پاک کردن {chat.name}</DialogTitle>

          <DialogDescription>
            آیا مطمئن هستید که این گفت و گو پاک بشه؟
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button variant="ghost" onClick={() => setShowChatDialog(false)}>
            منصرف شدم
          </Button>

          <Button
            ref={buttonRef}
            variant="destructive"
            onClick={handleDeleteChat}
          >
            پاک کن
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
