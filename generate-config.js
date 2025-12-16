const fs = require('fs');
const path = require('path');

// ============================================================
// تنظیمات
// ============================================================
const INPUT_FILE = 'porsino_gamified_db.json';            // نام فایل دیتای شما
const OUTPUT_FILE = 'generated-config.ts'; // نام فایلی که ساخته می‌شود
const CHUNKS_PER_STEP = 1;                 // 👈 تغییر نهایی: هر ۱ آیتم محتوا = ۱ پله در نقشه

// رنگ‌بندی‌های چرخشی برای فصل‌ها (گرادینت هدر)
const CHAPTER_THEMES = [
  "from-emerald-400 to-teal-500",
  "from-blue-400 to-indigo-500",
  "from-purple-400 to-fuchsia-500",
  "from-rose-400 to-red-500",
  "from-amber-400 to-orange-500",
  "from-cyan-400 to-blue-500",
];

// رنگ‌بندی‌های چرخشی برای گفتارها (دایره‌های روی نقشه)
const SECTION_THEMES = ["emerald", "blue", "purple", "rose", "amber", "cyan", "pink"];

// ============================================================
// بخش‌های ثابت فایل (Header & Footer)
// ============================================================

const FILE_HEADER = `// lib/lessons/config.ts
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
`;

const FILE_FOOTER = `];

// --- توابع کمکی (Helpers) ---

// ۱. پیدا کردن تنظیمات یک فصل خاص
export function getChapterConfig(chapterId: string): ChapterConfig | undefined {
  return chapters.find(c => c.id === chapterId)
}

// ۲. گرفتن لیست فصل‌های یک پایه خاص
export function getChaptersByGrade(grade: GradeLevel): ChapterConfig[] {
  return chapters.filter(c => c.grade === grade)
}
`;

// ============================================================
// منطق اصلی برنامه
// ============================================================

function generateFullConfig() {
  console.log("🚀 شروع عملیات ساخت فایل config.ts کامل...");

  try {
    // خواندن فایل جیسون
    const rawData = fs.readFileSync(path.join(__dirname, INPUT_FILE), 'utf8');
    let allData = JSON.parse(rawData);
    if (!Array.isArray(allData)) allData = [allData];

    // گروه‌بندی آیتم‌ها بر اساس "پایه + شماره فصل"
    const chaptersMap = {};

    allData.forEach(item => {
      // استخراج پایه از uid (مثلا bio10_... -> 10)
      const uidMatch = item.source_uids && item.source_uids[0].match(/bio(\d+)/);
      const grade = uidMatch ? uidMatch[1] : "10"; // پیش‌فرض ۱۰
      const chapterNum = item.chapter_number;
      
      // ساخت آیدی استاندارد: biology_10_ch01
      const key = `biology_${grade}_ch${String(chapterNum).padStart(2, '0')}`;

      if (!chaptersMap[key]) {
        chaptersMap[key] = {
          id: key,
          grade: grade,
          chapterNumber: chapterNum,
          items: []
        };
      }
      chaptersMap[key].items.push(item);
    });

    // تولید کد برای هر فصل
    let chaptersCode = "";
    let themeIndex = 0;

    // تبدیل آبجکت به آرایه و مرتب‌سازی بر اساس پایه و فصل
    const sortedChapters = Object.values(chaptersMap).sort((a, b) => {
      if (a.grade !== b.grade) return a.grade.localeCompare(b.grade);
      return a.chapterNumber - b.chapterNumber;
    });

    sortedChapters.forEach(chap => {
      // 1. مرتب‌سازی آیتم‌های داخل فصل بر اساس ایندکس گروه
      chap.items.sort((a, b) => a.group_index - b.group_index);

      // 2. محاسبات کلی فصل
      const totalChunks = chap.items.length;
      // چون CHUNKS_PER_STEP یک است، totalSteps دقیقا برابر با تعداد آیتم‌ها می‌شود
      const totalSteps = Math.ceil(totalChunks / CHUNKS_PER_STEP);
      
      const themeColor = CHAPTER_THEMES[themeIndex % CHAPTER_THEMES.length];
      themeIndex++;

      // 3. گروه‌بندی گفتارها (Sections)
      const sectionsMap = {};
      chap.items.forEach(item => {
        const lessonNum = item.lesson_number;
        if (!sectionsMap[lessonNum]) {
          sectionsMap[lessonNum] = {
            num: lessonNum,
            title: item.lesson_title,
            count: 0
          };
        }
        sectionsMap[lessonNum].count++;
      });

      // 4. محاسبه بازه‌های هر گفتار
      const sortedSections = Object.values(sectionsMap).sort((a, b) => a.num - b.num);
      let currentStepCursor = 1;
      
      const sectionsCodeArray = sortedSections.map((sec, idx) => {
        // سهم این گفتار از مراحل
        let sectionStepsCount = Math.ceil(sec.count / CHUNKS_PER_STEP);
        if (sectionStepsCount < 1) sectionStepsCount = 1;

        const start = currentStepCursor;
        let end = start + sectionStepsCount - 1;

        // اصلاحیه: اگر آخرین گفتار است، پایانش حتما باید پایان فصل باشد
        if (idx === sortedSections.length - 1) {
          end = totalSteps;
        }
        // جلوگیری از باگ احتمالی
        if (end > totalSteps) end = totalSteps;
        if (start > end) end = start;

        currentStepCursor = end + 1;

        return `      {
        id: "s${sec.num}",
        title: "گفتار ${sec.num}: ${sec.title}",
        startStep: ${start},
        endStep: ${end},
        theme: "${SECTION_THEMES[idx % SECTION_THEMES.length]}"
      }`;
      });

      // 5. ساخت استرینگ نهایی فصل
      chaptersCode += `  {
    id: "${chap.id}",
    grade: "${chap.grade}",
    chapterNumber: ${chap.chapterNumber},
    title: "فصل ${chap.chapterNumber} (پایه ${chap.grade})",
    description: "تعداد محتوا: ${totalChunks} آیتم",
    totalSteps: ${totalSteps},
    totalChunks: ${totalChunks},
    themeColor: "${themeColor}",
    sections: [
${sectionsCodeArray.join(',\n')}
    ]
  },\n`;
    });

    // ترکیب همه بخش‌ها
    const finalContent = FILE_HEADER + chaptersCode + FILE_FOOTER;

    // نوشتن فایل
    fs.writeFileSync(path.join(__dirname, OUTPUT_FILE), finalContent, 'utf8');

    console.log("✅ تمام شد!");
    console.log(`📂 فایل '${OUTPUT_FILE}' با موفقیت ساخته شد.`);
    console.log("👉 حالا محتویات آن را در 'lib/lessons/config.ts' کپی کنید.");

  } catch (err) {
    console.error("❌ خطا:", err.message);
  }
}

// اجرا
generateFullConfig();