/**
 * validate-write.js
 * PreToolUse hook — runs before any Write tool call.
 * Blocks writes to sensitive files.
 * Exit code 1 = block the write. Exit code 0 = allow.
 */

const path = require('path')

const BLOCKED_PATHS = [
  /^\.env$/,
  /^\.env\./,
  /^supabase\/migrations\//,
  /^\.claude\/settings\.json$/,
  /secrets/i,
  /private.*key/i,
]

// Claude passes the target file path as the first argument
const targetFile = process.argv[2]

if (!targetFile) {
  // No file argument — allow (not a file write hook context)
  process.exit(0)
}

const normalizedPath = path.normalize(targetFile).replace(/\\/g, '/')

const isBlocked = BLOCKED_PATHS.some((pattern) => pattern.test(normalizedPath))

if (isBlocked) {
  console.error(`[validate-write] BLOCKED: Write to '${targetFile}' is not allowed.`)
  console.error('[validate-write] Sensitive file protection active. See .claude/settings.json deny-list.')
  process.exit(1)
}

process.exit(0)
