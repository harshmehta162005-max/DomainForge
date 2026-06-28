#!/bin/bash
# validate-write.sh
# PreToolUse hook — runs before any Write tool call.
# Blocks writes to sensitive files. Exit 1 = block, exit 0 = allow.

TARGET_FILE="${1:-}"

BLOCKED_PATTERNS=(
  "^\.env$"
  "^\.env\."
  "migrations/"
  "\.secret\."
  "\.secret$"
)

if [ -z "$TARGET_FILE" ]; then
  exit 0
fi

for pattern in "${BLOCKED_PATTERNS[@]}"; do
  if echo "$TARGET_FILE" | grep -qE "$pattern"; then
    echo "[validate-write] BLOCKED: '$TARGET_FILE' matches denied path pattern '$pattern'" >&2
    exit 1
  fi
done

exit 0
