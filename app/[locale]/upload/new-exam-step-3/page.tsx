"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { motion } from "framer-motion"
import {
  IconChevronLeft,
  IconFileDescription,
  IconAlertCircle,
  IconChevronDown,
  IconSchool,
  IconListDetails,
  IconBook
} from "@tabler/icons-react"

// ایمپورت طبق مسیر درخواستی شما
import {
  MaterialCard,
  IconWrapper,
  colorThemes
} from "@/components/material/MaterialUI"

// --- داده‌های موقت (Mock Data) ---
const grades = [
  { value: "دهم", label: "پایه دهم" },
  { value: "یازدهم", label: "پایه یازدهم" },
  { value: "دوازدهم", label: "پایه دوازدھم" }
]

const examTypes = [
  { value: "تستی", label: "تستی (کنکوری)" },
  { value: "تشریحی", label: "تشریحی (امتحان نهایی)" },
  { value: "ترکیبی", label: "ترکیبی (تستی و تشریحی)" }
]

const allChapters = {
  دهم: [
    { id: "ch1-10", label: "فصل ۱: دنیای زنده" },
    { id: "ch2-10", label: "فصل ۲: گوارش و جذب مواد" },
    { id: "ch3-10", label: "فصل ۳: تبادلات گازی" }
  ],
  یازدهم: [
    { id: "ch1-11", label: "فصل ۱: تنظیم عصبی" },
    { id: "ch2-11", label: "فصل ۲: حواس" }
  ],
  دوازدهم: [
    { id: "ch1-12", label: "فصل ۱: مولکول‌های اطلاعاتی" },
    { id: "ch2-12", label: "فصل ۲: جریان اطلاعات" }
  ]
}
// ---------------------------------

export default function NewExamStep3Page() {
  const router = useRouter()

  // تنظیم تم رنگی (آبی برای محتوا مناسب است)
  const themeColor = "blue"
  const theme = colorThemes[themeColor]

  // State برای فیلدهای فرم
  const [examName, setExamName] = useState("")
  const [selectedGrade, setSelectedGrade] = useState("")
  const [examType, setExamType] = useState("")
  const [selectedChapters, setSelectedChapters] = useState<string[]>([])

  // State برای مدیریت Popover فصل‌ها
  const [chaptersPopoverOpen, setChaptersPopoverOpen] = useState(false)

  // پاک کردن فصل‌های انتخابی وقتی پایه تحصیلی عوض می‌شود
  useEffect(() => {
    setSelectedChapters([])
  }, [selectedGrade])

  // فعال/غیرفعال کردن دکمه ادامه
  const isFormValid =
    examName.trim() !== "" &&
    selectedGrade !== "" &&
    examType !== "" &&
    selectedChapters.length > 0

  const handleNextStep = () => {
    router.push("/upload/new-exam-step-4")
  }

  const handleGoBack = () => {
    router.back()
  }

  const handleChapterToggle = (chapterId: string) => {
    setSelectedChapters(prev =>
      prev.includes(chapterId)
        ? prev.filter(id => id !== chapterId)
        : [...prev, chapterId]
    )
  }

  const availableChapters =
    allChapters[selectedGrade as keyof typeof allChapters] || []

  return (
    <div
      dir="rtl"
      className="animate-fade-down flex size-full flex-col items-center justify-center p-4"
    >
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeInOut" }}
        className="relative w-full max-w-md"
      >
        <MaterialCard elevation={4} className="overflow-hidden">
          {/* نوار رنگی بالای کارت */}
          <div className={`h-2 bg-gradient-to-r ${theme.gradient}`} />

          {/* ----- هدر ----- */}
          <div className="flex items-center justify-between p-6 pb-2">
            <Button
              variant="ghost"
              size="icon"
              className="text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
              onClick={handleGoBack}
            >
              <IconChevronLeft size={24} />
            </Button>

            <div className="flex flex-col items-end">
              <div className="mb-1 flex items-center gap-3">
                <h1 className="text-lg font-bold text-slate-800">
                  جزئیات آزمون
                </h1>
                {/* آیکون با رپر جدید */}
                <div className="origin-right scale-75">
                  <IconWrapper icon={IconFileDescription} color={themeColor} />
                </div>
              </div>
              <p className="mr-1 text-xs text-slate-500">
                مشخصات محتوایی را وارد کنید
              </p>
            </div>
          </div>

          {/* خط جداکننده */}
          <div className="mx-6 my-2 h-px bg-slate-100" />

          {/* ----- هشدار (طراحی جدید) ----- */}
          <div className="px-6 pt-2">
            <div className="flex items-center gap-3 rounded-xl border border-red-100 bg-red-50 p-3 text-red-600">
              <IconAlertCircle size={20} className="shrink-0" />
              <span className="text-xs font-semibold">
                توجه: فعلاً فقط درس زیست‌شناسی فعال است.
              </span>
            </div>
          </div>

          {/* ----- فرم اصلی ----- */}
          <div className="space-y-5 p-6">
            {/* --- 1. نام آزمون --- */}
            <div className="space-y-2">
              <Label className="flex items-center gap-1 text-xs font-bold text-slate-500">
                <span className={`h-3 w-1 rounded-full ${theme.bg}`}></span>
                نام آزمون
              </Label>
              <Input
                placeholder="مثلا: جمع‌بندی نیم‌سال اول"
                value={examName}
                onChange={e => setExamName(e.target.value)}
                className="h-10 border-slate-200 bg-slate-50 transition-colors focus:border-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* --- 2. پایه تحصیلی --- */}
              <div className="space-y-2">
                <Label className="flex items-center gap-1 text-xs font-bold text-slate-500">
                  <IconSchool size={14} />
                  پایه تحصیلی
                </Label>
                <Select
                  dir="rtl"
                  value={selectedGrade}
                  onValueChange={setSelectedGrade}
                >
                  <SelectTrigger className="border-slate-200 bg-slate-50">
                    <SelectValue placeholder="انتخاب..." />
                  </SelectTrigger>
                  <SelectContent>
                    {grades.map(grade => (
                      <SelectItem key={grade.value} value={grade.value}>
                        {grade.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* --- 3. نوع امتحان --- */}
              <div className="space-y-2">
                <Label className="flex items-center gap-1 text-xs font-bold text-slate-500">
                  <IconListDetails size={14} />
                  نوع آزمون
                </Label>
                <Select
                  dir="rtl"
                  value={examType}
                  onValueChange={setExamType}
                  disabled={!selectedGrade}
                >
                  <SelectTrigger className="border-slate-200 bg-slate-50">
                    <SelectValue placeholder="انتخاب..." />
                  </SelectTrigger>
                  <SelectContent>
                    {examTypes.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* --- 4. انتخاب فصل‌ها --- */}
            <div className="space-y-2">
              <Label className="flex items-center gap-1 text-xs font-bold text-slate-500">
                <IconBook size={14} />
                سرفصل‌ها
              </Label>
              <Popover
                open={chaptersPopoverOpen}
                onOpenChange={setChaptersPopoverOpen}
              >
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={`
                        h-11 w-full justify-between border-slate-200 bg-slate-50 hover:bg-slate-100
                        ${!selectedGrade && "cursor-not-allowed opacity-50"}
                      `}
                    disabled={!selectedGrade}
                  >
                    <span className="truncate text-sm text-slate-700">
                      {selectedChapters.length > 0
                        ? `${selectedChapters.length} فصل انتخاب شده`
                        : "انتخاب فصل‌های مورد نظر"}
                    </span>
                    <IconChevronDown size={16} className="text-slate-400" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[300px] p-0" align="center">
                  <ScrollArea className="h-48 bg-white">
                    <div className="space-y-1 p-3">
                      {availableChapters.length > 0 ? (
                        availableChapters.map(chapter => (
                          <div
                            key={chapter.id}
                            className="flex items-center space-x-2 space-x-reverse rounded-lg p-2 transition-colors hover:bg-slate-50"
                          >
                            <Checkbox
                              id={chapter.id}
                              checked={selectedChapters.includes(chapter.id)}
                              onCheckedChange={() =>
                                handleChapterToggle(chapter.id)
                              }
                              className="border-slate-300 data-[state=checked]:border-blue-600 data-[state=checked]:bg-blue-600"
                            />
                            <Label
                              htmlFor={chapter.id}
                              className="flex-1 cursor-pointer text-sm text-slate-700"
                            >
                              {chapter.label}
                            </Label>
                          </div>
                        ))
                      ) : (
                        <p className="py-4 text-center text-xs text-slate-400">
                          ابتدا پایه تحصیلی را انتخاب کنید.
                        </p>
                      )}
                    </div>
                  </ScrollArea>
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* ----- فوتر ----- */}
          <div className="mt-2 p-6 pt-0">
            <Button
              size="lg"
              onClick={handleNextStep}
              disabled={!isFormValid}
              className={`
                h-12 w-full rounded-xl text-base font-bold shadow-lg transition-all duration-300
                ${
                  !isFormValid
                    ? "cursor-not-allowed bg-slate-100 text-slate-400 shadow-none"
                    : `bg-gradient-to-r ${theme.gradient} text-white hover:-translate-y-0.5 hover:shadow-xl`
                }
              `}
            >
              تایید و ادامه
            </Button>
          </div>
        </MaterialCard>
      </motion.div>
    </div>
  )
}
