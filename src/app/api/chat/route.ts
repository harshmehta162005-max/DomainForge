import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getGroqClient, GROQ_MODELS } from "@/lib/groq/client"
import { z } from "zod"

const ChatRequestSchema = z.object({
  messages: z.array(
    z.object({
      role: z.enum(["user", "assistant"]),
      content: z.string(),
    })
  ),
})

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 }
    )
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const parsed = ChatRequestSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed" }, { status: 400 })
  }

  // Fetch user's watchlist to use as context
  const { data: watchlistRaw } = await supabase
    .from("watchlist")
    .select("domain, status, notes")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  const watchlistContext = (watchlistRaw ?? []).length > 0 
    ? `User's current watchlist:\n${(watchlistRaw ?? []).map(r => `- ${r.domain} (Status: ${r.status})${r.notes ? ` Notes: ${r.notes}` : ''}`).join('\n')}`
    : `User's current watchlist is empty.`

  const systemMessage = {
    role: "system",
    content: `You are an expert AI domain intelligence assistant for an app called DomainForge.
Your goal is to help the user evaluate domains, brainstorm alternatives, assess SEO/trademark risks, and pick the best names.
Keep your answers relatively concise, professional, and helpful.
Use the following context about the user's saved domains to personalize your answers if they ask about their domains.

${watchlistContext}
`
  }

  try {
    const groq = getGroqClient()
    
    const messages = [systemMessage, ...parsed.data.messages]
    
    const chatCompletion = await groq.chat.completions.create({
      messages: messages as any,
      model: GROQ_MODELS.fast,
      max_tokens: 1024,
      temperature: 0.7,
    })

    const reply = chatCompletion.choices[0]?.message?.content || "I'm sorry, I couldn't generate a response."

    return NextResponse.json({ reply })
  } catch (error) {
    console.error("[POST /api/chat] Groq error:", error)
    return NextResponse.json(
      { error: "Failed to generate response." },
      { status: 500 }
    )
  }
}
