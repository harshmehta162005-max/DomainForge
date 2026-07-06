import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.join(__dirname, '.env.local') })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function test() {
  const { data, error } = await supabase
    .from("activity_history")
    .select("id, domain, event_type, note, created_at, user_id")
    .order("created_at", { ascending: false })
    .limit(5)

  console.log("Error:", error)
  console.log("Data:", data)
}

test()
