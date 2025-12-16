// lib/lessons/config.ts
// ⚠️ این فایل به صورت خودکار توسط اسکریپت generate-config.js تولید شده است.
// ⚠️ برای اعمال تغییرات دائمی، اسکریپت را آپدیت کنید یا data.json را تغییر دهید.

export type GradeLevel = "10" | "11" | "12"

export interface ChapterSection {
  id: string
  title: string
  startStep: number
  endStep: number
  theme: "blue" | "purple" | "pink" | "emerald" | "amber" | "rose" | "cyan"
}

export interface ChapterConfig {
  id: string
  grade: GradeLevel
  chapterNumber: number
  title: string
  description: string
  totalSteps: number
  totalChunks: number // جهت اطلاع (استفاده نمی‌شود)
  themeColor: string
  sections: ChapterSection[]
}

export const chapters: ChapterConfig[] = [
  {
    id: "biology_10_ch01", // فرمت: biology_10_ch01
    grade: "10",
    chapterNumber: 1,
    title: "فصل 1 (پایه 10)",
    description: "تعداد محتوا: 23 آیتم",
    totalSteps: 5,
    totalChunks: 23,
    themeColor: "from-emerald-400 to-teal-500",
    sections: [
      {
        id: "s1",
        title: "گفتار 1: زیست شناسی چیست؟",
        startStep: 1,
        endStep: 2,
        theme: "emerald"
      },
      {
        id: "s2",
        title: "گفتار 2: گستره حیات",
        startStep: 3,
        endStep: 4,
        theme: "blue"
      },
      {
        id: "s3",
        title: "گفتار 3: یاخته و بافت در بدن انسان",
        startStep: 5,
        endStep: 5,
        theme: "purple"
      }
    ]
  },
  {
    id: "biology_10_ch02", // فرمت: biology_10_ch01
    grade: "10",
    chapterNumber: 2,
    title: "فصل 2 (پایه 10)",
    description: "تعداد محتوا: 21 آیتم",
    totalSteps: 5,
    totalChunks: 21,
    themeColor: "from-blue-400 to-indigo-500",
    sections: [
      {
        id: "s1",
        title: "گفتار 1: ساختار و عملکرد لوله گوارش",
        startStep: 1,
        endStep: 3,
        theme: "emerald"
      },
      {
        id: "s2",
        title: "گفتار 2: جذب مواد و تنظیم فعالیت دستگاه گوارش",
        startStep: 4,
        endStep: 5,
        theme: "blue"
      },
      {
        id: "s3",
        title: "گفتار 3: تنوع گوارش در جانداران",
        startStep: 6,
        endStep: 6,
        theme: "purple"
      }
    ]
  },
  {
    id: "biology_10_ch03", // فرمت: biology_10_ch01
    grade: "10",
    chapterNumber: 3,
    title: "فصل 3 (پایه 10)",
    description: "تعداد محتوا: 13 آیتم",
    totalSteps: 3,
    totalChunks: 13,
    themeColor: "from-purple-400 to-fuchsia-500",
    sections: [
      {
        id: "s1",
        title: "گفتار 1: ساز و کار دستگاه تنفس در انسان",
        startStep: 1,
        endStep: 2,
        theme: "emerald"
      },
      {
        id: "s2",
        title: "گفتار 2: تهویه ششی",
        startStep: 3,
        endStep: 3,
        theme: "blue"
      },
      {
        id: "s3",
        title: "گفتار 3: تنوع تبادلات گازی",
        startStep: 4,
        endStep: 4,
        theme: "purple"
      }
    ]
  },
  {
    id: "biology_10_ch04", // فرمت: biology_10_ch01
    grade: "10",
    chapterNumber: 4,
    title: "فصل 4 (پایه 10)",
    description: "تعداد محتوا: 28 آیتم",
    totalSteps: 6,
    totalChunks: 28,
    themeColor: "from-rose-400 to-red-500",
    sections: [
      {
        id: "s1",
        title: "گفتار 1: قلب",
        startStep: 1,
        endStep: 2,
        theme: "emerald"
      },
      {
        id: "s2",
        title: "گفتار 2: رگ ها",
        startStep: 3,
        endStep: 4,
        theme: "blue"
      },
      {
        id: "s3",
        title: "گفتار 3: خون",
        startStep: 5,
        endStep: 6,
        theme: "purple"
      },
      {
        id: "s4",
        title: "گفتار 4: تنوع گردش موارد در جانداران",
        startStep: 7,
        endStep: 7,
        theme: "rose"
      }
    ]
  },
  {
    id: "biology_10_ch05", // فرمت: biology_10_ch01
    grade: "10",
    chapterNumber: 5,
    title: "فصل 5 (پایه 10)",
    description: "تعداد محتوا: 8 آیتم",
    totalSteps: 2,
    totalChunks: 8,
    themeColor: "from-amber-400 to-orange-500",
    sections: [
      {
        id: "s1",
        title: "گفتار 1: هم ایستایی و کلیه ها",
        startStep: 1,
        endStep: 1,
        theme: "emerald"
      },
      {
        id: "s2",
        title: "گفتار 2: تشکیل ادرار و تخلیه آن",
        startStep: 2,
        endStep: 2,
        theme: "blue"
      },
      {
        id: "s3",
        title: "گفتار 3: تنوع دفع و تنظیم اسمزی در حانداران",
        startStep: 3,
        endStep: 3,
        theme: "purple"
      }
    ]
  },
  {
    id: "biology_10_ch06", // فرمت: biology_10_ch01
    grade: "10",
    chapterNumber: 6,
    title: "فصل 6 (پایه 10)",
    description: "تعداد محتوا: 18 آیتم",
    totalSteps: 4,
    totalChunks: 18,
    themeColor: "from-cyan-400 to-blue-500",
    sections: [
      {
        id: "s1",
        title: "گفتار 1: ویژگی های یاخته گیاهی",
        startStep: 1,
        endStep: 2,
        theme: "emerald"
      },
      {
        id: "s2",
        title: "گفتار 2: سامانه بافتی",
        startStep: 3,
        endStep: 3,
        theme: "blue"
      },
      {
        id: "s3",
        title: "گفتار 3: ساختار گیاهان",
        startStep: 4,
        endStep: 4,
        theme: "purple"
      }
    ]
  },
  {
    id: "biology_10_ch07", // فرمت: biology_10_ch01
    grade: "10",
    chapterNumber: 7,
    title: "فصل 7 (پایه 10)",
    description: "تعداد محتوا: 14 آیتم",
    totalSteps: 3,
    totalChunks: 14,
    themeColor: "from-emerald-400 to-teal-500",
    sections: [
      {
        id: "s1",
        title: "گفتار 1: تغذیه گیاهی",
        startStep: 1,
        endStep: 1,
        theme: "emerald"
      },
      {
        id: "s2",
        title: "گفتار 2: جانداران موثر در تغذیه گیاهی",
        startStep: 2,
        endStep: 2,
        theme: "blue"
      },
      {
        id: "s3",
        title: "گفتار 3: انتقال مواد در گیاهان",
        startStep: 3,
        endStep: 3,
        theme: "purple"
      }
    ]
  },
  {
    id: "biology_11_ch01", // فرمت: biology_10_ch01
    grade: "11",
    chapterNumber: 1,
    title: "فصل 1 (پایه 11)",
    description: "تعداد محتوا: 23 آیتم",
    totalSteps: 5,
    totalChunks: 23,
    themeColor: "from-blue-400 to-indigo-500",
    sections: [
      {
        id: "s1",
        title: "گفتار 1: یاخته های بافت عصبی",
        startStep: 1,
        endStep: 2,
        theme: "emerald"
      },
      {
        id: "s2",
        title: "گفتار 2: ساختار دستگاه عصبی",
        startStep: 3,
        endStep: 5,
        theme: "blue"
      }
    ]
  },
  {
    id: "biology_11_ch02", // فرمت: biology_10_ch01
    grade: "11",
    chapterNumber: 2,
    title: "فصل 2 (پایه 11)",
    description: "تعداد محتوا: 23 آیتم",
    totalSteps: 5,
    totalChunks: 23,
    themeColor: "from-purple-400 to-fuchsia-500",
    sections: [
      {
        id: "s1",
        title: "گفتار 1: گیرنده های حسی",
        startStep: 1,
        endStep: 1,
        theme: "emerald"
      },
      {
        id: "s2",
        title: "گفتار 2: حواس ویژه",
        startStep: 2,
        endStep: 4,
        theme: "blue"
      },
      {
        id: "s3",
        title: "گفتار 3: گیرنده های حسی جانوران",
        startStep: 5,
        endStep: 5,
        theme: "purple"
      }
    ]
  },
  {
    id: "biology_11_ch03", // فرمت: biology_10_ch01
    grade: "11",
    chapterNumber: 3,
    title: "فصل 3 (پایه 11)",
    description: "تعداد محتوا: 15 آیتم",
    totalSteps: 3,
    totalChunks: 15,
    themeColor: "from-rose-400 to-red-500",
    sections: [
      {
        id: "s1",
        title: "گفتار 1: استخوان ها و اسکلت",
        startStep: 1,
        endStep: 2,
        theme: "emerald"
      },
      {
        id: "s2",
        title: "گفتار 2: ماهیچه و حرکت",
        startStep: 3,
        endStep: 3,
        theme: "blue"
      }
    ]
  },
  {
    id: "biology_11_ch04", // فرمت: biology_10_ch01
    grade: "11",
    chapterNumber: 4,
    title: "فصل 4 (پایه 11)",
    description: "تعداد محتوا: 12 آیتم",
    totalSteps: 3,
    totalChunks: 12,
    themeColor: "from-amber-400 to-orange-500",
    sections: [
      {
        id: "s1",
        title: "گفتار 1: ارتباط شیمیایی",
        startStep: 1,
        endStep: 1,
        theme: "emerald"
      },
      {
        id: "s2",
        title: "گفتار 2: غده های درون ریز",
        startStep: 2,
        endStep: 3,
        theme: "blue"
      }
    ]
  },
  {
    id: "biology_11_ch05", // فرمت: biology_10_ch01
    grade: "11",
    chapterNumber: 5,
    title: "فصل 5 (پایه 11)",
    description: "تعداد محتوا: 18 آیتم",
    totalSteps: 4,
    totalChunks: 18,
    themeColor: "from-cyan-400 to-blue-500",
    sections: [
      {
        id: "s1",
        title: "گفتار 1: نخستین خط دفاعی:ورود ممنوع",
        startStep: 1,
        endStep: 1,
        theme: "emerald"
      },
      {
        id: "s2",
        title: "گفتار 2: دومین خط دفاع:واکنش های عمومی",
        startStep: 2,
        endStep: 3,
        theme: "blue"
      },
      {
        id: "s3",
        title: "گفتار 3: سومین خط دفاعی:دفاع اختصاصی",
        startStep: 4,
        endStep: 4,
        theme: "purple"
      }
    ]
  },
  {
    id: "biology_11_ch06", // فرمت: biology_10_ch01
    grade: "11",
    chapterNumber: 6,
    title: "فصل 6 (پایه 11)",
    description: "تعداد محتوا: 19 آیتم",
    totalSteps: 4,
    totalChunks: 19,
    themeColor: "from-emerald-400 to-teal-500",
    sections: [
      {
        id: "s1",
        title: "گفتار 1: فام‌تن(کروموزوم)",
        startStep: 1,
        endStep: 2,
        theme: "emerald"
      },
      {
        id: "s2",
        title: "گفتار 2: رشتمان(میتوز)",
        startStep: 3,
        endStep: 4,
        theme: "blue"
      },
      {
        id: "s3",
        title: "گفتار 3: کاستمان(میوز)وتولید مثل جنسی",
        startStep: 5,
        endStep: 5,
        theme: "purple"
      }
    ]
  },
  {
    id: "biology_11_ch07", // فرمت: biology_10_ch01
    grade: "11",
    chapterNumber: 7,
    title: "فصل 7 (پایه 11)",
    description: "تعداد محتوا: 24 آیتم",
    totalSteps: 5,
    totalChunks: 24,
    themeColor: "from-blue-400 to-indigo-500",
    sections: [
      {
        id: "s1",
        title: "گفتار 1: دستگاه تولید مثل در مرد",
        startStep: 1,
        endStep: 1,
        theme: "emerald"
      },
      {
        id: "s2",
        title: "گفتار 2: دستگاه تولید مثل در زن",
        startStep: 2,
        endStep: 3,
        theme: "blue"
      },
      {
        id: "s3",
        title: "گفتار 3: رشد و نمو جنین",
        startStep: 4,
        endStep: 5,
        theme: "purple"
      },
      {
        id: "s4",
        title: "گفتار 4: تلید مثل در جانوران",
        startStep: 6,
        endStep: 6,
        theme: "rose"
      }
    ]
  },
  {
    id: "biology_11_ch08", // فرمت: biology_10_ch01
    grade: "11",
    chapterNumber: 8,
    title: "فصل 8 (پایه 11)",
    description: "تعداد محتوا: 19 آیتم",
    totalSteps: 4,
    totalChunks: 19,
    themeColor: "from-purple-400 to-fuchsia-500",
    sections: [
      {
        id: "s1",
        title: "گفتار 1: تولید مثل غیر جنسی",
        startStep: 1,
        endStep: 2,
        theme: "emerald"
      },
      {
        id: "s2",
        title: "گفتار 2: تولید مثل جنسی",
        startStep: 3,
        endStep: 4,
        theme: "blue"
      },
      {
        id: "s3",
        title: "گفتار 3: از یاخته تخم تا گیاه",
        startStep: 5,
        endStep: 5,
        theme: "purple"
      }
    ]
  },
  {
    id: "biology_11_ch09", // فرمت: biology_10_ch01
    grade: "11",
    chapterNumber: 9,
    title: "فصل 9 (پایه 11)",
    description: "تعداد محتوا: 19 آیتم",
    totalSteps: 4,
    totalChunks: 19,
    themeColor: "from-rose-400 to-red-500",
    sections: [
      {
        id: "s1",
        title: "گفتار 1: تنظیم کننده های رشد در گیاهان",
        startStep: 1,
        endStep: 3,
        theme: "emerald"
      },
      {
        id: "s2",
        title: "گفتار 2: پاسخ به محیط",
        startStep: 4,
        endStep: 4,
        theme: "blue"
      }
    ]
  },
  {
    id: "biology_12_ch01", // فرمت: biology_10_ch01
    grade: "12",
    chapterNumber: 1,
    title: "فصل 1 (پایه 12)",
    description: "تعداد محتوا: 25 آیتم",
    totalSteps: 5,
    totalChunks: 25,
    themeColor: "from-amber-400 to-orange-500",
    sections: [
      {
        id: "s1",
        title: "گفتار 1: نوکلئیک اسیدها",
        startStep: 1,
        endStep: 3,
        theme: "emerald"
      },
      {
        id: "s2",
        title: "گفتار 2: همانند سازی دنا",
        startStep: 4,
        endStep: 5,
        theme: "blue"
      },
      {
        id: "s3",
        title: "گفتار 3: پروتئین‌ها",
        startStep: 6,
        endStep: 6,
        theme: "purple"
      }
    ]
  },
  {
    id: "biology_12_ch02", // فرمت: biology_10_ch01
    grade: "12",
    chapterNumber: 2,
    title: "فصل 2 (پایه 12)",
    description: "تعداد محتوا: 17 آیتم",
    totalSteps: 4,
    totalChunks: 17,
    themeColor: "from-cyan-400 to-blue-500",
    sections: [
      {
        id: "s1",
        title: "گفتار 1: رونویسی",
        startStep: 1,
        endStep: 2,
        theme: "emerald"
      },
      {
        id: "s2",
        title: "گفتار 2: به سوی پروتئین",
        startStep: 3,
        endStep: 3,
        theme: "blue"
      },
      {
        id: "s3",
        title: "گفتار 3: تنظیم بیان ژن",
        startStep: 4,
        endStep: 4,
        theme: "purple"
      }
    ]
  },
  {
    id: "biology_12_ch03", // فرمت: biology_10_ch01
    grade: "12",
    chapterNumber: 3,
    title: "فصل 3 (پایه 12)",
    description: "تعداد محتوا: 11 آیتم",
    totalSteps: 3,
    totalChunks: 11,
    themeColor: "from-emerald-400 to-teal-500",
    sections: [
      {
        id: "s1",
        title: "گفتار 1: مفاهیم پایه",
        startStep: 1,
        endStep: 1,
        theme: "emerald"
      },
      {
        id: "s2",
        title: "گفتار 2: انواع صفات",
        startStep: 2,
        endStep: 3,
        theme: "blue"
      }
    ]
  },
  {
    id: "biology_12_ch04", // فرمت: biology_10_ch01
    grade: "12",
    chapterNumber: 4,
    title: "فصل 4 (پایه 12)",
    description: "تعداد محتوا: 18 آیتم",
    totalSteps: 4,
    totalChunks: 18,
    themeColor: "from-blue-400 to-indigo-500",
    sections: [
      {
        id: "s1",
        title: "گفتار 1: تغییر در ماده وراثتی جانداران",
        startStep: 1,
        endStep: 2,
        theme: "emerald"
      },
      {
        id: "s2",
        title: "گفتار 2: تغییر در جمعیت ها",
        startStep: 3,
        endStep: 4,
        theme: "blue"
      },
      {
        id: "s3",
        title: "گفتار 3: تغییر در گونه ها",
        startStep: 5,
        endStep: 5,
        theme: "purple"
      }
    ]
  },
  {
    id: "biology_12_ch05", // فرمت: biology_10_ch01
    grade: "12",
    chapterNumber: 5,
    title: "فصل 5 (پایه 12)",
    description: "تعداد محتوا: 18 آیتم",
    totalSteps: 4,
    totalChunks: 18,
    themeColor: "from-purple-400 to-fuchsia-500",
    sections: [
      {
        id: "s1",
        title: "گفتار 1: تامین انرژی",
        startStep: 1,
        endStep: 2,
        theme: "emerald"
      },
      {
        id: "s2",
        title: "گفتار 2: اکسایش بیشتر",
        startStep: 3,
        endStep: 4,
        theme: "blue"
      },
      {
        id: "s3",
        title: "گفتار 3: زیستن مستقل از اکسیژن",
        startStep: 5,
        endStep: 5,
        theme: "purple"
      }
    ]
  },
  {
    id: "biology_12_ch06", // فرمت: biology_10_ch01
    grade: "12",
    chapterNumber: 6,
    title: "فصل 6 (پایه 12)",
    description: "تعداد محتوا: 17 آیتم",
    totalSteps: 4,
    totalChunks: 17,
    themeColor: "from-rose-400 to-red-500",
    sections: [
      {
        id: "s1",
        title: "گفتار 1: فتوسنتز:تبدیل انرژی نور به انرژی شیمیایی",
        startStep: 1,
        endStep: 1,
        theme: "emerald"
      },
      {
        id: "s2",
        title: "گفتار 2: واکنش های فتوسنتزی",
        startStep: 2,
        endStep: 3,
        theme: "blue"
      },
      {
        id: "s3",
        title: "گفتار 3: فتوسنتز در ظرایط دشوار",
        startStep: 4,
        endStep: 4,
        theme: "purple"
      }
    ]
  },
  {
    id: "biology_12_ch07", // فرمت: biology_10_ch01
    grade: "12",
    chapterNumber: 7,
    title: "فصل 7 (پایه 12)",
    description: "تعداد محتوا: 16 آیتم",
    totalSteps: 4,
    totalChunks: 16,
    themeColor: "from-amber-400 to-orange-500",
    sections: [
      {
        id: "s1",
        title: "گفتار 1: زیست فناوری و مهندسی ژنتیک",
        startStep: 1,
        endStep: 2,
        theme: "emerald"
      },
      {
        id: "s2",
        title: "گفتار 2: فناوری مهندسی پروتئین و بافت",
        startStep: 3,
        endStep: 3,
        theme: "blue"
      },
      {
        id: "s3",
        title: "گفتار 3: کاربرد های زیست فناوری",
        startStep: 4,
        endStep: 4,
        theme: "purple"
      }
    ]
  },
  {
    id: "biology_12_ch08", // فرمت: biology_10_ch01
    grade: "12",
    chapterNumber: 8,
    title: "فصل 8 (پایه 12)",
    description: "تعداد محتوا: 20 آیتم",
    totalSteps: 4,
    totalChunks: 20,
    themeColor: "from-cyan-400 to-blue-500",
    sections: [
      {
        id: "s1",
        title: "گفتار 1: اساس رفتار",
        startStep: 1,
        endStep: 2,
        theme: "emerald"
      },
      {
        id: "s2",
        title: "گفتار 2: انتخاب طبیعی و رفتار",
        startStep: 3,
        endStep: 4,
        theme: "blue"
      },
      {
        id: "s3",
        title: "گفتار 3: ارتباط و زندگی گروهی",
        startStep: 5,
        endStep: 5,
        theme: "purple"
      }
    ]
  }
]

// --- توابع کمکی (Helpers) ---

// ۱. پیدا کردن تنظیمات یک فصل خاص
export function getChapterConfig(chapterId: string): ChapterConfig | undefined {
  return chapters.find(c => c.id === chapterId)
}

// ۲. گرفتن لیست فصل‌های یک پایه خاص
export function getChaptersByGrade(grade: GradeLevel): ChapterConfig[] {
  return chapters.filter(c => c.grade === grade)
}
