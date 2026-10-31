#!/usr/bin/env bash
# One-command local setup: checks Xcode, installs XcodeGen, generates the
# project from project.yml, and opens it in Xcode.
#
#   ./ios/scripts/setup-xcode.sh
#
# Safe to re-run. Never uses sudo — if something needs it, the script prints
# the exact command and stops.
set -euo pipefail

cd "$(dirname "$0")/.."   # → ios/

say() { printf '\n▸ %s\n' "$1"; }
die() { printf '\n✗ %s\n' "$1" >&2; exit 1; }

[[ "$(uname)" == "Darwin" ]] || die "This needs macOS — Xcode doesn't run anywhere else."

say "Checking Xcode"
if ! xcode_out=$(xcodebuild -version 2>&1); then
  case "$xcode_out" in
    *license*)
      die "Xcode's licence hasn't been accepted yet. Run:  sudo xcodebuild -license accept   (then re-run this script)" ;;
  esac
  if [[ -d /Applications/Xcode.app ]]; then
    die "Xcode is installed but not selected. Run:  sudo xcode-select -s /Applications/Xcode.app/Contents/Developer   (then re-run this script)"
  fi
  die "Xcode isn't installed. Get it from the Mac App Store (needs your Apple ID): https://apps.apple.com/app/xcode/id497799835 — open it once so it finishes installing, then re-run this script."
fi
printf '%s\n' "$xcode_out"
xcode_major=$(sed -n 's/^Xcode \([0-9][0-9]*\).*/\1/p' <<<"$xcode_out" | head -n 1)
[[ -n "$xcode_major" && "$xcode_major" -ge 26 ]] || die "Xcode 26 or newer is required: the top bar uses iOS 26 Liquid Glass APIs (guarded at runtime, so the app still runs on iOS 17+, but it only compiles against the iOS 26 SDK)."

say "Checking XcodeGen"
if ! command -v xcodegen >/dev/null 2>&1; then
  command -v brew >/dev/null 2>&1 || die "Homebrew is needed to install XcodeGen. Install it from https://brew.sh, then re-run this script."
  brew install xcodegen
fi
xcodegen --version

say "Generating NykaaFashion.xcodeproj from project.yml"
xcodegen generate

say "Opening in Xcode"
open NykaaFashion.xcodeproj

cat <<'EOF'

Done. Before the first run in Xcode:
  1. Select the NykaaFashion target → Signing & Capabilities → pick your Team.
     (Simulator builds work without one; device builds need it.)
  2. Change the bundle identifier (currently com.example.nykaafashion) in
     ios/project.yml, then re-run this script — or edit it in Xcode.
  3. Pick an iPhone simulator and press ⌘R. If no simulator is listed, open
     Xcode → Settings → Components and download the iOS platform.
  4. ⌘U runs the unit tests. In the running app: Profile → Developer → Component gallery.
EOF
