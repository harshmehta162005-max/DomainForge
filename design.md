# DomainForge — Brand Bible & Design System
# Inject this at the TOP of every design session. Silence = Claude defaults.
# Last updated: 2026-06-25

---

## CORE PHILOSOPHY

Clean, modern, trustworthy tech tool. Think “professional version of Namecheap + Linear + Vercel”.
Data-dense but not cluttered. Focus on clarity and speed above aesthetic novelty.
The domain name is the hero — monospaced, prominent, never buried in chrome.
One justified aesthetic risk: subtle terminal / data-viz inspiration in the results page.

---

## AESTHETIC DIRECTION

DomainForge is a **technical instrument, not a SaaS landing page.**
The aesthetic risk: treat it like a terminal/registry console — precision, data density, and typographic craft over decorative flourish.
Inspiration: domain registrar CLIs, RDAP terminals, ICANN's data aesthetic.
The domain name itself is the hero — monospaced, prominent, never buried.

---

## TYPOGRAPHY

### Font Pair
- **Primary (UI):** `Geist` (by Vercel) — clean, technical, modern sans
  - Weights used: 400 (body), 500 (label), 600 (heading), 700 (display)
  - Load: `next/font/google` or Vercel Geist package
- **Accent (Domain Names):** `JetBrains Mono` (preferred) / `DM Mono` (fallback) — for all domain string displays
  - Weights used: 400 (domain text), 600 (featured domain)
  - Used ONLY for domain strings, code, and technical identifiers

### Type Scale (rem-based, 4px base = 0.25rem)
```
xs:   0.75rem  / 12px — badges, metadata labels  (body min: 12px)
sm:   0.875rem / 14px — body text, secondary, captions  (← standard body size)
base: 1rem     / 16px — inputs, prominent labels
lg:   1.125rem / 18px — card headings
xl:   1.25rem  / 20px — section labels
2xl:  1.5rem   / 24px — page subheadings  (← max heading at sm breakpoint)
3xl:  1.875rem / 30px — page headings
4xl:  2.25rem  / 36px — hero heading
5xl:  3rem     / 48px — display (max)
```

---

## COLOR PALETTE

### Dark Mode (Primary — Dark First)
```
background:      #09090b   (zinc-950) — page background
surface:         #18181b   (zinc-900) — card/panel surface
surface-elevated: #27272a  (zinc-800) — inputs, dropdowns
border:          #3f3f46   (zinc-700) — dividers, card borders
border-subtle:   #27272a   (zinc-800) — inner borders
text-primary:    #fafafa   (zinc-50)  — primary text
text-secondary:  #a1a1aa   (zinc-400) — secondary, metadata
text-muted:      #71717a   (zinc-500) — placeholder, disabled
```

### Accent Palette
```
accent:          #22d3ee   (cyan-400) — primary actions, CTAs
accent-hover:    #06b6d4   (cyan-500) — hover state
accent-muted:    #164e63   (cyan-900) — subtle accent bg (chips, tags)
accent-text:     #cffafe   (cyan-50)  — text on accent bg

success:         #4ade80   (green-400) — available domain
success-bg:      #14532d   (green-950) — available domain bg
error:           #f87171   (red-400)  — taken domain
error-bg:        #450a0a   (red-950)  — taken domain bg
warning:         #fb923c   (orange-400) — premium/unknown
warning-bg:      #431407   (orange-950) — premium bg
```

### Light Mode (Secondary)
```
background:      #fafafa   (zinc-50)
surface:         #ffffff
surface-elevated: #f4f4f5  (zinc-100)
border:          #e4e4e7   (zinc-200)
text-primary:    #09090b   (zinc-950)
text-secondary:  #71717a   (zinc-500)
accent:          #0891b2   (cyan-600)  — darker on light bg
```

---

## SPACING SYSTEM

Base unit: 4px (0.25rem)

```
1 → 4px   (0.25rem) — micro gaps (icon-text spacing)
2 → 8px   (0.5rem)  — tight (badge padding)
3 → 12px  (0.75rem) — compact (inline elements)
4 → 16px  (1rem)    — base (card padding, gaps)
5 → 20px  (1.25rem) — loose (section separation within cards)
6 → 24px  (1.5rem)  — section gaps
8 → 32px  (2rem)    — component separation
10 → 40px (2.5rem)  — large section spacing
12 → 48px (3rem)    — page-level spacing
16 → 64px (4rem)    — hero/section margins
```

---

## SHAPE LANGUAGE

```
border-radius:
  none:   0px   — table cells, tag dividers
  sm:     2px   — badges, status indicators
  base:   4px   — cards, inputs, buttons (PRIMARY — use this most)
  md:     6px   — modals, dropdowns
  lg:     8px   — large panels (use sparingly)
  full:   9999px — ONLY for toggle switches. Never for buttons.
```

**Rule:** Default to 4px. Never `rounded-xl`, `rounded-2xl`, or `rounded-full` on buttons.

---

## MOTION & ANIMATION

```
duration-fast:   150ms — hover states
duration-base:   200ms — transitions
duration-slow:   300ms — modals, drawers
easing:          cubic-bezier(0.16, 1, 0.3, 1) — ease-out (snappy)
```

**Allowed:** opacity fade, transform translateY (≤ 4px), scale (0.98–1.00)
**Banned:** bounce · elastic · spring · rotate · blur transitions · stagger cascades

---

## COMPONENT CONVENTIONS

### Buttons
```
Primary:   bg-cyan-400 text-zinc-950 font-medium h-9 px-4 rounded-[4px] hover:bg-cyan-300
           → active:scale-[0.98] transition-all duration-150
Secondary: bg-zinc-800 text-zinc-100 border border-zinc-700 h-9 px-4 rounded-[4px]
Ghost:     text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 h-9 px-3 rounded-[4px]
Disabled:  opacity-40 cursor-not-allowed (never hidden)
```

### Inputs
```
height: 36px (h-9)
bg: zinc-900 (dark) / white (light)
border: 1px solid zinc-700 (dark) / zinc-200 (light)
border-radius: 4px
focus-ring: 2px solid cyan-400, offset 0
placeholder: zinc-500
font-size: 14px (sm)
```

### Domain Cards
```
anatomy:
  ┌─────────────────────────────────────┐
  │ [domain.tld]  (JetBrains Mono, lg)  │  ← domain name, monospace
  │ Score: 87 · .com · 10 chars         │  ← metadata row, zinc-500
  │                                     │
  │ [✓ Available]  [★ Save]   [↗ Buy]   │  ← action row
  └─────────────────────────────────────┘
surface: zinc-900
border: zinc-700
hover: border-cyan-400/40, bg-zinc-800
no cards inside cards. flat hierarchy only.
```

### Availability Badges
```
available: bg-green-950 text-green-400 border border-green-800 rounded-[2px] px-2 py-0.5 text-xs font-medium
taken:     bg-red-950 text-red-400 border border-red-800 ...
premium:   bg-orange-950 text-orange-400 border border-orange-800 ...
checking:  bg-zinc-800 text-zinc-400 border border-zinc-700 ... (with spinner)
```

### Navigation Header
```
height: 56px
bg: zinc-950/80 backdrop-blur-sm
border-bottom: 1px solid zinc-800
sticky top-0 z-50
logo: Geist 600, text-zinc-100 + small cyan-400 accent mark
```

---

## LAYOUT SYSTEM

### Page Layout
```
max-width: 1200px (max-w-5xl for content, max-w-7xl for full-bleed)
horizontal padding: 24px (px-6) mobile, 48px (px-12) desktop
page-top-padding: 64px (pt-16)
```

### Grid
```
Domain results: 2-col on desktop, 1-col on mobile (gap-3)
No masonry, no Pinterest-style grids
```

### Results Grid — Responsive Behavior
```
mobile (< 640px):  single column, full-width card stack
tablet (640–1024px): 2-column grid
desktop (> 1024px): 2-column grid OR table view with hover actions row
table view columns:  domain | score | tld | status | actions
hover actions:       [Check ↗] [Save ★] [Buy →]
```

### Loading States
```
Skeleton loaders — match exact shape of domain card (not generic gray blocks)
Progress text — "Generating names..." → "Checking availability..." → "Done"
Skeleton pulse: animate-pulse, zinc-800 bg, 200ms ease-in-out (NOT shimmer)
Never: spinner covering the whole page
```

---

## FORBIDDEN PATTERNS (THE AI DEFAULT FINGERPRINTS)

- ❌ Inter or DM Sans as the primary font
- ❌ Purple/violet gradients anywhere
- ❌ Cards nested inside cards
- ❌ Large rounded icons above h2 headings
- ❌ Bounce, elastic, or spring animations
- ❌ Gray text on colored/gradient backgrounds
- ❌ Oversized rounded CTA buttons (border-radius > 8px)
- ❌ Warm cream (#F4F1EA) color scheme
- ❌ Generic hero: big stat number + gradient accent + supporting stats row
- ❌ Glassmorphism backdrop-blur as primary design element
- ❌ Gradient text (background-clip: text)
- ❌ Floating, animated background blobs
- ❌ "Feature cards" with emoji icons

---

## VOICE & COPY RULES

- Write like a technical product, not a marketing site
- Headlines: sentence case, not Title Case
- CTA copy: verb + noun ("Generate names", "Check availability", "Save to watchlist")
- Error messages: specific and actionable ("RDAP query timed out. Try again." not "Something went wrong.")
- Empty states: explain why empty + one action ("No results yet. Describe your business above.")

---

## ICON SYSTEM

Library: `lucide-react` exclusively
Size: 16px (sm, inline) · 20px (base, buttons) · 24px (navigation)
Stroke: 1.5px (default)
Color: inherit (never hardcoded)
Never: FontAwesome, heroicons, emoji as icons

---

## DESIGN CRITIQUE CHECKLIST (run before building any component)

Before writing any JSX, answer:
- [ ] Does this look unique or like an LLM default?
- [ ] What is the one justified aesthetic risk in this component?
- [ ] Are domain names displayed in JetBrains Mono?
- [ ] Is the border-radius 4px (never rounded-full on non-toggle elements)?
- [ ] Are animations ease-out only (no bounce)?
- [ ] Is the color pulled from the palette above (no ad-hoc hex values)?
- [ ] Is this card nested inside another card?

---

## AESTHETIC RISK (Justified)

The results page should feel like a **smart terminal + modern data tool**:
- Clean monospace elements for domain names (JetBrains Mono / DM Mono)
- Strong, saturated status colors — not muted pastels
- Instant feedback on availability — no full-page loading states
- Dense but scannable layout — not sparse marketing cards

This is the one place to take the creative risk. Everywhere else: restraint.
