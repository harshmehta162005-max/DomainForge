---
name: karpathy-behavioral
description: The 4 hard behavioral rules from Karpathy's viral Jan 2026 thread. Mandatory on every task. Prevents rogue edits, wrong assumptions, and silent failures.
---

# Karpathy Behavioral Rules
Source: Andrej Karpathy (144K ⭐ GitHub, January 2026)
Tier: S — Always active. Non-negotiable.

## The Four Hard Rules

### Rule 1 — Think Before Coding
**What it means:** Fully understand the problem before writing a single line of code.
**In practice:**
- State your approach out loud (in text) before opening any file
- If you cannot articulate the approach clearly, you do not understand it well enough
- Re-read the original request after forming your approach — does your plan actually solve what was asked?

### Rule 2 — Simplicity First
**What it means:** Always choose the simplest solution that correctly solves the problem.
**In practice:**
- If two solutions work, choose the simpler one without exception
- No premature abstraction — don't generalize until you have 3+ concrete cases
- No over-engineering — don't add configurability that isn't needed today
- If the simple solution has a known limitation, document it — don't over-engineer to handle it speculatively

### Rule 3 — Surgical Changes Only
**What it means:** Touch only the files explicitly included in the scope of the request.
**In practice:**
- Before editing: list the files you will touch and confirm they are all in scope
- After editing: run `git diff` and check every changed file is justified
- If you see something broken while working on something else: note it, do not fix it
- "While I was in there" refactoring is banned unless explicitly asked

### Rule 4 — Verify Before Done
**What it means:** Before declaring a task complete, actively verify every requirement is met.
**In practice:**
- Re-read the original request word by word
- For each requirement, explicitly confirm: "Done because [evidence]"
- If any requirement is unmet, continue working — do not mark as complete
- Do not assume something works because you wrote the code — verify it

## Why These Rules Exist
Without them:
- Claude charges ahead on wrong assumptions (violates Rule 1)
- Claude adds unnecessary complexity (violates Rule 2)
- Claude edits unrelated files and breaks things (violates Rule 3)
- Claude declares tasks done when requirements are partially met (violates Rule 4)
These four patterns compound. One wrong assumption becomes 10 bugs.

## Karpathy's Assessment (January 26, 2026)
"Easily the biggest change to my basic coding workflow in 2 decades of programming.
By December 2025: 80% agent-written vs 20% manual — a complete flip from November."
His four rules remain the guardrail that makes agent-written code trustworthy.
