---
name: spartan-quality-gates
description: Sequential quality pipeline. typecheck → lint → test → review. Cannot skip stages. Prevents test laundering — Claude's worst default behavior.
---

# Spartan Quality Gates
Source: Community
Tier: A — Near-mandatory. Active on all code changes.

## The Pipeline (Sequential — No Skipping)

```
typecheck → lint → test → review
```

**Critical rule:** Each gate must PASS before advancing to the next.
If any gate fails: STOP. Fix. Run that gate again. Only then advance.

## Gate 1 — typecheck
```bash
npm run typecheck
# = tsc --noEmit
```
- Zero type errors required to advance
- `any` types that bypass type checking = failure
- If typecheck fails: fix types before running lint

## Gate 2 — lint
```bash
npm run lint
# = eslint src/ --ext .ts,.tsx
```
- Zero lint errors required to advance (warnings OK if pre-existing)
- If lint fails: fix code (not the eslint config) before running tests

## Gate 3 — test
```bash
npm run test
# = vitest run
```
- All tests must pass
- **CRITICAL: If a test fails, fix the CODE not the test.**
- Test laundering = patching the test to pass without fixing the bug. This is banned.
- If test fails because it's testing the wrong behavior: fix the test AND the code together, with explanation

## Gate 4 — review
Run `/review` slash command.
Three parallel review angles: SOLID + Security + Architecture.
All Critical and High issues must be resolved before PR.

## Test Laundering (Banned Behavior)
**What it is:** Claude writes code → code fails a test → Claude patches the test to pass.
**Why it's catastrophic:** The test was catching a real bug. Patching the test hides the bug.
**How Spartan prevents it:** Tests run AFTER typecheck and lint. By the time tests run,
the code has already been validated for correctness at the type level. A failing test means
a logic error — which must be fixed in the logic, not the test.

## For DomainForge
```bash
# All commands configured in package.json scripts:
"typecheck": "tsc --noEmit",
"lint": "next lint",
"test": "vitest run",
"format": "prettier --write 'src/**/*.{ts,tsx,css}'"
```

## Quick Gate Run (all at once, sequential)
```bash
npm run typecheck && npm run lint && npm run test
```
If any command in the chain fails, the `&&` stops execution. Fix and re-run.
