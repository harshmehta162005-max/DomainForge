import Link from "next/link"
import { ArrowLeft, Bell } from "lucide-react"
import { NotificationsForm } from "@/components/profile/NotificationsForm"

export default function NotificationSettingsPage() {
  return (
    <div className="px-6 py-8 max-w-[720px] mx-auto">
      <div className="mb-8">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-300 transition-colors duration-150 mb-4"
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={1.5} />
          Back to dashboard
        </Link>
        <h1 className="text-xl font-semibold text-zinc-100 flex items-center gap-2">
          <Bell className="h-5 w-5 text-cyan-400" strokeWidth={1.5} />
          Notification Preferences
        </h1>
        <p className="text-sm text-zinc-500 mt-1">
          Manage how and when DomainForge sends you emails.
        </p>
      </div>

      <NotificationsForm />
    </div>
  )
}
