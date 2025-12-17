"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { createClient } from "@/lib/supabase/client"
import {
  IconPlus,
  IconCheck,
  IconX,
  IconRotate,
  IconBrain,
  IconCards,
  IconPencil,
  IconTrash,
  IconList,
  IconId,
  IconSearch,
  IconCalendar
} from "@tabler/icons-react"
import confetti from "canvas-confetti"
import { MaterialCard, RippleButton } from "@/components/material/MaterialUI"
import { useRouter } from "next/navigation"

// اینترفیس دیتابیس
interface Flashcard {
  id: string
  flashcard_front: string
  flashcard_back: string
  box_level: number
  next_review_at: string
}

const BOX_INTERVALS = [1, 3, 7, 15, 30]

export default function LeitnerPage() {
  const supabase = createClient()

  // --- State های اصلی ---
  const [viewMode, setViewMode] = useState<"review" | "list">("review") // حالت نمایش: مرور یا لیست
  const [cards, setCards] = useState<Flashcard[]>([]) // کارت‌های مرور
  const [allCards, setAllCards] = useState<Flashcard[]>([]) // لیست تمام کارت‌ها
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [loading, setLoading] = useState(true)

  // --- State های مودال ---
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingCard, setEditingCard] = useState<Flashcard | null>(null)
  const [frontInput, setFrontInput] = useState("")
  const [backInput, setBackInput] = useState("")
  const [isSaving, setIsSaving] = useState(false)

  // --- State جستجو در لیست ---
  const [searchQuery, setSearchQuery] = useState("")

  // لود اولیه
  useEffect(() => {
    fetchDueCards()
  }, [])

  // اگر کاربر رفت روی حالت لیست، همه کارت‌ها را لود کن
  useEffect(() => {
    if (viewMode === "list") {
      fetchAllCards()
    }
  }, [viewMode])

  // 1. دریافت کارت‌های مرور (امروز)
  async function fetchDueCards() {
    setLoading(true)
    const {
      data: { user }
    } = await supabase.auth.getUser()
    if (!user) return

    const now = new Date().toISOString()
    const { data } = await supabase
      .from("leitner_box")
      .select("*")
      .eq("user_id", user.id)
      .lte("next_review_at", now)
      .order("next_review_at", { ascending: true })

    if (data) setCards(data)
    setLoading(false)
  }

  // 2. دریافت تمام کارت‌ها (برای آرشیو)
  async function fetchAllCards() {
    const {
      data: { user }
    } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase
      .from("leitner_box")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })

    if (data) setAllCards(data)
  }

  // 3. هندل کردن مرور
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
      setCards([])
    }
  }

  // 4. باز کردن مودال
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

  // 5. ذخیره کارت
  const handleSaveCard = async () => {
    if (!frontInput.trim() || !backInput.trim()) return
    setIsSaving(true)
    const {
      data: { user }
    } = await supabase.auth.getUser()

    if (user) {
      if (editingCard) {
        // آپدیت
        await supabase
          .from("leitner_box")
          .update({
            flashcard_front: frontInput,
            flashcard_back: backInput
          })
          .eq("id", editingCard.id)

        // آپدیت لیست‌های لوکال
        setCards(prev =>
          prev.map(c =>
            c.id === editingCard.id
              ? { ...c, flashcard_front: frontInput, flashcard_back: backInput }
              : c
          )
        )
        setAllCards(prev =>
          prev.map(c =>
            c.id === editingCard.id
              ? { ...c, flashcard_front: frontInput, flashcard_back: backInput }
              : c
          )
        )
      } else {
        // ایجاد جدید
        await supabase.from("leitner_box").insert({
          user_id: user.id,
          flashcard_front: frontInput,
          flashcard_back: backInput,
          box_level: 1,
          source_chunk_uid: "manual"
        })
        fetchDueCards()
        if (viewMode === "list") fetchAllCards()
      }
      setIsModalOpen(false)
      setFrontInput("")
      setBackInput("")
    }
    setIsSaving(false)
  }

  // 6. حذف کارت
  const handleDeleteCard = async (cardId: string) => {
    if (!confirm("آیا از حذف این کارت مطمئن هستید؟")) return

    await supabase.from("leitner_box").delete().eq("id", cardId)

    // حذف از هر دو لیست
    setCards(prev => prev.filter(c => c.id !== cardId))
    setAllCards(prev => prev.filter(c => c.id !== cardId))

    if (viewMode === "review") {
      if (cards.length <= 1) setCurrentIndex(0)
      setIsFlipped(false)
    }
  }

  // فیلتر کردن لیست آرشیو
  const filteredAllCards = allCards.filter(
    c =>
      c.flashcard_front.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.flashcard_back.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    // ✅ فیکس: استفاده از min-h-screen روی wrapper اصلی برای پوشش کامل پس‌زمینه
    <div
      className="min-h-screen w-full bg-gray-50 font-sans text-gray-900 transition-colors dark:bg-slate-950 dark:text-gray-100"
      dir="rtl"
    >
      {/* کانتینر مرکزی با عرض محدود شده (max-w-md برای کارت‌ها) */}
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col px-4 pb-20 pt-6">
        {/* هدر */}
        <header className="mb-6 flex w-full items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-gray-800 dark:text-white">
              {viewMode === "review" ? "مرور روزانه 🧠" : "آرشیو کارت‌ها 🗂️"}
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {viewMode === "review"
                ? loading
                  ? "در حال بارگذاری..."
                  : `${cards.length} کارت برای امروز`
                : `${allCards.length} کارت کل`}
            </p>
          </div>

          <div className="flex gap-2">
            {/* دکمه تغییر نما */}
            <button
              onClick={() =>
                setViewMode(prev => (prev === "review" ? "list" : "review"))
              }
              className="rounded-xl bg-white p-3 text-gray-600 shadow-sm hover:bg-gray-100 dark:bg-slate-800 dark:text-gray-300"
              title={
                viewMode === "review" ? "مشاهده لیست همه" : "برگشت به مرور"
              }
            >
              {viewMode === "review" ? (
                <IconList size={20} />
              ) : (
                <IconId size={20} />
              )}
            </button>

            {/* دکمه افزودن */}
            <button
              onClick={() => openModal()}
              className="rounded-xl bg-blue-600 p-3 text-white shadow-md shadow-blue-500/20 hover:bg-blue-700 active:scale-95"
            >
              <IconPlus size={20} />
            </button>
          </div>
        </header>

        {/* بدنه اصلی */}
        <main className="flex-1">
          <AnimatePresence mode="wait">
            {/* --- حالت ۱: مرور (Review Mode) --- */}
            {viewMode === "review" && (
              <motion.div
                key="review"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="flex flex-col items-center justify-center"
              >
                {loading ? (
                  <div className="mt-20 flex flex-col items-center gap-4 opacity-50">
                    <IconRotate
                      className="animate-spin text-blue-500"
                      size={40}
                    />
                    <p>در حال آماده‌سازی...</p>
                  </div>
                ) : cards.length === 0 ? (
                  <div className="mt-10 flex flex-col items-center text-center">
                    <div className="mb-6 rounded-full bg-emerald-100 p-8 dark:bg-emerald-900/30">
                      <IconBrain
                        size={80}
                        className="text-emerald-600 dark:text-emerald-400"
                      />
                    </div>
                    <h2 className="mb-2 text-xl font-bold text-gray-800 dark:text-white">
                      آفرین! تموم شد 🎉
                    </h2>
                    <p className="mb-8 text-sm leading-relaxed text-gray-500 dark:text-gray-400">
                      همه کارت‌های امروز رو مرور کردی. <br />
                      می‌تونی از لیست، بقیه کارت‌هات رو ببینی.
                    </p>
                    <RippleButton
                      onClick={() => setViewMode("list")}
                      className="w-full bg-gray-200 !text-gray-800 hover:bg-gray-300 dark:bg-slate-800 dark:!text-white"
                    >
                      مشاهده تمام کارت‌ها
                    </RippleButton>
                  </div>
                ) : (
                  <div className="relative w-full">
                    {/* ابزار ویرایش کارت جاری */}
                    <div className="mb-4 flex w-full justify-end gap-2 px-1">
                      <button
                        onClick={() => openModal(cards[currentIndex])}
                        className="rounded-full bg-white/50 p-2 text-gray-500 hover:text-blue-600 dark:text-gray-400"
                      >
                        <IconPencil size={18} />
                      </button>
                      <button
                        onClick={() => handleDeleteCard(cards[currentIndex].id)}
                        className="rounded-full bg-white/50 p-2 text-gray-500 hover:text-red-600 dark:text-gray-400"
                      >
                        <IconTrash size={18} />
                      </button>
                    </div>

                    {/* کارت ۳ بعدی */}
                    <div className="perspective-1000 relative h-[420px] w-full">
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
                        <MaterialCard className="backface-hidden absolute inset-0 flex flex-col items-center justify-center border-b-4 border-blue-200 bg-gradient-to-br from-white to-blue-50 p-6 text-center dark:border-blue-900 dark:from-slate-800 dark:to-slate-900">
                          <span className="absolute top-6 rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-600 dark:bg-blue-900/50 dark:text-blue-300">
                            جعبه {cards[currentIndex].box_level}
                          </span>
                          <p className="text-xl font-bold leading-relaxed text-gray-800 dark:text-gray-100">
                            {cards[currentIndex].flashcard_front}
                          </p>
                          <p className="absolute bottom-8 animate-pulse text-xs text-gray-400 dark:text-gray-500">
                            ضربه بزنید تا پاسخ را ببینید
                          </p>
                          <div
                            className="absolute inset-0 z-10 cursor-pointer"
                            onClick={() => setIsFlipped(true)}
                          />
                        </MaterialCard>

                        {/* پشت */}
                        <MaterialCard className="backface-hidden rotate-y-180 absolute inset-0 flex flex-col items-center justify-between border-b-4 border-purple-200 bg-white p-6 text-center dark:border-purple-900 dark:bg-slate-900">
                          <div className="flex w-full flex-1 flex-col items-center justify-center overflow-y-auto">
                            <span className="mb-4 rounded-full bg-purple-100 px-3 py-1 text-xs font-bold text-purple-600 dark:bg-purple-900/50 dark:text-purple-300">
                              پاسخ
                            </span>
                            <p className="text-lg font-medium leading-relaxed text-gray-700 dark:text-gray-200">
                              {cards[currentIndex].flashcard_back}
                            </p>
                          </div>
                          <div className="flex w-full gap-3 pt-4">
                            <button
                              onClick={e => {
                                e.stopPropagation()
                                handleReview(false)
                              }}
                              className="flex flex-1 flex-col items-center gap-1 rounded-xl bg-red-50 py-3 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400"
                            >
                              <IconX size={20} />
                              <span className="text-xs font-bold">
                                بلد نبودم
                              </span>
                            </button>
                            <button
                              onClick={e => {
                                e.stopPropagation()
                                handleReview(true)
                              }}
                              className="flex flex-1 flex-col items-center gap-1 rounded-xl bg-emerald-500 py-3 text-white shadow-lg shadow-emerald-200 active:scale-95 dark:shadow-none"
                            >
                              <IconCheck size={20} />
                              <span className="text-xs font-bold">
                                یادم بود
                              </span>
                            </button>
                          </div>
                        </MaterialCard>
                      </motion.div>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* --- حالت ۲: لیست آرشیو (List Mode) --- */}
            {viewMode === "list" && (
              <motion.div
                key="list"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                {/* جستجو */}
                <div className="relative">
                  <IconSearch
                    className="absolute right-3 top-3 text-gray-400"
                    size={18}
                  />
                  <input
                    type="text"
                    placeholder="جستجو در کارت‌ها..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-4 pr-10 text-sm outline-none focus:border-blue-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                  />
                </div>

                {/* لیست کارت‌ها */}
                <div className="space-y-3 pb-20">
                  {filteredAllCards.length === 0 ? (
                    <div className="py-10 text-center text-sm text-gray-400">
                      کارتی پیدا نشد.
                    </div>
                  ) : (
                    filteredAllCards.map(card => (
                      <div
                        key={card.id}
                        className="group relative overflow-hidden rounded-2xl border border-gray-100 bg-white p-4 shadow-sm transition hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
                      >
                        <div className="mb-2 flex items-start justify-between">
                          <span className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2 py-1 text-[10px] font-bold text-blue-600 dark:bg-blue-900/30 dark:text-blue-300">
                            جعبه {card.box_level}
                          </span>
                          <div className="flex gap-2 opacity-0 transition group-hover:opacity-100">
                            <button
                              onClick={() => openModal(card)}
                              className="text-gray-400 hover:text-blue-500"
                            >
                              <IconPencil size={16} />
                            </button>
                            <button
                              onClick={() => handleDeleteCard(card.id)}
                              className="text-gray-400 hover:text-red-500"
                            >
                              <IconTrash size={16} />
                            </button>
                          </div>
                        </div>
                        <h4 className="mb-1 line-clamp-1 text-sm font-bold text-gray-800 dark:text-gray-200">
                          {card.flashcard_front}
                        </h4>
                        <p className="line-clamp-2 text-xs text-gray-500 dark:text-gray-400">
                          {card.flashcard_back}
                        </p>

                        <div className="mt-3 flex items-center gap-1 text-[10px] text-gray-400">
                          <IconCalendar size={12} />
                          مرور بعدی:{" "}
                          {new Date(card.next_review_at).toLocaleDateString(
                            "fa-IR"
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>

      {/* --- مودال افزودن / ویرایش --- */}
      <AnimatePresence>
        {isModalOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm dark:bg-black/70"
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed inset-x-0 bottom-0 z-50 rounded-t-[2rem] bg-white p-6 pb-10 shadow-2xl dark:bg-slate-900"
            >
              <div className="mx-auto mb-6 h-1.5 w-12 rounded-full bg-gray-200 dark:bg-slate-700" />
              <h3 className="mb-6 flex items-center gap-2 text-xl font-bold text-gray-800 dark:text-white">
                <IconCards className="text-blue-500" />
                {editingCard ? "ویرایش کارت" : "کارت جدید"}
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-xs font-bold text-gray-500 dark:text-gray-400">
                    روی کارت (سوال)
                  </label>
                  <textarea
                    value={frontInput}
                    onChange={e => setFrontInput(e.target.value)}
                    className="w-full rounded-2xl border-2 border-gray-100 bg-gray-50 p-4 text-sm text-gray-800 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    rows={2}
                    placeholder="سوال..."
                  />
                </div>
                <div>
                  <label className="mb-2 block text-xs font-bold text-gray-500 dark:text-gray-400">
                    پشت کارت (جواب)
                  </label>
                  <textarea
                    value={backInput}
                    onChange={e => setBackInput(e.target.value)}
                    className="w-full rounded-2xl border-2 border-gray-100 bg-gray-50 p-4 text-sm text-gray-800 focus:border-purple-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    rows={3}
                    placeholder="جواب..."
                  />
                </div>
                <RippleButton
                  onClick={handleSaveCard}
                  className="mt-4 w-full bg-blue-600 py-4 font-bold text-white hover:bg-blue-700"
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
      `}</style>
    </div>
  )
}
