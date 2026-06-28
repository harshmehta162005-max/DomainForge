# /techdebt — Technical Debt Audit

Run weekly. Surfaces hidden debt before it compounds.

## Scan Targets
1. `src/` — all TypeScript source files
2. `supabase/migrations/` — schema evolution
3. `package.json` — dependency health

## Audit Dimensions

### 1. Type Safety Debt
- Find all `as` type assertions — each is a potential runtime crash
- Find all `@ts-ignore` and `@ts-expect-error` comments
- Find all function parameters typed as `any`
- Find all missing return types on exported functions

### 2. Error Handling Debt
- API routes without proper error boundaries
- Fetch calls without timeout handling
- Missing empty state handling in components
- Unhandled promise rejections

### 3. Performance Debt
- Missing `loading.tsx` for async routes
- Missing `Suspense` boundaries for async components
- Images without `next/image`
- Missing database indexes (check against query patterns)
- N+1 query patterns in loops

### 4. Security Debt
- Hardcoded values that should be env vars
- Missing Zod validation on form inputs
- API routes without auth checks
- Client-side secrets exposure

### 5. Dependency Debt
- Packages with known vulnerabilities (`npm audit`)
- Packages more than 2 major versions behind
- Unused dependencies in package.json

### 6. Test Debt
- Source files with zero test coverage
- Tests that only test happy path (no error cases)
- Tests that mock too much to be meaningful

## Output Format
```
DEBT REPORT — [date]

CRITICAL (fix before next feature):
- [file:line] [description] [estimated effort]

HIGH (fix this week):
- [file:line] [description] [estimated effort]

MEDIUM (fix this sprint):
- [file:line] [description] [estimated effort]

LOW (backlog):
- [file:line] [description] [estimated effort]

TOTAL DEBT SCORE: [X items] [Y estimated hours]
```

Save output to `docs/techdebt-[date].md`.
