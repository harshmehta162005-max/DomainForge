/**
 * inject-context.js
 * SessionStart hook — runs once when Claude Code session starts.
 * Outputs context summary to stdout (Claude reads it as session context).
 */

const fs = require('fs')
const path = require('path')

const root = process.cwd()

// Read HANDOFF.md if it exists
const handoffPath = path.join(root, 'HANDOFF.md')
const hasHandoff = fs.existsSync(handoffPath)

// Get current git branch
let branch = 'unknown'
try {
  const { execSync } = require('child_process')
  branch = execSync('git branch --show-current 2>/dev/null', { encoding: 'utf8' }).trim()
} catch {}

// Get last commit
let lastCommit = 'none'
try {
  const { execSync } = require('child_process')
  lastCommit = execSync('git log -1 --oneline 2>/dev/null', { encoding: 'utf8' }).trim()
} catch {}

console.log('=== SESSION START CONTEXT ===')
console.log(`Project: DomainForge`)
console.log(`Branch: ${branch}`)
console.log(`Last commit: ${lastCommit}`)
console.log(`Caveman Mode: FULL (active)`)
console.log(`Design system: design.md`)
console.log(`Context: CONTEXT.md`)
console.log('')

if (hasHandoff) {
  console.log('⚡ HANDOFF.md found — previous session left notes. Read it before starting.')
} else {
  console.log('No HANDOFF.md found — this is a fresh start.')
}

console.log('')
console.log('Active skills: karpathy-behavioral, frontend-design, caveman-mode, spartan-quality-gates')
console.log('Run /grill before any new feature.')
console.log('=== END SESSION CONTEXT ===')
