// lib/lessons/content.ts

export interface ReadingQuestion {
  id: string
  question: string
  options: string[]
  correctIndex: number
  explanation?: string
}

export interface LessonContent {
  lessonKey: string
  readingQuestions: ReadingQuestion[]
  // بعداً می‌تونی flashcards و examQuestions هم اضافه کنی
}

export const lessonsContent: LessonContent[] = [
  {
    lessonKey: "bio10-ch1-10-s1", // همونی که در config گذاشتی
    readingQuestions: [
      {
        id: "q1",
        question: "گستره حیات به چه معناست؟",
        options: [
          "فقط بخش‌های خشکی زمین",
          "تمام نواحی که در آن‌ها حیات امکان‌پذیر است",
          "فقط اعماق اقیانوس‌ها",
          "فقط نواحی استوایی"
        ],
        correctIndex: 1,
        explanation:
          "گستره حیات شامل همه جاهایی است که حیات می‌تواند وجود داشته باشد."
      },
      {
        id: "q2",
        question: "کدام مورد از ویژگی‌های مشترک موجودات زنده است؟",
        options: ["نظم", "تولیدمثل", "پاسخ به محرک", "همه موارد"],
        correctIndex: 3,
        explanation:
          "همه موجودات زنده تا حدی نظم، تولیدمثل و پاسخ به محرک دارند."
      }
      // اینجا بقیه سؤال‌های reading رو اضافه کن
    ]
  }

  // گفتارهای دیگر را هم به همین شکل اضافه کن
]

export function getLessonContent(lessonKey: string): LessonContent | undefined {
  return lessonsContent.find(lesson => lesson.lessonKey === lessonKey)
}
