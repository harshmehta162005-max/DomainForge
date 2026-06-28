# DomainForge — Ubiquitous Language & Domain Glossary
# Prevents Claude from using wrong meanings in ambiguous contexts.
# Always loaded via @CONTEXT.md reference in CLAUDE.md.

## CORE DOMAIN TERMS

### Domain (context: DNS/Web)
A human-readable address for a website. Example: `domainforge.io`
NOT: a "domain" in DDD sense (use "bounded context" for that).
Structure: `[subdomain.]second-level-domain.tld`

### TLD (Top-Level Domain)
The suffix of a domain. Examples: `.com`, `.io`, `.ai`, `.co`, `.dev`
Stored as: `string` (lowercase, without leading dot internally; with dot in display)

### SLD (Second-Level Domain)
The core registrable part. In `domainforge.io` → `domainforge` is the SLD.

### Domain Name Suggestion
A full domain string returned by the AI. Format: `sld.tld` (lowercase, no protocol).
Example: `"brandforge.ai"` NOT `"https://brandforge.ai"`

### Availability Status
Enum: `"available" | "taken" | "premium" | "unknown" | "checking"`
- `available` — RDAP confirms not registered
- `taken` — RDAP confirms registered
- `premium` — Available but at premium price (registry premium)
- `unknown` — RDAP query failed or inconclusive
- `checking` — In-flight RDAP request

### Generation Request
A user's input to the AI system. Contains:
- `prompt`: string — user's description of their business/idea
- `tone`: Tone — desired brand voice
- `tlds`: string[] — preferred TLD list
- `count`: number — how many suggestions to generate (default: 10)

### Tone
The brand voice filter for generation. Enum values:
- `"professional"` — corporate, trustworthy
- `"playful"` — fun, approachable
- `"technical"` — developer-focused, precise
- `"minimal"` — clean, understated
- `"bold"` — strong, memorable

### Domain Score
A 0–100 quality metric computed for each suggestion:
- Memorability (is it pronounceable?)
- Brevity (character count)
- TLD desirability (.com > .io > .ai > others)
- Brandability (no hyphens, no numbers)

### Watchlist
A user's saved list of domain suggestions they want to monitor.
Table: `watchlist` in Supabase.
One user → many watchlist entries.
One watchlist entry → one domain + one user.

### Domain Cache
Supabase table `domain_cache` storing RDAP results.
TTL: 5 minutes. Key: `domain` (full string). Value: `AvailabilityStatus`.

### RDAP (Registration Data Access Protocol)
The modern replacement for WHOIS. Free, no API key required.
Base URL: `https://rdap.org/domain/{domain}`
Response 404 → available. Response 200 → taken.

### Generation Session
One end-to-end user interaction: prompt submitted → AI generates → availability checked → results displayed.
NOT persisted to DB by default (only watchlist saves persist).

### Prompt Hash
SHA-256 of the normalized generation request (prompt + tone + tlds + count).
Used as cache key for Groq results.

## DATABASE ENTITIES

### users (managed by Supabase Auth)
```
id: uuid (auth.users FK)
email: string
created_at: timestamp
```

### domain_suggestions (ephemeral, not stored long-term)
Generated in memory, returned to client. NOT a DB table.

### watchlist
```
id: uuid
user_id: uuid (FK → auth.users)
domain: string (full domain, e.g. "brandforge.ai")
status: AvailabilityStatus
notes: string?
created_at: timestamp
```

### domain_cache
```
domain: string (PK)
status: AvailabilityStatus
checked_at: timestamp
expires_at: timestamp (checked_at + 5min)
```

## API CONTRACTS

### POST /api/generate
Request: `GenerationRequest`
Response: `{ suggestions: DomainSuggestion[], session_id: string }`

### POST /api/check-availability
Request: `{ domains: string[] }`
Response: `{ results: Record<string, AvailabilityStatus> }`

### POST /api/watchlist
Request: `{ domain: string, status: AvailabilityStatus }`
Response: `{ id: string }`

## WHAT WE DO NOT BUILD (Explicit Non-Goals)
- Domain registration (redirect to Namecheap/GoDaddy)
- WHOIS data display (only availability status)
- Bulk domain transfers
- DNS management
- Email configuration
