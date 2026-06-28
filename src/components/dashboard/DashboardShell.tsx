"use client"

import { useState, useEffect } from "react"
import { Sidebar } from "./Sidebar"
import { TopBar } from "./TopBar"
import { ToastProvider } from "@/components/ui/Toast"

interface DashboardShellProps {
  children: React.ReactNode
  userEmail?: string | null
}

const SIDEBAR_STORAGE_KEY = "domainforge-sidebar-collapsed"

export function DashboardShell({ children, userEmail }: DashboardShellProps) {
  const [collapsed, setCollapsed] = useState(false)

  // Persist sidebar state in localStorage
  useEffect(() => {
    const stored = localStorage.getItem(SIDEBAR_STORAGE_KEY)
    if (stored === "true") setCollapsed(true)
  }, [])

  const handleToggle = () => {
    setCollapsed(prev => {
      const next = !prev
      localStorage.setItem(SIDEBAR_STORAGE_KEY, String(next))
      return next
    })
  }

  return (
    <ToastProvider>
      <div className="flex h-screen bg-zinc-950 overflow-hidden">
        <Sidebar
          collapsed={collapsed}
          onToggle={handleToggle}
          userEmail={userEmail}
        />
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <TopBar userEmail={userEmail} />
          <main className="flex-1 overflow-y-auto overflow-x-hidden">
            {children}
          </main>
        </div>
      </div>
    </ToastProvider>
  )
}
