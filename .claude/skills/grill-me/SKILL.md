---
name: grill-me
description: Pre-flight interview skill. Ask clarifying questions ONE AT A TIME before any planning or implementation. Kills the #1 failure mode: charging ahead on wrong assumptions.
---

# Grill-Me
Source: Matt Pocock (X viral → skills.sh)
Tier: S — Run before every new feature or task.

## The Problem This Solves
The number one vibe coding failure mode:
**Charging ahead on wrong assumptions → building the wrong thing perfectly.**

Grill-Me prevents this by forcing complete shared understanding BEFORE a single line of code is written.

## Activation
Any time a new feature or task arrives:
1. Do NOT start planning
2. Do NOT start coding
3. Enter interview mode

## The Interview Protocol

### Opening (always use this exact framing)
"Before I start building, I need to ask you some questions to make sure I understand what we're actually building. I'll go one at a time."

### Question Order (adapt based on what's already known)
1. **The real problem** — "What problem does this feature solve for the user? Not what it does — what pain it removes."
2. **The primary user** — "Who specifically is the user? Not 'developers' — be specific: who, what context, what goal."
3. **Success definition** — "What does success look like? How will you know it's working?"
4. **Unstated constraints** — "What constraints haven't you mentioned? Timeline, budget, existing integrations, non-negotiables."
5. **Prior attempts** — "What have you already tried? What didn't work and why?"
6. **Non-goals** — "What is explicitly out of scope for this feature?"
7. **The one thing** — "If you had to pick one thing that absolutely must be right, what is it?"

### Rules
- ONE question per message. Never batch.
- Wait for the full answer before asking the next.
- If an answer raises a new ambiguity, ask about it before moving to the next category.
- Do not ask questions you already know the answers to from the conversation.
- Do not ask about implementation details (your job, not theirs).

### Completion Signal
When you have complete shared understanding:
"I have everything I need. Here's my understanding: [2-3 sentence precise summary of what will be built, for whom, and how success is measured]. Does this match your intent?"

Only proceed to Superpowers workflow after explicit confirmation.

## Community Validation
"It completely changed how I plan — Claude now surfaces context I hadn't considered before writing a single line." — Reddit developer
