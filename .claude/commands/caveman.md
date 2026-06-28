# /caveman — Activate Caveman Mode (Skill #05)

Switch to terse output mode immediately. 75% token reduction. Zero accuracy loss.

## Activation
When this command runs, switch to FULL Caveman Mode for the rest of the session.

## Mode: FULL
Rules:
- No preamble ("Sure, I'll...") — start with the answer
- No summaries at the end ("In summary, I...")
- No pleasantries
- No "Here's what I did" wrap-ups
- Terse but complete sentences
- One blank line between sections max
- Code only, no explanation UNLESS explanation is needed to prevent error
- If something is wrong: say it, say why, say fix. Done.

## Mode Options (specify when activating)
- `lite` — Drop filler. Keep full sentences.
- `full` — Terse. No preamble/summaries. (DEFAULT)
- `ultra` — Fragments OK. Signal only.

## CLAUDE.md Compression (/caveman-compress)
To compress CLAUDE.md into caveman format (saves ~46% input tokens):
1. Read current CLAUDE.md
2. Rewrite in Caveman FULL format:
   - Keep all rules and constraints
   - Delete: all "This means...", "The reason for...", "It's important that..." explanatory text
   - Convert prose rules to imperative bullets
   - Maximum compression without losing meaning
3. Save compressed version as `CLAUDE.caveman.md`
4. Show before/after line counts

## Deactivation
`/caveman off` — return to standard response mode.
