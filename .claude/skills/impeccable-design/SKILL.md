---
name: impeccable-design
description: 7 design domains, 20+ commands, curated anti-patterns from Paul Bakaus (jQuery UI creator). Actively prohibits the specific paths that lead to AI-generated aesthetic.
---

# Impeccable Design
Source: Paul Bakaus (jQuery UI original creator)
Tier: A — Active on all UI work. Pair with Frontend Design (Skill #03).

## How It Differs from Frontend Design Skill
- Frontend Design: creative direction (what to do)
- Impeccable Design: active blocking (what NOT to do)
Together they form a complete anti-slop shield.

## The 7 Design Domains

### Domain 1 — Typography
**BLOCK:** Using a single typeface for everything
**BLOCK:** Using Inter, DM Sans, or Nunito as primary (overused to AI-default status)
**BLOCK:** Font sizes below 12px for any user-facing text
**BLOCK:** Line height below 1.4 for body text

**DO:** Pair a UI font (Geist) with a monospace (JetBrains Mono)
**DO:** Establish a clear type scale with named roles (body, label, heading, display)
**DO:** Use font-weight variation within a family before reaching for a new family

### Domain 2 — Color
**BLOCK:** Gradient text (background-clip: text webkit-text-fill)
**BLOCK:** More than 3 accent colors in one UI
**BLOCK:** Warm neutrals (#F4F1EA, #F5F0EB) — the "cozy AI" aesthetic
**BLOCK:** Pure white (#FFFFFF) as the only background on dark themes
**BLOCK:** Opacity-based color mixing without understanding the resulting hex

**DO:** Define named color roles (surface, accent, on-surface, etc.)
**DO:** Use zinc/slate for dark themes (not custom dark grays that fight the system)
**DO:** Test contrast ratios (4.5:1 minimum for body text)

### Domain 3 — Spacing
**BLOCK:** Using margins and padding without a system
**BLOCK:** Spacing values that don't align to the 4px grid
**BLOCK:** Inconsistent gap values within the same component family

**DO:** 4px base unit — all spacing values must be multiples of 4
**DO:** Define named spacing tokens (tight: 8px, base: 16px, loose: 24px)
**DO:** Consistent internal padding for components of the same type

### Domain 4 — Shape
**BLOCK:** `rounded-xl`, `rounded-2xl`, `rounded-3xl` on buttons
**BLOCK:** `rounded-full` on anything other than toggle switches and avatar circles
**BLOCK:** Mixing multiple border-radius values in the same component set

**DO:** Lock border-radius to one value per component type
**DO:** For DomainForge: 4px for all interactive elements (buttons, inputs, cards)
**DO:** 2px for badges and status indicators

### Domain 5 — Motion
**BLOCK:** Bounce, elastic, spring, or overshoot animations of any kind
**BLOCK:** Stagger cascades (10 cards flying in one by one — always looks cheap)
**BLOCK:** Blur transitions (backdrop-filter animating between values)
**BLOCK:** Rotate animations on non-loading elements
**BLOCK:** Animation duration over 400ms (unless intentional cinematic effect)

**DO:** ease-out for entrances (fast start, slow end — feels natural)
**DO:** ease-in for exits (slow start, fast end — disappears quickly)
**DO:** max 300ms for UI transitions
**DO:** Only animate: opacity, transform (translate/scale), color

### Domain 6 — Layout
**BLOCK:** Cards nested inside cards (flat hierarchy only)
**BLOCK:** Asymmetric layouts created by accident (not by intention)
**BLOCK:** Grid systems with too many columns (12-col where 4-col would suffice)
**BLOCK:** Content areas wider than 800px without a strong reason

**DO:** Establish a clear visual hierarchy (what do eyes see first, second, third)
**DO:** Align everything to a grid
**DO:** White space is a design decision — not wasted space

### Domain 7 — Icons
**BLOCK:** Using emoji as UI icons (low quality, OS-dependent rendering)
**BLOCK:** Mixing icon libraries (Heroicons + Lucide + FontAwesome = visual chaos)
**BLOCK:** Icons larger than 24px inline with text
**BLOCK:** Icons without consistent stroke weight

**DO:** One icon library only (lucide-react for DomainForge)
**DO:** Consistent stroke weight (1.5px default in Lucide)
**DO:** Icons should inherit text color — never hardcode icon color

## The Impeccable Design Pre-Commit Checklist
Before committing any UI change:
- [ ] No more than 2 typefaces
- [ ] All spacing on 4px grid
- [ ] Border radius consistent within component family
- [ ] No bounce/elastic animations
- [ ] Color values from named palette (no ad-hoc hex)
- [ ] All icons from lucide-react only
- [ ] Contrast ratio checked on text elements
- [ ] No cards nested inside cards
- [ ] Motion: ease-out only, max 300ms
