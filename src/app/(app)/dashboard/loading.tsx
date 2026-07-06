import { ClassicLoader } from "@/components/ui/ClassicLoader"

export default function DashboardLoading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <ClassicLoader />
    </div>
  )
}
