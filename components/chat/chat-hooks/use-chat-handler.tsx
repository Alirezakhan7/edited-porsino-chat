import { ChatbotUIContext } from "@/context/context"
import { getAssistantCollectionsByAssistantId } from "@/db/assistant-collections"
import { getAssistantFilesByAssistantId } from "@/db/assistant-files"
import { getAssistantToolsByAssistantId } from "@/db/assistant-tools"
import { updateChat } from "@/db/chats"
import { getCollectionFilesByCollectionId } from "@/db/collection-files"
import { deleteMessagesIncludingAndAfter } from "@/db/messages"
import { Tables } from "@/supabase/types"
import { ChatMessage, ChatPayload, LLMID } from "@/types"
import { useRouter } from "next/navigation"
import { useContext, useEffect, useRef } from "react"
import {
  createTempMessages,
  handleCreateMessages,
  handleHostedChat,
  validateChatSettings
} from "../chat-helpers"
import { LLM_LIST } from "../../../lib/models/llm/llm-list"
export const useChatHandler = () => {
  const router = useRouter()

  const {
    userInput,
    chatFiles,
    setUserInput,
    setNewMessageImages,
    profile,
    setIsGenerating,
    setChatMessages,
    setFirstTokenReceived,
    selectedChat,
    selectedWorkspace,
    setSelectedChat,
    setChats,
    setSelectedTools,
    abortController,
    setAbortController,
    chatSettings,
    newMessageImages,
    selectedAssistant,
    chatMessages,
    chatImages,
    setChatImages,
    setChatFiles,
    setNewMessageFiles,
    setShowFilesDisplay,
    newMessageFiles,
    setToolInUse,
    setIsPromptPickerOpen,
    setIsFilePickerOpen,
    selectedPreset,
    setChatSettings,
    models,
    isPromptPickerOpen,
    isFilePickerOpen,
    isToolPickerOpen,
    setTopicSummary,
    setSuggestions
  } = useContext(ChatbotUIContext)

  const chatInputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (!isPromptPickerOpen || !isFilePickerOpen || !isToolPickerOpen) {
      chatInputRef.current?.focus()
    }
  }, [isPromptPickerOpen, isFilePickerOpen, isToolPickerOpen])

  const handleNewChat = async () => {
    if (!selectedWorkspace) return

    setUserInput("")
    setChatMessages([])
    setSelectedChat(null)

    setIsGenerating(false)
    setFirstTokenReceived(false)

    setChatFiles([])
    setChatImages([])
    setNewMessageFiles([])
    setNewMessageImages([])
    setShowFilesDisplay(false)
    setIsPromptPickerOpen(false)
    setIsFilePickerOpen(false)

    setSelectedTools([])
    setToolInUse("none")

    setTopicSummary("")
    setSuggestions([])

    if (selectedAssistant) {
      setChatSettings({
        model: selectedAssistant.model as LLMID,
        prompt: selectedAssistant.prompt,
        temperature: selectedAssistant.temperature,
        contextLength: selectedAssistant.context_length,
        includeProfileContext: selectedAssistant.include_profile_context,
        includeWorkspaceInstructions:
          selectedAssistant.include_workspace_instructions
      })

      let allFiles = []

      const assistantFiles = (
        await getAssistantFilesByAssistantId(selectedAssistant.id)
      ).files
      allFiles = [...assistantFiles]
      const assistantCollections = (
        await getAssistantCollectionsByAssistantId(selectedAssistant.id)
      ).collections
      for (const collection of assistantCollections) {
        const collectionFiles = (
          await getCollectionFilesByCollectionId(collection.id)
        ).files
        allFiles = [...allFiles, ...collectionFiles]
      }
      const assistantTools = (
        await getAssistantToolsByAssistantId(selectedAssistant.id)
      ).tools

      setSelectedTools(assistantTools)
      setChatFiles(
        allFiles.map(file => ({
          id: file.id,
          name: file.name,
          type: file.type,
          file: null
        }))
      )

      if (allFiles.length > 0) setShowFilesDisplay(true)
    } else if (selectedPreset) {
      setChatSettings({
        model: selectedPreset.model as LLMID,
        prompt: selectedPreset.prompt,
        temperature: selectedPreset.temperature,
        contextLength: selectedPreset.context_length,
        includeProfileContext: selectedPreset.include_profile_context,
        includeWorkspaceInstructions:
          selectedPreset.include_workspace_instructions
      })
    }

    return router.push(`/chat`)
  }

  const handleFocusChatInput = () => {
    chatInputRef.current?.focus()
  }

  const handleStopMessage = () => {
    if (abortController) {
      abortController.abort()
    }
  }

  const handleSendMessage = async (
    messageContent: string,
    chatMessages: ChatMessage[],
    isRegeneration: boolean
  ) => {
    const startingInput = messageContent
    try {
      setUserInput("")
      setIsGenerating(true)
      setIsPromptPickerOpen(false)
      setIsFilePickerOpen(false)
      setNewMessageImages([])
      setSuggestions([])

      const newAbortController = new AbortController()
      setAbortController(newAbortController)

      const availableModelIds = models.map(model => model.model_id)

      const modelData = [
        ...LLM_LIST, // لیستی که در مرحله قبل ساختیم
        ...models.map(model => ({
          modelId: model.model_id as LLMID,
          modelName: model.name,
          provider: "custom" as const,
          hostedId: model.id,
          platformLink: "",
          imageInput: false
        }))
      ].find(llm => llm.modelId === chatSettings?.model)

      validateChatSettings(
        chatSettings,
        modelData,
        profile,
        selectedWorkspace,
        messageContent
      )

      let currentChat = selectedChat ? { ...selectedChat } : null
      const b64Images = newMessageImages.map(image => image.base64)

      const { tempUserChatMessage, tempAssistantChatMessage } =
        createTempMessages(
          messageContent,
          chatMessages,
          chatSettings!,
          b64Images,
          isRegeneration,
          setChatMessages,
          selectedAssistant
        )

      let payload: ChatPayload = {
        chatSettings: chatSettings!,
        workspaceInstructions: selectedWorkspace!.instructions || "",
        chatMessages: isRegeneration
          ? [...chatMessages]
          : [...chatMessages, tempUserChatMessage],
        assistant: selectedChat?.assistant_id ? selectedAssistant : null
      }

      let responsePayload = await handleHostedChat(
        payload,
        profile!,
        modelData!,
        tempAssistantChatMessage,
        isRegeneration,
        newAbortController,
        newMessageImages,
        chatImages,
        setIsGenerating,
        setFirstTokenReceived,
        setChatMessages,
        setToolInUse,
        setTopicSummary,
        setSuggestions
      )

      const { generatedText, newChatId } = responsePayload

      if (!currentChat && newChatId) {
        const newlyCreatedChat: Tables<"chats"> = {
          id: newChatId,
          chat_id: newChatId,
          user_id: profile!.user_id,
          workspace_id: selectedWorkspace!.id,
          assistant_id: selectedAssistant?.id || null,
          context_length: chatSettings!.contextLength,
          include_profile_context: chatSettings!.includeProfileContext,
          include_workspace_instructions:
            chatSettings!.includeWorkspaceInstructions,
          model: chatSettings!.model,
          name: messageContent.substring(0, 100),
          prompt: chatSettings!.prompt,
          temperature: chatSettings!.temperature,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          folder_id: null,
          sharing: "private"
        }

        setSelectedChat(newlyCreatedChat)
        setChats(chats => [newlyCreatedChat, ...chats])
        currentChat = newlyCreatedChat
      } else if (currentChat) {
        const updatedChat = await updateChat(currentChat.id, {
          updated_at: new Date().toISOString()
        })
        setChats(prevChats =>
          prevChats.map(prevChat =>
            prevChat.id === updatedChat.id ? updatedChat : prevChat
          )
        )
      }

      tempUserChatMessage.message.chat_id = currentChat!.id
      tempAssistantChatMessage.message.chat_id = currentChat!.id

      await handleCreateMessages(
        isRegeneration
          ? chatMessages
          : [...chatMessages, tempUserChatMessage, tempAssistantChatMessage],
        currentChat!,
        profile!,
        modelData!,
        generatedText,
        newMessageImages,
        isRegeneration,
        setChatMessages,
        setChatImages,
        selectedAssistant
      )

      setIsGenerating(false)
      setFirstTokenReceived(false)
    } catch (error) {
      console.error(error)
      setIsGenerating(false)
      setFirstTokenReceived(false)
      setUserInput(startingInput)
    }
  }

  const handleSendEdit = async (
    editedContent: string,
    sequenceNumber: number
  ) => {
    if (!selectedChat) return

    await deleteMessagesIncludingAndAfter(
      selectedChat.user_id,
      selectedChat.id,
      sequenceNumber
    )

    const filteredMessages = chatMessages.filter(
      chatMessage => chatMessage.message.sequence_number < sequenceNumber
    )

    setChatMessages(filteredMessages)

    handleSendMessage(editedContent, filteredMessages, false)
  }

  return {
    chatInputRef,
    handleNewChat,
    handleSendMessage,
    handleFocusChatInput,
    handleStopMessage,
    handleSendEdit
  }
}
