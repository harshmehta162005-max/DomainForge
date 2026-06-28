---
name: session-handoff
description: Creates a purposeful HANDOFF.md for the next session or agent. More intentional than /compact — you control what survives to the next context.
---

# Session Handoff
Source: Community (Ruben Hassid prompt)
Tier: B — Run before ending any session > 30 minutes.

## The Ruben Hassid Prompt
"You're my CTO. Write a handoff document for a real developer who is taking over this project."

## Difference from /compact
- `/compact` summarizes mechanically (what happened)
- Session Handoff narrates intentionally (what was decided, why, and what comes next)
- You control the narrative — you choose what the next session needs

## HANDOFF.md Template
```markdown
# DomainForge — Session Handoff
Generated: [ISO timestamp]
Branch: [current git branch]
Session: [approx duration]

## What We Built
[Concrete deliverables, not tasks. "Added GenerateForm component with Zod validation" not "worked on form"]

## Current App State
Working:
- [feature 1]
- [feature 2]

Broken/Stubbed:
- [thing that exists but doesn't work yet]
- [placeholder/mock still in place]

## Decisions Made
[Most important section. The WHY, not just the WHAT.]

### Decision: [name]
Options considered: [A | B | C]
Chosen: [X]
Rationale: [specific reason — not "it seemed better"]
Trade-off accepted: [what we gave up by choosing X]

## Files Changed This Session
[filename] — [one-line description of what changed and why]

## Deferred Items (Not Forgotten)
[Things we explicitly chose to do later, with context on why]
- [item]: deferred because [reason]. Resume by [how to pick it up].

## Known Bugs
[Bug]: [reproduction steps] | [impact level]

## Next Session: Start Here (Priority Order)
1. [Most critical next action — be specific]
2. [Second priority]
3. [Third priority]

## Non-Obvious Context
[Things that will bite a developer who doesn't know them]
- The RDAP API returns 404 for available domains (counterintuitive — 404 = available)
- Groq rate limits are per-minute, not per-day — cache aggressively
- Supabase RLS is enabled — test with actual user session, not service role
```

## Cross-Agent Compatibility
Generated HANDOFF.md can bridge:
- Claude Code → Claude Code (next session)
- Claude Code → Cursor
- Claude Code → parallel worktree agents

## Save Protocol
1. Overwrite `HANDOFF.md` in project root
2. Append timestamped entry to `docs/session-log.md`
3. Commit: `chore(session): add handoff for [date]`
