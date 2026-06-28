# /context-dump — Mid-Session State Snapshot

Capture current session state for handoff to next session or parallel agent.
Lighter than /handoff — this is a snapshot, not a narrative.

## When to Use
- Before hitting context window limits (50% through a long session)
- When switching between parallel worktrees
- Before spawning a subagent that needs current state
- At natural breakpoints in long feature work

## Snapshot Template
```markdown
# Context Dump — [timestamp]

## Session Goal
[Single sentence: what we are building this session]

## Files Edited (this session)
[List each file + one-line change summary]

## Completed ✓
[List of tasks finished since session start]

## In Progress ⚡
[Current task — where exactly we are in it]

## Blocked 🚫
[Anything we can't continue without external input]

## Open Decisions 🤔
[Things we haven't decided yet + options on the table]

## Commands to Resume
[Exact commands the next session should run to pick up where we left off]
cd DomainForge
git checkout feat/[branch-name]
npm run dev
# then: [specific file to open, specific line to look at]

## Context the Next Session Must Know
[Gotchas, non-obvious things, decisions not yet in code comments]
```

## Differences from /handoff
- /context-dump: fast snapshot for same-day handoff or parallel agent
- /handoff: full narrative for next-session or external developer takeover

## Usage
Call `/context-dump` any time. Does NOT overwrite HANDOFF.md.
Saves to: `docs/context-dumps/[timestamp].md`
