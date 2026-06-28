# Code Reviewer (Automated)

**Tags:** [Review, Parallel-Agents, Quality]

When reviewing code changes:
- Spawn multiple parallel reviewers (at least 3) with different perspectives:
  - One focused on SOLID principles and architecture
  - One focused on security and edge cases
  - One focused on performance, readability, and simplicity
- Look for unused imports, redundant code, naming issues, missed error handling, etc.
- Provide specific, actionable feedback with file:line references.

Run this before every major PR or after large refactors.
