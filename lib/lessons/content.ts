// lib/lessons/content.ts

export interface ReadingQuestion {
  id: string
  question: string
  options: string[]
  correctIndex: number
  explanation?: string
}

export interface Flashcard {
  id: string
  front: string // روی کارت (صورت سؤال / مفهوم)
  back: string // پشت کارت (توضیح / جواب)
}

export interface ExamQuestion extends ReadingQuestion {}
export interface SpeedQuestion extends ReadingQuestion {}

export interface LessonContent {
  lessonKey: string
  readingQuestions: ReadingQuestion[]
  flashcards: Flashcard[]
  examQuestions: ExamQuestion[]
  speedQuestions: SpeedQuestion[]
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
    ],
    flashcards: [
      {
        id: "fc1",
        front: "گستره حیات چیست؟",
        back: "به همه نواحی از زمین که در آن‌ها حیات می‌تواند وجود داشته باشد، گستره حیات می‌گویند."
      },
      {
        id: "fc2",
        front: "یک ویژگی مشترک همه موجودات زنده را نام ببر.",
        back: "پاسخ به محرک، تولیدمثل، رشد و داشتن نظم در ساختار."
      }
      // هر چندتا فلش‌کارت که برای این گفتار داری، اینجا اضافه کن
    ],
    examQuestions: [
      {
        id: "ex1",
        question: "کدام گزینه درباره گستره حیات صحیح است؟",
        options: [
          "شامل فقط خشکی‌هاست",
          "شامل تمام نواحی قابل زیست برای موجودات زنده است",
          "فقط نواحی استوایی را شامل می‌شود",
          "فقط آب‌های شیرین را شامل می‌شود"
        ],
        correctIndex: 1
      },
      {
        id: "ex2",
        question: "کدام مورد جزء ویژگی‌های مشترک همه موجودات زنده نیست؟",
        options: ["تولیدمثل", "رشد", "تنفس هوازی", "پاسخ به محرک"],
        correctIndex: 2
      }
      // بقیه‌ی سوال‌های امتحان
    ],
    speedQuestions: [
      {
        id: "sp1",
        question: "واژه «گستره حیات» به چه اشاره دارد؟",
        options: [
          "همه جاهایی که در آن‌ها زندگی انسان ممکن است",
          "همه نواحی زمین که در آن‌ها هر نوع حیات ممکن است",
          "فقط محیط‌های خشکی",
          "فقط محیط‌های آبی"
        ],
        correctIndex: 1
      },
      {
        id: "sp2",
        question: "کدام ویژگی، واکنش موجود زنده به محیط را نشان می‌دهد؟",
        options: ["رشد", "تولیدمثل", "پاسخ به محرک", "متابولیسم"],
        correctIndex: 2
      }
      // بقیه‌ی سوال‌های تست سرعتی
    ]
  }

  // گفتارهای دیگر را هم به همین شکل اضافه کن
]

export function getLessonContent(lessonKey: string): LessonContent | undefined {
  return lessonsContent.find(lesson => lesson.lessonKey === lessonKey)
}
