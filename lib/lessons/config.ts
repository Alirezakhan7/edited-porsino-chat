// lib/lessons/config.ts

export type GradeLevel = "10" | "11" | "12"

export interface ChapterSection {
  id: string
  title: string
  startStep: number
  endStep: number
  theme: "blue" | "purple" | "pink" | "emerald"
}

export interface ChapterConfig {
  id: string // شناسه URL (مثل biology_12_ch01)
  grade: GradeLevel // پایه (برای فیلتر دیتابیس لازم است)
  chapterNumber: number // (جدید) شماره فصل برای پیدا کردن در دیتابیس
  title: string
  description: string
  // jsonFileName: string <-- حذف شد، دیگر نیاز نیست
  totalSteps: number
  totalChunks: number
  themeColor: string
  sections: ChapterSection[]
}

export const chapters: ChapterConfig[] = [
  {
    id: "biology_12_ch01",
    grade: "12",
    chapterNumber: 1, // (جدید) به دیتابیس می‌گوید دنبال فصل ۱ بگرد
    title: "فصل ۱: مولکول‌های اطلاعاتی",
    description: "ماجرای کشف DNA و رمز و راز پروتئین‌ها",
    totalChunks: 101,
    totalSteps: 20,
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
