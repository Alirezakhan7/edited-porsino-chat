// lib/lessons/config.ts

export type GradeLevel = "10" | "11" | "12"

export interface ChapterSection {
  id: string
  title: string
  startStep: number // شروع بازه (مثلا 1)
  endStep: number // پایان بازه (مثلا 5)
  theme: "blue" | "purple" | "pink" | "emerald" // رنگ اختصاصی گفتار
}

export interface ChapterConfig {
  id: string // شناسه یکتا (مثل biology_12_ch01)
  grade: GradeLevel // پایه تحصیلی
  title: string // عنوان فصل (مثل "مولکول‌های اطلاعاتی")
  description: string // توضیح کوتاه برای زیر عنوان
  jsonFileName: string // نام فایل جیسون در پوشه data
  totalSteps: number // تعداد دایره‌های روی نقشه (مثلاً ۲۰ تا)
  totalChunks: number // کل چانک‌های آموزشی (مثلاً ۱۰۰ تا)
  themeColor: string // رنگ تم این فصل (برای خوشگلی UI)
  sections: ChapterSection[]
}

// لیست تمام فصل‌های موجود در اپلیکیشن
export const chapters: ChapterConfig[] = [
  {
    id: "biology_12_ch01",
    grade: "12",
    title: "فصل ۱: مولکول‌های اطلاعاتی",
    description: "ماجرای کشف DNA و رمز و راز پروتئین‌ها",
    jsonFileName: "biology_12_ch01.json",
    totalChunks: 101, // این عدد را از طول آرایه فایل جیسون گرفتم
    totalSteps: 20, // هر ۵ چانک = ۱ استپ (تقریبی)
    themeColor: "from-emerald-400 to-teal-500",
    sections: [
      {
        id: "s1",
        title: "گفتار ۱: نوکلئیک اسیدها",
        startStep: 1,
        endStep: 8,
        theme: "emerald"
      },
      {
        id: "s2",
        title: "گفتار ۲: همانندسازی دنا",
        startStep: 9,
        endStep: 14,
        theme: "blue"
      },
      {
        id: "s3",
        title: "گفتار ۳: پروتئین‌ها",
        startStep: 15,
        endStep: 20,
        theme: "purple"
      }
    ]
  }
  // فصل‌های بعدی را اینجا اضافه می‌کنی...
  // {
  //   id: "biology_12_ch02",
  //   grade: "12",
  //   title: "فصل ۲: جریان اطلاعات در یاخته",
  //   ...
  // }
]

// --- توابع کمکی (Helpers) ---

// ۱. پیدا کردن تنظیمات یک فصل خاص
export function getChapterConfig(chapterId: string): ChapterConfig | undefined {
  return chapters.find(c => c.id === chapterId)
}

// ۲. گرفتن لیست فصل‌های یک پایه خاص (مثلاً برای صفحه لیست دروس دوازدهم)
export function getChaptersByGrade(grade: GradeLevel): ChapterConfig[] {
  return chapters.filter(c => c.grade === grade)
}
