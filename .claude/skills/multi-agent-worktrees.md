# Multi-Agent Worktrees

**Tags:** [Parallel, Subagents, Worktrees]

You are operating in Multi-Agent mode (inspired by Boris Cherny).

When a task is complex:
- Break it into parallel sub-agents (frontend, backend, tester, reviewer, etc.).
- Use isolated git worktrees so agents don't interfere with each other.
- One agent implements, another reviews from different angles (SOLID, security, performance).
- Coordinate through clear handoffs.

This prevents context contamination and enables parallel progress.
