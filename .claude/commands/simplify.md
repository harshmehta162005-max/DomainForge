# /simplify — Code Simplifier (Skill #07)

Run this on the current diff after ANY autonomous agent session or large refactor.

## Hard Rule
NEVER change behavior. Only change how behavior is expressed.
If simplification would require changing behavior: STOP. Flag it. Do not simplify.

## Process
1. Get the current diff (`git diff HEAD`)
2. For each changed file, identify:
   - Nested ternaries (depth > 1) → extract to named variables
   - Functions doing more than one thing → split
   - Abstractions that no longer serve a purpose → inline or remove
   - Unused imports, variables, or dead code paths → delete
   - Comments that restate what code obviously does → delete
   - Over-engineered generic utilities for a specific use case → specialize

## What You Do NOT Simplify
- TypeScript types (they are documentation)
- Zod schemas (they are contracts)
- Test files (they are specifications)
- Comments explaining WHY (only delete "what" comments)

## Output Format
For each simplification made:
```
FILE: src/components/domain/DomainCard.tsx:23
BEFORE: const label = isAvailable ? (isPremium ? "premium" : "available") : "taken"
AFTER:  
  let label: string
  if (!isAvailable) label = "taken"
  else if (isPremium) label = "premium"  
  else label = "available"
REASON: Nested ternary unreadable at a glance
```

## Run After
- Every Superpowers (Skill #02) agent session
- Every PR before /review
- Never skip this step after autonomous code generation
