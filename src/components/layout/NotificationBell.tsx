"use client"

import { useState, useEffect, useRef } from "react"
import { Bell, Check, ExternalLink, RefreshCcw } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { formatDistanceToNow } from "date-fns"
import { cn } from "@/lib/utils"
import Link from "next/link"

interface Notification {
  id: string
  domain: string
  event_type: string
  note: string
  created_at: string
  is_read: boolean
}

export function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [loading, setLoading] = useState(true)

  const unreadCount = notifications.filter(n => !n.is_read).length
  const displayCount = isExpanded ? notifications.length : Math.min(notifications.length, 4)
  const visibleNotifications = notifications.slice(0, displayCount)

  const fetchNotifications = async () => {
    try {
      const res = await fetch("/api/notifications")
      if (res.ok) {
        const data = await res.json()
        setNotifications(data.notifications || [])
      }
    } catch (err) {
      console.error("Failed to fetch notifications", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchNotifications()
    const interval = setInterval(fetchNotifications, 60000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (isOpen) {
      fetchNotifications() // fetch immediately when user opens the bell
    } else {
      setTimeout(() => setIsExpanded(false), 200)
    }
  }, [isOpen])

  const markAllAsRead = async () => {
    if (unreadCount === 0) return
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ markAll: true })
    })
  }

  const markAsRead = async (id: string, currentlyRead: boolean) => {
    if (currentlyRead) return
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: [id] })
    })
  }

  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside)
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isOpen])

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative h-8 w-8 flex items-center justify-center rounded-[4px] text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 transition-colors duration-150 outline-none cursor-pointer"
        title="Notifications"
      >
        <Bell className="h-4 w-4" strokeWidth={1.5} />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-cyan-400 ring-[1.5px] ring-zinc-950 animate-in zoom-in" />
        )}
      </button>
      
      {isOpen && (
        <div 
          className={cn(
            "absolute right-0 top-full mt-2 z-50 w-80 p-0 bg-zinc-950 border border-zinc-800 rounded-lg shadow-xl overflow-hidden transition-all duration-300 animate-in fade-in zoom-in-95 origin-top-right",
            isExpanded ? "max-h-[500px]" : "max-h-[400px]"
          )}
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 bg-zinc-900/50">
            <h3 className="text-sm font-medium text-zinc-200">Notifications</h3>
            {unreadCount > 0 && (
              <button 
                onClick={markAllAsRead}
                className="text-xs text-zinc-500 hover:text-cyan-400 flex items-center gap-1 transition-colors z-10 relative"
              >
                <Check className="h-3 w-3" />
                Mark all read
              </button>
            )}
          </div>

          <div className={cn(
            "overflow-y-auto overflow-x-hidden",
            isExpanded ? "max-h-[400px]" : "max-h-[300px]"
          )}>
            {loading ? (
              <div className="flex flex-col items-center justify-center py-8 text-zinc-500">
                <RefreshCcw className="h-4 w-4 animate-spin mb-2" />
                <span className="text-xs">Loading...</span>
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-zinc-500">
                <Bell className="h-6 w-6 mb-2 opacity-20" />
                <span className="text-sm">No notifications yet</span>
              </div>
            ) : (
              <div className="flex flex-col relative z-10">
                {visibleNotifications.map((notif) => (
                  <div 
                    key={notif.id}
                    onClick={() => markAsRead(notif.id, notif.is_read)}
                    className={cn(
                      "flex flex-col gap-1 px-4 py-3 border-b border-zinc-800/50 last:border-0 hover:bg-zinc-900/50 transition-colors cursor-pointer group relative",
                      !notif.is_read && "bg-cyan-950/10"
                    )}
                  >
                    {!notif.is_read && (
                      <span className="absolute left-1.5 top-1/2 -translate-y-1/2 h-1.5 w-1.5 rounded-full bg-cyan-400" />
                    )}
                    <div className="flex items-center justify-between gap-2 pl-2">
                      <span className="text-sm font-medium text-zinc-200 truncate">
                        {notif.domain}
                      </span>
                      <span className="text-[10px] text-zinc-500 whitespace-nowrap">
                        {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true })}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400 pl-2 leading-relaxed line-clamp-2">
                      {notif.note}
                    </p>
                    
                    {notif.event_type === "status_changed" && (
                      <Link 
                        href="/dashboard/watchlist"
                        className="ml-2 mt-1 text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity w-fit relative z-20"
                      >
                        View in watchlist
                        <ExternalLink className="h-3 w-3" />
                      </Link>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {!isExpanded && notifications.length > 4 && (
            <div className="p-2 border-t border-zinc-800 bg-zinc-950 relative z-10">
              <button
                onClick={() => setIsExpanded(true)}
                className="w-full py-1.5 text-xs text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 rounded transition-colors cursor-pointer"
              >
                View more ({notifications.length - 4})
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
