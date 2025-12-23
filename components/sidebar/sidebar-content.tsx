import { Tables } from "@/supabase/types"
import { ContentType, DataListType } from "@/types"
import { FC, useState, useEffect } from "react" // useEffect اضافه شد
import { SidebarCreateButtons } from "./sidebar-create-buttons"
import { SidebarDataList } from "./sidebar-data-list"
import { SidebarSearch } from "./sidebar-search"

interface SidebarContentProps {
  contentType: ContentType
  data: DataListType
  folders: Tables<"folders">[]
}

export const SidebarContent: FC<SidebarContentProps> = ({
  contentType,
  data,
  folders
}) => {
  const [searchTerm, setSearchTerm] = useState("")
  // استیت جدید برای کنترل تعداد نمایش
  const [displayLimit, setDisplayLimit] = useState(20)

  // این افکت باعث می‌شود ابتدا فقط ۲۰ تا لود شود،
  // و بعد از اینکه صفحه کامل بالا آمد (۳ ثانیه بعد)، بقیه لیست ظاهر شود.
  useEffect(() => {
    const timer = setTimeout(() => {
      setDisplayLimit(1000) // یا هر عدد بزرگی که همه را پوشش دهد
    }, 3000)
    return () => clearTimeout(timer)
  }, [])

  const filteredData: any = data.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // اینجا دیتا را برش می‌زنیم (Slicing)
  const slicedData = filteredData.slice(0, displayLimit)

  return (
    <div className="flex max-h-[calc(100%-50px)] max-w-full grow flex-col overflow-x-hidden px-1">
      <div className="mt-2 flex items-center">
        <SidebarCreateButtons
          contentType={contentType}
          hasData={data.length > 0}
        />
      </div>

      <div className="mt-2">
        <SidebarSearch
          contentType={contentType}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
        />
      </div>

      <SidebarDataList
        contentType={contentType}
        data={slicedData} // دیتای محدود شده را پاس می‌دهیم
        folders={folders}
      />
    </div>
  )
}
