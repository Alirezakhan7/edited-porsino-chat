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
  IconFileText,
  IconAlertTriangle,
  IconChevronDown
} from "@tabler/icons-react"

// --- داده‌های موقت (Mock Data) ---
// TODO: این داده‌ها باید بعداً از Supabase خوانده شوند
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
    // ...
  ],
  یازدهم: [
    { id: "ch1-11", label: "فصل ۱: تنظیم عصبی" },
    { id: "ch2-11", label: "فصل ۲: حواس" }
    // ...
  ],
  دوازدهم: [
    { id: "ch1-12", label: "فصل ۱: مولکول‌های اطلاعاتی" },
    { id: "ch2-12", label: "فصل ۲: جریان اطلاعات" }
    // ...
  ]
}
// ---------------------------------

export default function NewExamStep3Page() {
  const router = useRouter()

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
    // TODO: تمام اطلاعات (examName, selectedGrade, examType, selectedChapters) را به مرحله بعد ارسال کنید
    // یا در Supabase ذخیره کنید و ID آزمون را به مرحله بعد بفرستید
    router.push("/upload/new-exam-step-4") // (آدرس مرحله بعد)
  }

  const handleGoBack = () => {
    router.back() // بازگشت به صفحه انتخاب نمره
  }

  // مدیریت انتخاب/عدم انتخاب فصل‌ها
  const handleChapterToggle = (chapterId: string) => {
    setSelectedChapters(
      prev =>
        prev.includes(chapterId)
          ? prev.filter(id => id !== chapterId) // حذف فصل
          : [...prev, chapterId] // اضافه کردن فصل
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
        {/*
          ❄️ المان شیشه مات (Frosted Glass) ❄️
        */}
        <div
          className="border-muted-foreground/30 bg-muted/20 w-full overflow-hidden rounded-2xl 
                     border shadow-xl backdrop-blur-lg"
        >
          {/* ----- هدر ----- */}
          <div className="border-muted-foreground/30 flex items-center justify-between border-b p-4">
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground"
              onClick={handleGoBack}
            >
              <IconChevronLeft size={20} />
            </Button>
            <h1 className="text-lg font-bold">محتوای امتحانی</h1>
            <IconFileText size={24} className="text-primary" />
          </div>

          {/* ----- هشدار ----- */}
          <div
            className="flex items-center justify-center gap-2 border-b 
                       border-red-500/30 bg-red-500/10 p-2 text-sm font-semibold text-red-500"
          >
            <IconAlertTriangle size={16} />
            فقط زیست شناسی
          </div>

          {/* ----- فرم اصلی ----- */}
          <div className="p-6">
            <div className="space-y-6">
              {/* --- 1. نام آزمون --- */}
              <div>
                <Label
                  htmlFor="examName"
                  className="mb-2 block text-sm font-medium"
                >
                  نام آزمون
                </Label>
                <Input
                  id="examName"
                  placeholder="مثلا: امتحان نهایی فصل ۱ و ۲"
                  value={examName}
                  onChange={e => setExamName(e.target.value)}
                />
              </div>

              {/* --- 2. پایه تحصیلی --- */}
              <div>
                <Label className="mb-2 block text-sm font-medium">
                  پایه تحصیلی
                </Label>
                <Select
                  dir="rtl"
                  value={selectedGrade}
                  onValueChange={setSelectedGrade}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="پایه را انتخاب کنید..." />
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
              <div>
                <Label className="mb-2 block text-sm font-medium">
                  نوع امتحان
                </Label>
                <Select
                  dir="rtl"
                  value={examType}
                  onValueChange={setExamType}
                  disabled={!selectedGrade} // تا پایه انتخاب نشده، غیرفعال است
                >
                  <SelectTrigger>
                    <SelectValue placeholder="نوع را انتخاب کنید..." />
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

              {/* --- 4. انتخاب فصل‌ها (Popover) --- */}
              <div>
                <Label className="mb-2 block text-sm font-medium">
                  فصل‌های امتحان
                </Label>
                <Popover
                  open={chaptersPopoverOpen}
                  onOpenChange={setChaptersPopoverOpen}
                >
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-between"
                      disabled={!selectedGrade} // تا پایه انتخاب نشده، غیرفعال است
                    >
                      {selectedChapters.length > 0
                        ? `${selectedChapters.length} فصل انتخاب شده`
                        : "انتخاب فصل‌ها..."}
                      <IconChevronDown size={16} />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                    <ScrollArea className="h-48">
                      <div className="p-4">
                        {availableChapters.length > 0 ? (
                          availableChapters.map(chapter => (
                            <div
                              key={chapter.id}
                              className="mb-2 flex items-center space-x-2 space-x-reverse"
                            >
                              <Checkbox
                                id={chapter.id}
                                checked={selectedChapters.includes(chapter.id)}
                                onCheckedChange={() =>
                                  handleChapterToggle(chapter.id)
                                }
                              />
                              <Label
                                htmlFor={chapter.id}
                                className="cursor-pointer"
                              >
                                {chapter.label}
                              </Label>
                            </div>
                          ))
                        ) : (
                          <p className="text-muted-foreground text-center text-sm">
                            ابتدا پایه تحصیلی را انتخاب کنید.
                          </p>
                        )}
                      </div>
                    </ScrollArea>
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>
        </div>

        {/* ----- دکمه ادامه ----- */}
        <div className="mt-6 flex w-full justify-center">
          <Button
            size="lg"
            className="shadow-primary/30 w-full max-w-xs rounded-full px-8 py-6 
                       text-base font-bold shadow-lg
                       disabled:cursor-not-allowed disabled:shadow-none"
            onClick={handleNextStep}
            disabled={!isFormValid} // دکمه غیرفعال
          >
            ادامه
          </Button>
        </div>
      </motion.div>
    </div>
  )
}
