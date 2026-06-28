# /review — Automated Code Review (Skill #16)

Spawn 3 parallel review passes on all changed files. Each attacks from a different angle.

## Input
Run `git diff main...HEAD` to get all changes in the current branch.

## The Three Review Angles

### ANGLE 1 — SOLID Principles
Review each changed class/module/function for:
- **S** — Single Responsibility: does this do exactly one thing?
- **O** — Open/Closed: can new behavior be added without modifying this?
- **L** — Liskov Substitution: if there are subclasses/implementations, are they interchangeable?
- **I** — Interface Segregation: are there interfaces too large for their consumers?
- **D** — Dependency Inversion: does high-level code depend on abstractions, not concretions?

### ANGLE 2 — Security
- Unvalidated input reaching the database or external API
- Secrets or API keys in client-side bundles
- Missing authentication checks on protected routes
- SQL injection vectors (even with Supabase — check RLS)
- Missing rate limiting on public API routes
- Exposed user data in error messages
- XSS vectors in rendered content

### ANGLE 3 — Architecture
- Abstraction leaks (internal details bleeding across module boundaries)
- Tight coupling (component depends on another's internals)
- Missing error states (what happens when the fetch fails?)
- Future maintainability (will a new developer understand this in 6 months?)
- Inconsistency with existing patterns in the codebase

## Output Format
```
[SOLID] src/lib/groq/client.ts:45
ISSUE: Function `generateDomains` handles HTTP, parsing, AND caching. Single responsibility violated.
SEVERITY: Medium
FIX: Extract caching to `lib/domain/cache.ts`, parsing to `lib/groq/parser.ts`

[SECURITY] src/app/api/generate/route.ts:12
ISSUE: No rate limiting on POST /api/generate. Unlimited Groq API calls possible.
SEVERITY: High
FIX: Add rate limiting middleware using upstash/ratelimit or in-memory Map

[ARCH] src/components/domain/DomainCard.tsx:67
ISSUE: DomainCard directly calls fetch() for availability check. Should use useAvailability hook.
SEVERITY: Low
FIX: Move fetch to hook, pass result as prop
```

## Spartan Gate Integration
After /review completes, NO PR opens until all High severity issues are resolved.
Medium issues must have an accepted plan or a created issue. Low issues can merge.
