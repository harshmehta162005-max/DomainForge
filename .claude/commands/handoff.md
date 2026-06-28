# /handoff — Session Handoff (Skill #18)

Generate a HANDOFF.md for the next session or next agent. More intentional than /compact.
You control the narrative — not just a summary, but a story with decisions and rationale.

## Prompt to Generate Handoff
"You are my CTO, handing this project to a real senior developer who is taking over cold.
Write a handoff document that tells them everything they need to know to continue without asking a single question."

## HANDOFF.md Structure
```markdown
# DomainForge — Session Handoff
Generated: [timestamp]
Session duration: [X hours]

## What We Built This Session
[Concrete list of completed items — not tasks, but deliverables]

## Current State
[Where the app is right now. What works. What is broken. What is stubbed.]

## Decisions Made (and WHY)
[The reasoning, not just the conclusion. Future Claude needs to know WHY.]
- Decision: [X]
  - Options considered: [A, B, C]
  - Chosen: [A]
  - Rationale: [reason]
  - Trade-offs accepted: [what we gave up]

## Files Changed This Session
[List of modified/created files and one-line description of what changed]

## Open Threads (things we deferred)
[Explicit list of deferred decisions with context on why they were deferred]

## Known Issues
[Bugs found but not yet fixed, with reproduction steps]

## Next Session: Start Here
[The single most important thing the next session must pick up. Numbered list in priority order.]

## Critical Context
[Anything non-obvious that would bite a developer who doesn't know it]
```

## Save Location
Always save to: `HANDOFF.md` in project root (overwrite previous).
Also append a timestamped entry to `docs/session-log.md`.
