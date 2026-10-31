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
run node scripts/qa/categories.cjs "$BASE"   # Shop by category on the second fold: tiles, columns, the all-categories dialog
run env NF_LAYOUT=bleed node scripts/qa/categories.cjs "$BASE"   # …and the same checks on the full-bleed layout (same hooks, same words, same columns)
run node scripts/qa/bleed.cjs "$BASE"   # the full-bleed home layout: walls edge to edge, tiles touch, cells 4:5, switching, intent order (docs/BLEED_LAYOUT.md)
run node scripts/qa/rabbit.cjs "$BASE"   # "Keep exploring": the endless feed on home and product pages, auto-load cap, Back to the same tile (docs/RABBIT_HOLE.md)
run node scripts/qa/links.cjs "$BASE"
run node scripts/qa/flat.cjs "$BASE"
run env NF_LAYOUT=bleed node scripts/qa/flat.cjs "$BASE" --routes /,/p/poppy-smocked-midi-dress
run node scripts/qa/grid.cjs "$BASE"
run env NF_LAYOUT=bleed node scripts/qa/grid.cjs "$BASE" --routes /,/p/poppy-smocked-midi-dress
run node scripts/qa/overflow.cjs "$BASE"
run env NF_LAYOUT=bleed node scripts/qa/overflow.cjs "$BASE"
run node scripts/qa/align.cjs "$BASE"
run env NF_LAYOUT=bleed node scripts/qa/align.cjs "$BASE"
run node scripts/qa/clip.cjs "$BASE"   # poster-scale headings: the word masks must not crop the last letter of a word
run node scripts/qa/keyboard.cjs "$BASE"
run node scripts/qa/journey.cjs "$BASE"
run node scripts/qa/journey.cjs "$BASE" --mobile
run node scripts/qa/launch.cjs "$BASE"
run node scripts/qa/promo.cjs "$BASE"   # pop-ups (PiP) end to end; takes about two minutes because campaigns appear 5–10 s into a page
run node scripts/qa/promo-unit.mjs   # pop-up rules: routes, dates, launch states, dismissal / cool-down / visit cap
run node scripts/qa/notify-unit.mjs   # the one-line "someone signed in" notification: shape, nothing configured, failures never block
run node scripts/qa/auth-unit.mjs   # issued sign-ins (admin "Add a user"): signature, expiry, revoke
run node scripts/qa/unsplash-unit.mjs   # the photo-curation toolkit against a local stand-in for Unsplash (no key, no network)
run node scripts/qa/unsplash-build-unit.mjs   # the build that cuts the site's pictures from picked photographs, on made-up photographs
run node scripts/qa/roles.cjs   # starts its own server on :3102 with made-up accounts
run node scripts/qa/motion.cjs "$BASE"
run node scripts/qa/a11y.cjs "$BASE"
run env NF_LAYOUT=bleed node scripts/qa/a11y.cjs "$BASE"
echo
if [ "$fail" -eq 0 ]; then
  echo "ALL QA CHECKS PASSED"
else
  echo "$fail QA step(s) failed:"; printf '  - %s\n' "${failed[@]}"; exit 1
fi
