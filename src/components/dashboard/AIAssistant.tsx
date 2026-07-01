"use client"

import { useState, useRef, useEffect } from "react"
import { MessageSquare, X, Send, Bot } from "lucide-react"
import { cn } from "@/lib/utils"
import { AnimatePresence, motion } from "framer-motion"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
}

const STARTER_PROMPTS = [
  "Why is forge.ai a good domain?",
  "Suggest alternatives for my top picks",
  "What's a good .io domain for a fintech startup?",
]



export function AIAssistant() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "0",
      role: "assistant",
      content: "Hello! I'm your domain intelligence assistant. Ask me about any domain in your watchlist, or request suggestions.",
    }
  ])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleSend = async () => {
    const q = input.trim()
    if (!q || loading) return
    setInput("")

    const userMsg: Message = { id: Date.now().toString(), role: "user", content: q }
    const updatedMessages = [...messages, userMsg]
    setMessages(updatedMessages)
    setLoading(true)

    try {
      // Exclude the very first welcome message from context to save tokens, or leave it. 
      // We will just pass the entire user conversation.
      const apiMessages = updatedMessages
        .filter(m => m.id !== "0") // filter out the initial welcome message from API
        .map(m => ({ role: m.role, content: m.content }))

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: apiMessages }),
      })

      if (!response.ok) throw new Error("API failed")

      const data = await response.json()
      
      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.reply || "Something went wrong.",
      }
      setMessages(prev => [...prev, aiMsg])
    } catch (error) {
      console.error(error)
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Sorry, I encountered an error connecting to the API. Please try again later.",
      }
      setMessages(prev => [...prev, errorMsg])
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <>
      {/* Floating trigger */}
      <button
        id="ai-assistant-toggle"
        onClick={() => setOpen(true)}
        className={cn(
          "fixed bottom-6 right-6 h-10 w-10 rounded-[4px] bg-cyan-400 text-zinc-950 flex items-center justify-center shadow-lg hover:bg-cyan-300 transition-colors duration-150 z-40",
          open && "hidden"
        )}
        title="AI Assistant"
      >
        <MessageSquare className="h-5 w-5" strokeWidth={1.5} />
      </button>

      {/* Panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="ai-panel"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="fixed bottom-6 right-6 w-80 bg-zinc-900 border border-zinc-700 rounded-[6px] flex flex-col shadow-2xl z-40 overflow-hidden"
            style={{ maxHeight: "480px" }}
          >
            {/* Header */}
            <div className="flex items-center gap-2 px-3 py-2.5 border-b border-zinc-800 flex-shrink-0">
              <Bot className="h-4 w-4 text-cyan-400" strokeWidth={1.5} />
              <span className="text-sm font-medium text-zinc-200 flex-1">Domain assistant</span>
              <button
                onClick={() => setOpen(false)}
                className="h-6 w-6 flex items-center justify-center rounded-[2px] text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
              {messages.map(msg => (
                <div
                  key={msg.id}
                  className={cn(
                    "text-sm leading-relaxed",
                    msg.role === "user"
                      ? "text-zinc-100 ml-6"
                      : "text-zinc-300"
                  )}
                >
                  {msg.role === "assistant" && (
                    <Bot className="h-3 w-3 text-cyan-400 inline mr-1 mb-0.5" strokeWidth={1.5} />
                  )}
                  {msg.content}
                </div>
              ))}
              {loading && (
                <div className="text-zinc-500 text-xs animate-pulse">
                  Thinking…
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Starter prompts */}
            {messages.length <= 1 && (
              <div className="px-3 pb-2 flex flex-col gap-1">
                {STARTER_PROMPTS.map(p => (
                  <button
                    key={p}
                    onClick={() => { setInput(p); }}
                    className="text-xs text-left text-zinc-500 hover:text-zinc-300 border border-zinc-800 hover:border-zinc-700 rounded-[4px] px-2 py-1.5 transition-colors duration-100"
                  >
                    {p}
                  </button>
                ))}
              </div>
            )}

            {/* Input */}
            <div className="border-t border-zinc-800 px-3 py-2 flex gap-2 flex-shrink-0">
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about any domain…"
                className="flex-1 h-8 px-2 bg-zinc-950 border border-zinc-700 rounded-[4px] text-xs text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 transition-colors duration-150"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || loading}
                className="h-8 w-8 flex items-center justify-center rounded-[4px] bg-cyan-400 text-zinc-950 hover:bg-cyan-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors duration-150"
              >
                <Send className="h-3.5 w-3.5" strokeWidth={1.5} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
