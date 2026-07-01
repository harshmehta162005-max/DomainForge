import { NextResponse } from "next/server"
import { z } from "zod"
import { getGroqClient, GROQ_MODELS } from "@/lib/groq/client"
import { estimateDomainPrice } from "@/lib/domain/pipeline"

const ScoreRequestSchema = z.object({
  domain: z.string().min(1).max(253),
})

export async function POST(request: Request) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const parsed = ScoreRequestSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed" }, { status: 400 })
  }

  const { domain } = parsed.data
  const groq = getGroqClient()
  const prompt = `Analyze the domain name "${domain}". 
Evaluate its generic brandability, memorability, and commercial value on a scale of 0 to 100.
Provide exactly 3 short tags categorizing its style (e.g., 'Modern', 'Short', 'Catchy').
Respond ONLY with a raw JSON object (no markdown, no backticks) in this exact format:
{
  "score": 85,
  "tags": ["Tag1", "Tag2", "Tag3"]
}`

  try {
    const completion = await groq.chat.completions.create({
      model: GROQ_MODELS.fast,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
      max_tokens: 150,
      response_format: { type: "json_object" }
    })
    
    const content = completion.choices[0]?.message?.content ?? "{}"
    const result = JSON.parse(content)
    
    const finalScore = typeof result.score === "number" ? result.score : 50
    const finalTags = Array.isArray(result.tags) ? result.tags.slice(0, 3) : []

    const tldMatch = domain.match(/\.[a-z]+$/i)
    const tld = tldMatch ? tldMatch[0].toLowerCase() : ".com"
    const baseName = domain.replace(tld, "")
    const priceEstimate = estimateDomainPrice(tld, baseName, finalScore)
    
    return NextResponse.json({
      score: finalScore,
      tags: finalTags,
      priceEstimate
    })
  } catch (error) {
    const tldMatch = domain.match(/\.[a-z]+$/i)
    const tld = tldMatch ? tldMatch[0].toLowerCase() : ".com"
    const baseName = domain.replace(tld, "")
    const priceEstimate = estimateDomainPrice(tld, baseName, 50)
    
    return NextResponse.json({ score: 50, tags: ["Unknown"], priceEstimate })
  }
}
