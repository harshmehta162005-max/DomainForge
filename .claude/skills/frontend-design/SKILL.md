---
name: frontend-design
description: Anthropic's official anti-slop design skill. Escapes Inter-font-purple-gradient defaults. Makes UI look considered and intentional, not AI-generated.
---

# Frontend Design — Anti-Slop
Source: Anthropic (official skill)
Tier: S — Active on all UI work.

## Core Mandate
"Take one real aesthetic risk you can justify. The subject's own world — its materials, instruments, artifacts, and vernacular — is where distinctive choices come from. AI-generated design clusters around 3 looks. Don't spend your free axes on any of them."

## Before Building Any UI — Run This Checklist

### Step 1 — Design Critique
Ask yourself BEFORE writing any JSX:
1. "Does this design look unique, or does it look like an LLM output?"
2. "What is the ONE aesthetic risk I am taking in this component, and can I justify it?"
3. "Am I drawing from the subject's own world (domains, registries, terminals, CLI tools) or from UI template libraries?"

### Step 2 — Identify Your Aesthetic Risk
For DomainForge, the justified aesthetic risk is:
**Treating the UI like a technical instrument — terminal/registry console aesthetic — not a SaaS marketing page.**

This manifests as:
- Monospace (JetBrains Mono) prominently displayed for domain names
- Data-dense layouts, not spacious marketing layouts
- Status indicators that feel like system output, not friendly UI chips
- Precise, small type. Not oversized heroic typography.

### Step 3 — Verify Against Forbidden List
Before shipping, confirm none of these are present:
- [ ] Inter or DM Sans as primary font → use Geist instead
- [ ] Purple/violet gradient anywhere → replace with zinc palette
- [ ] Cards nested inside cards → flatten to single level
- [ ] Large rounded icons above h2 headings → remove icons or use inline
- [ ] Bounce, elastic, or spring animation → use ease-out only
- [ ] Gray text on colored backgrounds → text-primary on dark bg always
- [ ] Oversized rounded CTA buttons → 4px radius, h-9 height
- [ ] Warm cream + serif + terracotta combo → this is banned
- [ ] Big number + gradient stat row hero → banned

## The Three AI-Default Looks (Do Not Use Any of Them)
1. **SaaS Template** — Inter font, white background, purple accent, big rounded buttons, hero stats
2. **Startup Dark** — Gradient meshes, glassmorphism everywhere, neon accent, orbital animations
3. **Developer Tool** — Dark background, green/cyan code blocks, but still generic layout

DomainForge escapes all three by being a **precision instrument** — not a marketing site.

## Design Session Protocol
1. Open design.md first — every session
2. Run the critique checklist above
3. Name the aesthetic risk
4. Build
5. After building: run the forbidden list check again
6. Only then: commit

## Pairing
Pair with Impeccable Design (Skill #12) for active blocking rules.
Pair with design.md for brand-specific token anchoring.
