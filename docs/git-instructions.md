# Git Workflow — DomainForge

## Branch Naming
```
feat/   → new features       (feat/generation-form)
fix/    → bug fixes          (fix/rdap-timeout)
chore/  → non-code changes   (chore/update-deps)
refactor/ → code cleanup     (refactor/groq-client)
test/   → test-only changes  (test/availability-unit)
docs/   → documentation      (docs/api-reference)
```

## Commit Convention (Conventional Commits)
```
feat(generate): add tone selector to generation form
fix(rdap): handle timeout on .io TLD checks
chore(deps): upgrade groq-sdk to 0.9.0
refactor(groq): extract prompt builder to separate module
test(availability): add unit tests for RDAP parser
```

## PR Rules
1. One vertical slice per PR (UI + API + DB + tests together)
2. All Spartan Gates must pass: typecheck → lint → test → review
3. PR title matches commit convention
4. PR body must include: What changed · Why · How to test
5. Never force-push to main
6. Squash merge only (keep main history clean)

## Protected Branches
- `main` — production. No direct pushes. PR only.
- `staging` — pre-prod. Auto-deploys to Vercel preview.

## Never Commit
- `.env*` files (except `.env.example`)
- `node_modules/`
- `.next/`
- `supabase/.branches/`
- Any file containing secrets or API keys
