---
name: tdd-loop-master
description: Strict red-green-refactor discipline. Tests written BEFORE code. Prevents tests from becoming documentation of current (broken) behavior instead of specifications of correct behavior.
---

# TDD Loop Master
Source: awesome-claude-code-skills
Tier: B — High value. Active on all feature work.

## The Critical Distinction
**Without TDD:** You write code → write tests that confirm what the code does.
Tests become documentation of current behavior (which might be wrong).

**With TDD:** You write tests → write code that makes tests pass.
Tests become specifications of correct behavior.

This distinction is everything.

## The Loop: Red → Green → Refactor

### Red Phase — Write Failing Test First
1. Read the requirement
2. Write a test that EXACTLY specifies the desired behavior
3. Run the test — it MUST fail (if it passes, the test is wrong)
4. The failure message should be a readable description of what's missing

**For DomainForge, test examples:**
```typescript
// RED: This test must fail before we write any implementation
describe('generateDomains', () => {
  it('returns exactly 10 domain suggestions when count is 10', async () => {
    const result = await generateDomains({ prompt: 'coffee shop', count: 10 })
    expect(result.suggestions).toHaveLength(10)
  })

  it('returns domains with valid TLD format (no leading dot)', async () => {
    const result = await generateDomains({ prompt: 'coffee shop', count: 1 })
    result.suggestions.forEach(s => {
      expect(s.domain).not.toMatch(/^\./)
      expect(s.domain).toContain('.')
    })
  })

  it('throws ZodError when prompt is empty', async () => {
    await expect(generateDomains({ prompt: '', count: 10 }))
      .rejects.toThrow()
  })
})
```

### Green Phase — Minimum Code to Pass
- Write the MINIMUM code that makes the failing test pass
- Do not add features not tested
- Do not optimize
- Do not abstract
- Just: make the red test green

### Refactor Phase — Clean Without Breaking
- Now clean the code: extract functions, name things properly, remove duplication
- Run tests after EVERY change in the refactor phase
- If tests turn red during refactor: undo the last change
- Refactor until clean, then stop

## Test List First
Before writing any test, build a list of ALL behaviors to test:
```
generateDomains tests:
- [ ] returns N suggestions when count is N
- [ ] all suggestions are valid domain format
- [ ] empty prompt throws validation error
- [ ] invalid tone throws validation error
- [ ] returns cached result within 1hr for same prompt
- [ ] handles Groq API timeout gracefully
- [ ] suggestions include domain score 0-100
```
This list is your specification. Tests are the executable form of your spec.

## Integration with Spartan Gates
Tests run AFTER typecheck and lint in the Spartan pipeline.
Write tests before implementation code. Always.

## File Convention (DomainForge)
```
src/lib/groq/generate.ts          → implementation
src/lib/groq/generate.test.ts     → tests (co-located)
src/lib/domain/availability.ts    → implementation
src/lib/domain/availability.test.ts → tests
```
