// app/[locale]/upload/upload-client.tsx
"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { createClient } from "@/lib/supabase/client"
import {
  IconPlus,
  IconCheck,
  IconX,
  IconBrain,
  IconCards,
  IconPencil,
  IconTrash,
  IconList,
  IconId,
  IconSearch,
  IconCalendar,
  IconSchool,
  IconStack2
} from "@tabler/icons-react"
import confetti from "canvas-confetti"
import { MaterialCard, RippleButton } from "@/components/material/MaterialUI"

// تعریف اینترفیس دیتابیس
export interface Flashcard {
  id: string
  flashcard_front: string
  flashcard_back: string
  box_level: number
  next_review_at: string
}

const BOX_INTERVALS = [1, 3, 7, 15, 30]

interface UploadClientProps {
  initialDueCards: Flashcard[]
  initialAllCards: Flashcard[]
  userId: string
}

export default function UploadClient({
  initialDueCards,
  initialAllCards,
  userId
}: UploadClientProps) {
  const supabase = createClient()

  // --- State های اصلی ---
  // نکته: مقادیر اولیه را از پراپ‌ها می‌گیریم (سرعت بالا)
  const [viewMode, setViewMode] = useState<"review" | "list">("review")
  const [cards, setCards] = useState<Flashcard[]>(initialDueCards)
  const [allCards, setAllCards] = useState<Flashcard[]>(initialAllCards)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)

  // --- State های مودال ---
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingCard, setEditingCard] = useState<Flashcard | null>(null)
  const [frontInput, setFrontInput] = useState("")
  const [backInput, setBackInput] = useState("")
  const [isSaving, setIsSaving] = useState(false)

  // --- State جستجو ---
  const [searchQuery, setSearchQuery] = useState("")

  // هندل کردن مرور (Review)
  const handleReview = async (known: boolean) => {
    const currentCard = cards[currentIndex]
    let newBoxLevel = currentCard.box_level
    const nextReviewDate = new Date()

    if (known) {
      newBoxLevel = Math.min(newBoxLevel + 1, 5)
      const daysToAdd = BOX_INTERVALS[newBoxLevel - 1] || 30
      nextReviewDate.setDate(nextReviewDate.getDate() + daysToAdd)
      if (navigator.vibrate) navigator.vibrate(50)
    } else {
      newBoxLevel = 1
      nextReviewDate.setDate(nextReviewDate.getDate() + 1)
      if (navigator.vibrate) navigator.vibrate([100, 50, 100])
    }

    // آپدیت در دیتابیس (بدون await برای سرعت UI)
    supabase
      .from("leitner_box")
      .update({
        box_level: newBoxLevel,
        next_review_at: nextReviewDate.toISOString()
      })
      .eq("id", currentCard.id)
      .then()

    if (currentIndex < cards.length - 1) {
      setIsFlipped(false)
      setTimeout(() => setCurrentIndex(prev => prev + 1), 300)
    } else {
      confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } })
      setCards([]) // خالی کردن لیست
    }
  }

  // باز کردن مودال
  const openModal = (cardToEdit?: Flashcard) => {
    if (cardToEdit) {
      setEditingCard(cardToEdit)
      setFrontInput(cardToEdit.flashcard_front)
      setBackInput(cardToEdit.flashcard_back)
    } else {
      setEditingCard(null)
      setFrontInput("")
      setBackInput("")
    }
    setIsModalOpen(true)
  }

  // ذخیره کارت
  const handleSaveCard = async () => {
    if (!frontInput.trim() || !backInput.trim()) return
    setIsSaving(true)

    if (editingCard) {
      // آپدیت کارت موجود
      await supabase
        .from("leitner_box")
        .update({ flashcard_front: frontInput, flashcard_back: backInput })
        .eq("id", editingCard.id)

      // آپدیت استیت محلی (Optimistic UI)
      const updater = (prev: Flashcard[]) =>
        prev.map(c =>
          c.id === editingCard.id
            ? { ...c, flashcard_front: frontInput, flashcard_back: backInput }
            : c
        )
      setCards(updater)
      setAllCards(updater)
    } else {
      // کارت جدید
      const newCardTemp = {
        user_id: userId,
        flashcard_front: frontInput,
        flashcard_back: backInput,
        box_level: 1,
        source_chunk_uid: "manual"
      }

      const { data } = await supabase
        .from("leitner_box")
        .insert(newCardTemp)
        .select()
        .single()

      if (data) {
        setCards(prev => [...prev, data])
        setAllCards(prev => [data, ...prev])
      }
    }
    setIsModalOpen(false)
    setFrontInput("")
    setBackInput("")
    setIsSaving(false)
  }

  // حذف کارت
  const handleDeleteCard = async (cardId: string) => {
    if (!confirm("آیا از حذف این کارت مطمئن هستید؟")) return

    setCards(prev => prev.filter(c => c.id !== cardId))
    setAllCards(prev => prev.filter(c => c.id !== cardId))

    if (viewMode === "review") {
      if (cards.length <= 1) setCurrentIndex(0)
      setIsFlipped(false)
    }

    await supabase.from("leitner_box").delete().eq("id", cardId)
  }

  const filteredAllCards = allCards.filter(
    c =>
      c.flashcard_front.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.flashcard_back.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
      {/* سایدبار دسکتاپ */}
      <aside className="hidden space-y-6 lg:sticky lg:top-24 lg:col-span-4 lg:block lg:h-fit">
        <MaterialCard className="p-6">
          <h3 className="mb-4 text-lg font-bold text-slate-800 dark:text-white">
            وضعیت مطالعه
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-2xl bg-blue-50 p-3 dark:bg-blue-900/20">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-blue-200 p-2 text-blue-700 dark:bg-blue-800 dark:text-white">
                  <IconBrain size={20} />
                </div>
                <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
                  مرور امروز
                </span>
              </div>
              <span className="text-xl font-black text-slate-900 dark:text-white">
                {cards.length}
              </span>
            </div>

            <div className="flex items-center justify-between rounded-2xl bg-purple-50 p-3 dark:bg-purple-900/20">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-purple-200 p-2 text-purple-700 dark:bg-purple-800 dark:text-white">
                  <IconStack2 size={20} />
                </div>
                <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
                  کل کارت‌ها
                </span>
              </div>
              <span className="text-xl font-black text-slate-900 dark:text-white">
                {allCards.length || "-"}
              </span>
            </div>
          </div>

          <div className="mt-8 border-t border-slate-200 pt-6 dark:border-slate-800">
            <h4 className="mb-3 text-sm font-bold text-slate-500">
              حالت نمایش
            </h4>
            <div className="flex gap-2 rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
              <button
                onClick={() => setViewMode("review")}
                className={`flex-1 rounded-lg py-2 text-sm font-bold transition-all ${viewMode === "review" ? "bg-white text-blue-600 shadow-sm dark:bg-slate-700 dark:text-blue-300" : "text-slate-500 hover:text-slate-700 dark:text-slate-400"}`}
              >
                مرور کارت
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`flex-1 rounded-lg py-2 text-sm font-bold transition-all ${viewMode === "list" ? "bg-white text-blue-600 shadow-sm dark:bg-slate-700 dark:text-blue-300" : "text-slate-500 hover:text-slate-700 dark:text-slate-400"}`}
              >
                لیست آرشیو
              </button>
            </div>
          </div>
        </MaterialCard>
      </aside>

      {/* بخش اصلی */}
      <section className="lg:col-span-8">
        {/* هدر و کنترل‌های موبایل */}
        <div className="mb-6 flex w-full items-center justify-between md:hidden">
          <div>
            <h1 className="text-2xl font-black text-slate-800 dark:text-white">
              {viewMode === "review" ? "مرور روزانه 🧠" : "آرشیو کارت‌ها 🗂️"}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {viewMode === "review"
                ? `${cards.length} کارت برای امروز`
                : `${allCards.length} کارت کل`}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() =>
                setViewMode(prev => (prev === "review" ? "list" : "review"))
              }
              className="rounded-xl border border-white/20 bg-white/50 p-3 text-slate-600 shadow-sm backdrop-blur-md dark:bg-slate-800/50 dark:text-slate-300"
            >
              {viewMode === "review" ? (
                <IconList size={20} />
              ) : (
                <IconId size={20} />
              )}
            </button>
            <button
              onClick={() => openModal()}
              className="rounded-xl bg-blue-600 p-3 text-white shadow-md shadow-blue-500/20"
            >
              <IconPlus size={20} />
            </button>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {/* حالت مرور */}
          {viewMode === "review" && (
            <motion.div
              key="review"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="flex w-full flex-col items-center justify-center"
            >
              {cards.length === 0 ? (
                <MaterialCard className="flex w-full flex-col items-center justify-center p-10 text-center">
                  <div className="mb-6 rounded-full bg-emerald-100 p-8 ring-4 ring-emerald-50 dark:bg-emerald-900/30 dark:ring-emerald-900/10">
                    <IconBrain
                      size={80}
                      className="text-emerald-600 dark:text-emerald-400"
                    />
                  </div>
                  <h2 className="mb-2 text-2xl font-black text-slate-800 dark:text-white">
                    آفرین! تموم شد 🎉
                  </h2>
                  <p className="mb-8 max-w-sm text-slate-500 dark:text-slate-400">
                    تمام کارت‌های امروز را مرور کردی.
                  </p>
                  <RippleButton
                    onClick={() => setViewMode("list")}
                    className="bg-slate-200 !text-slate-800 hover:bg-slate-300 dark:bg-slate-700 dark:!text-white"
                  >
                    مشاهده آرشیو کارت‌ها
                  </RippleButton>
                </MaterialCard>
              ) : (
                <div className="relative mx-auto w-full max-w-lg lg:max-w-2xl">
                  {/* ابزارهای ادیت */}
                  <div className="mb-4 flex w-full justify-end gap-2 px-1">
                    <button
                      onClick={() => openModal(cards[currentIndex])}
                      className="rounded-full bg-white/50 p-2 text-slate-500 transition-colors hover:text-blue-600 dark:bg-slate-800/50 dark:text-slate-400"
                    >
                      <IconPencil size={18} />
                    </button>
                    <button
                      onClick={() => handleDeleteCard(cards[currentIndex].id)}
                      className="rounded-full bg-white/50 p-2 text-slate-500 transition-colors hover:text-red-600 dark:bg-slate-800/50 dark:text-slate-400"
                    >
                      <IconTrash size={18} />
                    </button>
                  </div>

                  {/* کارت سه‌بعدی */}
                  <div className="perspective-1000 relative h-[450px] w-full md:h-[500px]">
                    <motion.div
                      className="transform-style-3d relative size-full transition-all duration-500"
                      animate={{ rotateY: isFlipped ? 180 : 0 }}
                      transition={{
                        type: "spring",
                        stiffness: 260,
                        damping: 20
                      }}
                    >
                      {/* رو */}
                      <MaterialCard className="backface-hidden absolute inset-0 flex flex-col items-center justify-center border-b-4 border-blue-200 bg-gradient-to-br from-white to-blue-50 p-8 text-center dark:border-blue-900 dark:from-slate-800 dark:to-slate-900">
                        <span className="absolute top-6 rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-600 dark:bg-blue-900/50 dark:text-blue-300">
                          جعبه {cards[currentIndex].box_level}
                        </span>
                        <p className="text-xl font-bold leading-relaxed text-slate-800 md:text-2xl dark:text-white">
                          {cards[currentIndex].flashcard_front}
                        </p>
                        <p className="absolute bottom-8 animate-pulse text-xs text-slate-400 dark:text-slate-500">
                          برای مشاهده پاسخ کلیک کنید
                        </p>
                        <div
                          className="absolute inset-0 z-10 cursor-pointer"
                          onClick={() => setIsFlipped(true)}
                        />
                      </MaterialCard>

                      {/* پشت */}
                      <MaterialCard className="backface-hidden rotate-y-180 absolute inset-0 flex flex-col items-center justify-between border-b-4 border-purple-200 bg-white p-8 text-center dark:border-purple-900 dark:bg-slate-900">
                        <div className="custom-scrollbar flex w-full flex-1 flex-col items-center justify-center overflow-y-auto">
                          <span className="mb-4 rounded-full bg-purple-100 px-3 py-1 text-xs font-bold text-purple-600 dark:bg-purple-900/50 dark:text-purple-300">
                            پاسخ صحیح
                          </span>
                          <p className="text-lg font-medium leading-relaxed text-slate-700 md:text-xl dark:text-slate-200">
                            {cards[currentIndex].flashcard_back}
                          </p>
                        </div>
                        <div className="flex w-full gap-4 pt-6">
                          <button
                            onClick={e => {
                              e.stopPropagation()
                              handleReview(false)
                            }}
                            className="flex flex-1 flex-col items-center gap-2 rounded-2xl bg-red-50 py-4 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400"
                          >
                            <IconX size={24} />{" "}
                            <span className="text-sm font-bold">بلد نبودم</span>
                          </button>
                          <button
                            onClick={e => {
                              e.stopPropagation()
                              handleReview(true)
                            }}
                            className="flex flex-1 flex-col items-center gap-2 rounded-2xl bg-emerald-500 py-4 text-white shadow-lg shadow-emerald-500/30 hover:bg-emerald-600"
                          >
                            <IconCheck size={24} />{" "}
                            <span className="text-sm font-bold">یادم بود</span>
                          </button>
                        </div>
                      </MaterialCard>
                    </motion.div>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* حالت لیست */}
          {viewMode === "list" && (
            <motion.div
              key="list"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="relative">
                <IconSearch
                  className="absolute right-4 top-4 text-slate-400"
                  size={20}
                />
                <input
                  type="text"
                  placeholder="جستجو در کارت‌ها..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-white py-4 pl-4 pr-12 text-sm shadow-sm outline-none focus:border-blue-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                />
              </div>
              <div className="grid grid-cols-1 gap-4 pb-20 md:grid-cols-2">
                {filteredAllCards.length === 0 ? (
                  <div className="col-span-full py-20 text-center text-slate-400">
                    کارتی پیدا نشد.
                  </div>
                ) : (
                  filteredAllCards.map(card => (
                    <div
                      key={card.id}
                      className="group relative overflow-hidden rounded-3xl border border-slate-200 bg-white/60 p-5 shadow-sm hover:shadow-lg dark:border-slate-800 dark:bg-slate-900/60"
                    >
                      <div className="mb-3 flex items-start justify-between">
                        <span className="rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-600 dark:bg-blue-900/30 dark:text-blue-300">
                          جعبه {card.box_level}
                        </span>
                        <div className="flex gap-2 opacity-100 transition lg:opacity-0 lg:group-hover:opacity-100">
                          <button onClick={() => openModal(card)}>
                            <IconPencil
                              className="text-slate-400 hover:text-blue-500"
                              size={18}
                            />
                          </button>
                          <button onClick={() => handleDeleteCard(card.id)}>
                            <IconTrash
                              className="text-slate-400 hover:text-red-500"
                              size={18}
                            />
                          </button>
                        </div>
                      </div>
                      <h4 className="mb-2 line-clamp-1 text-base font-bold text-slate-800 dark:text-white">
                        {card.flashcard_front}
                      </h4>
                      <p className="line-clamp-2 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                        {card.flashcard_back}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* مودال */}
      <AnimatePresence>
        {isModalOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm dark:bg-black/70"
            />
            <motion.div
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0 }}
              className="fixed inset-x-0 bottom-0 z-50 mx-auto w-full max-w-lg rounded-t-[2.5rem] border-t border-slate-100 bg-white p-6 pb-8 shadow-2xl dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="mx-auto mb-6 h-1.5 w-16 rounded-full bg-slate-200 dark:bg-slate-700" />
              <h3 className="mb-6 flex items-center gap-3 text-xl font-bold text-slate-800 dark:text-white">
                <div className="rounded-xl bg-blue-100 p-2 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                  <IconCards size={24} />
                </div>
                {editingCard ? "ویرایش کارت" : "کارت جدید"}
              </h3>
              <div className="space-y-5">
                <div>
                  <label className="mb-2 block text-xs font-bold text-slate-500">
                    سوال
                  </label>
                  <textarea
                    value={frontInput}
                    onChange={e => setFrontInput(e.target.value)}
                    className="w-full rounded-2xl bg-slate-50 p-4 text-sm font-medium dark:bg-slate-800"
                    rows={2}
                    placeholder="سوال..."
                  />
                </div>
                <div>
                  <label className="mb-2 block text-xs font-bold text-slate-500">
                    جواب
                  </label>
                  <textarea
                    value={backInput}
                    onChange={e => setBackInput(e.target.value)}
                    className="w-full rounded-2xl bg-slate-50 p-4 text-sm font-medium dark:bg-slate-800"
                    rows={3}
                    placeholder="پاسخ..."
                  />
                </div>
                <RippleButton
                  onClick={handleSaveCard}
                  className="mt-2 w-full bg-blue-600 text-white shadow-lg"
                >
                  {isSaving ? "در حال ذخیره..." : "ذخیره تغییرات"}
                </RippleButton>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <style jsx global>{`
        .perspective-1000 {
          perspective: 1000px;
        }
        .transform-style-3d {
          transform-style: preserve-3d;
        }
        .backface-hidden {
          backface-visibility: hidden;
        }
        .rotate-y-180 {
          transform: rotateY(180deg);
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: rgba(156, 163, 175, 0.5);
          border-radius: 20px;
        }
      `}</style>
    </div>
  )
}
