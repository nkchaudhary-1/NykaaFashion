#!/usr/bin/env bash
# Deploy one commit to Vercel — to STAGING (the review site) or to PRODUCTION (the live prototype). The full workflow is in docs/RELEASE.md.
#
#   scripts/release/deploy.sh staging [ref]                    ref defaults to HEAD
#   PROMOTE=yes scripts/release/deploy.sh production [ref]    ref defaults to the live branch; it must already be merged into it
#
# Production is refused unless PROMOTE=yes is set: the owner decides when something goes live — nothing else does.
# What gets uploaded is a clean checkout of exactly that commit (no local caches, no uncommitted edits), made in a throw-away directory.
set -euo pipefail

target="${1:-}"
ref="${2:-}"
root="$(git rev-parse --show-toplevel)"
cd "$root"

LIVE_BRANCH="${LIVE_BRANCH:-claude/nykaa-fashion-awards}"
STAGING_DOMAIN="${STAGING_DOMAIN:-nykaafashion-neelesh-staging.vercel.app}"
LIVE_URL="${LIVE_URL:-https://nykaafashion-neelesh-design.vercel.app}"
VERCEL_CLI="${VERCEL_CLI:-vercel@latest}"
wt="${NF_DEPLOY_DIR:-${TMPDIR:-/tmp}/nf-deploy-wt}"
scope=()
[ -n "${VERCEL_SCOPE:-}" ] && scope=(--scope "$VERCEL_SCOPE")

die() { echo "deploy: $*" >&2; exit 2; }

case "$target" in
  staging) ref="${ref:-HEAD}" ;;
  production)
    [ "${PROMOTE:-}" = "yes" ] || die "refusing to deploy to production. New work goes to staging first; production only changes after the owner says a build is final. (Re-run with PROMOTE=yes when they have.)"
    ref="${ref:-$LIVE_BRANCH}"
    ;;
  *) die "usage: scripts/release/deploy.sh staging|production [ref]" ;;
esac

sha="$(git rev-parse --verify --quiet "${ref}^{commit}")" || die "unknown ref: $ref"
short="${sha:0:7}"
if [ "$target" = "production" ]; then
  git rev-parse --verify --quiet "refs/heads/$LIVE_BRANCH" > /dev/null || die "no local branch $LIVE_BRANCH"
  git merge-base --is-ancestor "$sha" "refs/heads/$LIVE_BRANCH" || die "$short is not on $LIVE_BRANCH — merge the approved staging work into it first, then deploy that."
fi
[ -f .vercel/project.json ] || die "this checkout is not linked to a Vercel project (run: npx vercel link)"
[ -z "$(git status --porcelain)" ] || echo "note: uncommitted changes are NOT part of this deploy — only commit $short is."

# a clean copy of that one commit, in a directory this script owns
if [ -e "$wt" ] && [ -n "$(ls -A "$wt" 2>/dev/null)" ] && [ ! -f "$wt/.git/nf-deploy-wt" ]; then
  die "$wt exists and was not made by this script; set NF_DEPLOY_DIR to an empty or new directory"
fi
mkdir -p "$wt"
[ -d "$wt/.git" ] || git init -q "$wt"
touch "$wt/.git/nf-deploy-wt"
git update-ref refs/nf/deploy "$sha"
git -C "$wt" fetch -q "$root" "+refs/nf/deploy:refs/nf/deploy"
git -C "$wt" checkout -q --detach -f refs/nf/deploy
git -C "$wt" clean -fdxq
mkdir -p "$wt/.vercel"
cp .vercel/project.json "$wt/.vercel/project.json"

flags=(--yes)
if [ "$target" = "staging" ]; then
  # NEXT_PUBLIC_* values are inlined into the bundle at build time (src/lib/channel.ts reads them)
  flags+=(--build-env "NEXT_PUBLIC_RELEASE_CHANNEL=staging" --build-env "NEXT_PUBLIC_BUILD_SHA=$short" --build-env "NEXT_PUBLIC_LIVE_URL=$LIVE_URL")
else
  flags+=(--prod --build-env "NEXT_PUBLIC_RELEASE_CHANNEL=production")
fi

echo "deploying $short to $target …"
cd "$wt"
url="$(npx --yes "$VERCEL_CLI" deploy "${flags[@]}" "${scope[@]}" | tail -n 1)"
echo "deployment: $url"

if [ "$target" = "staging" ]; then
  npx --yes "$VERCEL_CLI" alias set "$url" "$STAGING_DOMAIN" "${scope[@]}"
  code="$(curl -s -o /dev/null -w '%{http_code}' "https://$STAGING_DOMAIN/" || true)"
  echo "staging: https://$STAGING_DOMAIN  (commit $short, answers HTTP $code)"
  [ "$code" = "401" ] && echo "note: HTTP 401 means Vercel's own Deployment Protection is asking for a Vercel login before the site's sign-in page — see docs/RELEASE.md."
else
  echo "production: $LIVE_URL  (commit $short) — its domains follow the production deployment automatically."
fi
