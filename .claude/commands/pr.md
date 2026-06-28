# /pr — Pull Request Preparation

Generate a complete, merge-ready PR description. From changes → PR-ready in one command.

## Pre-Conditions (verify all before running /pr)
- [ ] `npm run typecheck` passes
- [ ] `npm run lint` passes  
- [ ] `npm run test` passes
- [ ] `/review` has been run — all High severity issues resolved
- [ ] `/simplify` has been run on the diff

## Process
1. Run `git diff main...HEAD --stat` to list changed files
2. Run `git log main...HEAD --oneline` to list commits
3. Synthesize into a PR description using the template below

## PR Description Template
```markdown
## Summary
[1-3 sentences: what this PR does and why]

## Changes
[Grouped by concern, not by file]

### [Concern 1 — e.g., "Generation Form UI"]
- Added X
- Modified Y to handle Z
- Removed deprecated W

### [Concern 2 — e.g., "Groq API Integration"]
- Added X

## How to Test
1. [Step-by-step reproduction of the main flow]
2. [Expected behavior at each step]
3. [Edge cases to verify]

## Screenshots / Demo
[Paste screenshots if UI changed]

## Database Changes
- [ ] No schema changes
- [ ] Migration included: `supabase/migrations/[timestamp]_[name].sql`
- [ ] RLS policies updated

## Checklist
- [ ] TypeScript: `npm run typecheck` passes
- [ ] Lint: `npm run lint` passes
- [ ] Tests: `npm run test` passes
- [ ] Design: follows design.md (no forbidden patterns)
- [ ] Security: no secrets in client bundle
- [ ] Performance: no N+1 queries introduced
- [ ] Accessibility: interactive elements keyboard-navigable
```

## Branch & Title
- Branch name must match conventions in `docs/git-instructions.md`
- PR title must match Conventional Commits format

## Output
Print the full PR description, ready to paste into GitHub.
