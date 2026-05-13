#!/usr/bin/env bash
# Backfill git_hash fields in statutes/ YAML nodes.
# For each node file, sets git_hash to the most recent commit hash that touched
# that file. Idempotent — re-running produces no changes if nothing was modified.
#
# Usage:
#   scripts/populate_git_hashes.sh              # update all nodes
#   scripts/populate_git_hashes.sh [file ...]   # update specific files only
#
# Register the companion pre-commit hook so hashes stay current automatically:
#   git config core.hooksPath .githooks

set -euo pipefail

REPO_ROOT="$(git -C "$(dirname "$0")" rev-parse --show-toplevel)"
cd "$REPO_ROOT"

if ! git rev-parse --git-dir &>/dev/null; then
  echo "ERROR: not inside a git repository" >&2
  exit 1
fi

# Determine which files to process
if [ "$#" -gt 0 ]; then
  FILES=("$@")
else
  mapfile -t FILES < <(find statutes -name "*.yaml" ! -name "schema.yaml" | sort)
fi

updated=0
skipped=0
no_commits=0

for file in "${FILES[@]}"; do
  # Normalise to repo-relative path
  rel="${file#"$REPO_ROOT/"}"

  # Get the most recent commit hash that modified this file
  current_hash="$(git log -1 --format=%H -- "$rel" 2>/dev/null || true)"

  if [ -z "$current_hash" ]; then
    # File has never been committed (new/untracked) — leave git_hash empty
    no_commits=$((no_commits + 1))
    continue
  fi

  # Read the existing git_hash value from the file
  existing_hash="$(grep -E '^git_hash:' "$rel" | sed 's/^git_hash:[[:space:]]*//' | tr -d '"' | tr -d "'" | xargs || true)"

  if [ "$existing_hash" = "$current_hash" ]; then
    skipped=$((skipped + 1))
    continue
  fi

  # Update the git_hash field in-place using Python for reliable YAML-safe replacement
  python3 - "$rel" "$current_hash" <<'PYEOF'
import sys, re

filepath, new_hash = sys.argv[1], sys.argv[2]

with open(filepath, 'r') as f:
    content = f.read()

# Replace git_hash value regardless of surrounding quotes or spacing
updated = re.sub(
    r'^(git_hash:\s*)(""|\'\'|"[0-9a-f]*"|\'[0-9a-f]*\'|[0-9a-f]*)(\s*)$',
    rf'\g<1>"{new_hash}"\3',
    content,
    flags=re.MULTILINE
)

if updated == content:
    # Fallback: append if field is missing entirely
    updated = content.rstrip() + f'\ngit_hash: "{new_hash}"\n'

with open(filepath, 'w') as f:
    f.write(updated)
PYEOF

  echo "  updated: $rel  [${current_hash:0:12}]"
  updated=$((updated + 1))
done

total=$(( updated + skipped + no_commits ))
echo ""
echo "populate_git_hashes: $total files examined"
echo "  updated : $updated"
echo "  current : $skipped (already up-to-date)"
echo "  new/untracked: $no_commits (no commit history yet)"
