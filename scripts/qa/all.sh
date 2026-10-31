#!/usr/bin/env bash
# Run every QA check against one running server and summarise.
#   scripts/qa/all.sh [baseUrl]        default http://localhost:3100  (scripts/qa/prod.sh 3100 builds and starts one)
BASE="${1:-http://localhost:3100}"
cd "$(dirname "$0")/../.."
fail=0
failed=()
run() {
  echo; echo "━━ $*"
  "$@" || { fail=$((fail + 1)); failed+=("$*"); }
}
run node scripts/contrast.mjs
run node scripts/qa/nav.cjs "$BASE"
run node scripts/qa/home.cjs "$BASE"
run node scripts/qa/home.cjs "$BASE" --mobile
run node scripts/qa/links.cjs "$BASE"
run node scripts/qa/flat.cjs "$BASE"
run node scripts/qa/grid.cjs "$BASE"
run node scripts/qa/overflow.cjs "$BASE"
run node scripts/qa/align.cjs "$BASE"
run node scripts/qa/keyboard.cjs "$BASE"
run node scripts/qa/journey.cjs "$BASE"
run node scripts/qa/journey.cjs "$BASE" --mobile
run node scripts/qa/launch.cjs "$BASE"
run node scripts/qa/roles.cjs   # starts its own server on :3102 with made-up accounts
run node scripts/qa/motion.cjs "$BASE"
run node scripts/qa/a11y.cjs "$BASE"
echo
if [ "$fail" -eq 0 ]; then
  echo "ALL QA CHECKS PASSED"
else
  echo "$fail QA step(s) failed:"; printf '  - %s\n' "${failed[@]}"; exit 1
fi
