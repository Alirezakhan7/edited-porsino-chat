"use client"

import { useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from "@/components/ui/accordion"
import { Progress } from "@/components/ui/progress"
import {
  IconBook,
  IconChevronDown,
  IconMicroscope,
  IconDna,
  IconPlant,
  IconRun,
  IconSparkles
} from "@tabler/icons-react"
import { motion } from "framer-motion"

// --- داده‌های موقت (Mock Data) ---
const learningData = {
  دهم: {
    title: "زیست‌شناسی دهم",
    overallProgress: 25,
    chapters: [
      {
        id: "ch1-10",
        title: "فصل ۱: دنیای زنده",
        icon: IconMicroscope,
        progress: 45,
        sections: [
          { id: "s1", title: "گفتار ۱: گستره حیات", progress: 100 },
          { id: "s2", title: "گفتار ۲: مولکول‌های زیستی", progress: 30 },
          { id: "s3", title: "گفتار ۳: آب و...", progress: 0 }
        ]
      },
      {
        id: "ch2-10",
        title: "فصل ۲: گوارش و جذب مواد",
        icon: IconRun,
        progress: 10,
        sections: [
          { id: "s4", title: "گفتار ۱: ساختار و...", progress: 20 },
          { id: "s5", title: "گفتار ۲: جذب مواد", progress: 0 }
        ]
      }
    ]
  },
  یازدهم: {
    title: "زیست‌شناسی یازدهم",
    overallProgress: 0,
    chapters: [
      {
        id: "ch1-11",
        title: "فصل ۱: تنظیم عصبی",
        icon: IconDna,
        progress: 0,
        sections: [{ id: "s6", title: "گفتار ۱: یاخته‌های عصبی", progress: 0 }]
      }
    ]
  },
  دوازدهم: {
    title: "زیست‌شناسی دوازدهم",
    overallProgress: 0,
    chapters: [
      {
        id: "ch1-12",
        title: "فصل ۱: مولکول‌های اطلاعاتی",
        icon: IconDna,
        progress: 0,
        sections: [{ id: "s7", title: "گفتار ۱: نوکلئیک اسیدها", progress: 0 }]
      },
      {
        id: "ch2-12",
        title: "فصل ۲: جریان اطلاعات",
        icon: IconPlant,
        progress: 0,
        sections: [{ id: "s8", title: "گفتار ۱: رونویسی", progress: 0 }]
      }
    ]
  }
}

type GradeKey = "دهم" | "یازدهم" | "دوازدهم"

// انیمیشن‌ها
const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.05, duration: 0.3 }
  })
}

export default function PathPage() {
  const [activeTab, setActiveTab] = useState<GradeKey>("دهم")
  const router = useRouter()
  const params = useParams<{ locale: string }>()
  const locale = params.locale ?? "fa"

  const currentData = learningData[activeTab]

  const handleSectionClick = (chapterId: string, sectionId: string) => {
    router.push(`/${locale}/lesson/${chapterId}/${sectionId}`)
  }

  return (
    <div
      dir="rtl"
      className="animate-fade-down relative size-full overflow-y-auto px-4 pb-8 pt-6 md:px-8"
    >
      <div className="relative z-10 mx-auto max-w-5xl">
        {/* هدر صفحه */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 text-center"
        >
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-blue-500/20 to-purple-500/20 px-5 py-2 backdrop-blur-sm">
            <IconSparkles
              size={20}
              className="text-purple-600 dark:text-purple-400"
            />
            <span className="text-sm font-semibold text-purple-700 dark:text-purple-300">
              مسیر یادگیری من
            </span>
          </div>
          <h1 className="bg-gradient-to-l from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-3xl font-bold tracking-tight text-transparent md:text-4xl">
            سفر یادگیری زیست‌شناسی
          </h1>
          <p className="text-muted-foreground mt-2">
            پیشرفت خود را در هر پایه دنبال کنید
          </p>
        </motion.div>

        {/* تب‌های پایه تحصیلی */}
        <Tabs
          defaultValue="دهم"
          className="w-full"
          onValueChange={value => setActiveTab(value as GradeKey)}
        >
          <TabsList className="mb-8 grid h-auto w-full grid-cols-3 gap-2 bg-transparent p-0">
            <TabsTrigger
              value="دوازدهم"
              className="rounded-xl border-2 border-transparent bg-gradient-to-br from-pink-500/10 to-pink-500/5 py-3 font-semibold shadow-sm transition-all hover:from-pink-500/20 hover:to-pink-500/10 data-[state=active]:border-pink-500 data-[state=active]:from-pink-500 data-[state=active]:to-pink-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-pink-500/30"
            >
              دوازدهم
            </TabsTrigger>
            <TabsTrigger
              value="یازدهم"
              className="rounded-xl border-2 border-transparent bg-gradient-to-br from-purple-500/10 to-purple-500/5 py-3 font-semibold shadow-sm transition-all hover:from-purple-500/20 hover:to-purple-500/10 data-[state=active]:border-purple-500 data-[state=active]:from-purple-500 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-purple-500/30"
            >
              یازدهم
            </TabsTrigger>
            <TabsTrigger
              value="دهم"
              className="rounded-xl border-2 border-transparent bg-gradient-to-br from-blue-500/10 to-blue-500/5 py-3 font-semibold shadow-sm transition-all hover:from-blue-500/20 hover:to-blue-500/10 data-[state=active]:border-blue-500 data-[state=active]:from-blue-500 data-[state=active]:to-blue-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-blue-500/30"
            >
              دهم
            </TabsTrigger>
          </TabsList>

          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            {/* کارت پیشرفت کلی */}
            <motion.section
              initial="hidden"
              animate="visible"
              variants={itemVariants}
              custom={0}
              className="mb-8 overflow-hidden rounded-2xl border border-purple-500/30 bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10 p-6 shadow-xl backdrop-blur-sm"
            >
              <div className="mb-4 flex items-center justify-between">
                <div className="text-right">
                  <h2 className="text-2xl font-bold">{currentData.title}</h2>
                  <p className="text-muted-foreground mt-1 text-sm">
                    پیشرفت کلی در این پایه
                  </p>
                </div>
                <div className="flex size-16 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/50 ring-4 ring-purple-500/20">
                  <span className="text-xl font-bold">
                    {currentData.overallProgress}٪
                  </span>
                </div>
              </div>
              <div className="relative">
                <Progress
                  value={currentData.overallProgress}
                  className="bg-muted/50 h-3 overflow-hidden rounded-full shadow-inner"
                />
              </div>
            </motion.section>

            {/* فهرست فصل‌ها */}
            <div className="mb-4 flex items-center gap-2">
              <div className="size-1 rounded-full bg-gradient-to-r from-blue-500 to-purple-500" />
              <h3 className="text-lg font-bold">فهرست فصل‌ها</h3>
              <div className="h-px flex-1 bg-gradient-to-l from-transparent via-purple-500/50 to-transparent" />
            </div>

            <Accordion type="multiple" className="w-full space-y-4">
              {currentData.chapters.map((chapter, index) => {
                const colors = [
                  {
                    from: "from-blue-500/20",
                    to: "to-blue-500/10",
                    ring: "ring-blue-500/20",
                    text: "text-blue-600 dark:text-blue-400",
                    shadow: "shadow-blue-500/10",
                    hover: "hover:shadow-blue-500/20",
                    bg: "bg-blue-500/10"
                  },
                  {
                    from: "from-purple-500/20",
                    to: "to-purple-500/10",
                    ring: "ring-purple-500/20",
                    text: "text-purple-600 dark:text-purple-400",
                    shadow: "shadow-purple-500/10",
                    hover: "hover:shadow-purple-500/20",
                    bg: "bg-purple-500/10"
                  },
                  {
                    from: "from-pink-500/20",
                    to: "to-pink-500/10",
                    ring: "ring-pink-500/20",
                    text: "text-pink-600 dark:text-pink-400",
                    shadow: "shadow-pink-500/10",
                    hover: "hover:shadow-pink-500/20",
                    bg: "bg-pink-500/10"
                  },
                  {
                    from: "from-emerald-500/20",
                    to: "to-emerald-500/10",
                    ring: "ring-emerald-500/20",
                    text: "text-emerald-600 dark:text-emerald-400",
                    shadow: "shadow-emerald-500/10",
                    hover: "hover:shadow-emerald-500/20",
                    bg: "bg-emerald-500/10"
                  }
                ]
                const color = colors[index % colors.length]

                return (
                  <motion.div
                    key={chapter.id}
                    initial="hidden"
                    animate="visible"
                    variants={itemVariants}
                    custom={index + 1}
                  >
                    <AccordionItem
                      value={chapter.id}
                      className={`overflow-hidden rounded-2xl border-0 bg-gradient-to-br ${color.from} ${color.to} shadow-lg ${color.shadow} backdrop-blur-sm transition-all ${color.hover} hover:shadow-xl`}
                    >
                      <AccordionTrigger className="group w-full p-5 text-right hover:no-underline [&[data-state=open]>div>div:first-child>svg]:rotate-180">
                        <div className="flex w-full items-center justify-between gap-4">
                          <div className="flex items-center gap-3">
                            <IconChevronDown
                              size={20}
                              className={`${color.text} transition-transform duration-300`}
                            />
                            <div className="text-left">
                              <div
                                className={`text-sm font-bold ${color.text}`}
                              >
                                {chapter.progress}٪
                              </div>
                              <div
                                className={`mt-1 h-1.5 w-16 overflow-hidden rounded-full ${color.bg}`}
                              >
                                <div
                                  className={`h-full bg-gradient-to-l ${color.from.replace("/20", "")} ${color.to.replace("/10", "")} transition-all`}
                                  style={{ width: `${chapter.progress}%` }}
                                />
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <h4 className="text-base font-bold">
                                {chapter.title}
                              </h4>
                              <p className="text-muted-foreground mt-1 text-xs">
                                {chapter.sections.length} گفتار
                              </p>
                            </div>
                            <div
                              className={`flex size-14 items-center justify-center rounded-xl bg-gradient-to-br ${color.from} ${color.to} ${color.text} shadow-lg ${color.shadow} ring-2 ${color.ring} transition-all group-hover:scale-110 group-hover:shadow-xl ${color.hover}`}
                            >
                              <chapter.icon size={28} strokeWidth={2} />
                            </div>
                          </div>
                        </div>
                      </AccordionTrigger>

                      <AccordionContent className="px-5 pb-5">
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.3 }}
                          className="bg-background/80 space-y-2 rounded-xl p-4 shadow-inner backdrop-blur-sm"
                        >
                          {chapter.sections.map((section, idx) => (
                            <motion.div
                              key={section.id}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: idx * 0.05 }}
                              onClick={() =>
                                handleSectionClick(chapter.id, section.id)
                              }
                              className={`hover: group flex cursor-pointer items-center justify-between rounded-lg p-3 transition-all${color.bg} hover:shadow-md`}
                            >
                              <div className="flex items-center gap-2">
                                {section.progress === 100 && (
                                  <div className="flex size-6 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-green-600 text-white shadow-lg shadow-emerald-500/50">
                                    <svg
                                      className="size-4"
                                      fill="none"
                                      viewBox="0 0 24 24"
                                      stroke="currentColor"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M5 13l4 4L19 7"
                                      />
                                    </svg>
                                  </div>
                                )}
                                <span
                                  className={`min-w-12 text-left text-xs font-bold ${color.text}`}
                                >
                                  {section.progress}٪
                                </span>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="text-right text-sm font-medium">
                                  {section.title}
                                </span>
                                <div
                                  className={`bg-muted group-hover: flex size-9 items-center justify-center rounded-lg transition-all${color.bg} group-hover:${color.text}`}
                                >
                                  <IconBook size={18} strokeWidth={2} />
                                </div>
                              </div>
                            </motion.div>
                          ))}
                        </motion.div>
                      </AccordionContent>
                    </AccordionItem>
                  </motion.div>
                )
              })}
            </Accordion>
          </motion.div>
        </Tabs>
      </div>
    </div>
  )
}
