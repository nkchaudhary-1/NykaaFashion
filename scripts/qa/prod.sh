#!/usr/bin/env bash
# Rebuild and (re)start the production server on a port (default 3100) for QA.
#   scripts/qa/prod.sh [port]
PORT="${1:-3100}"
cd "$(dirname "$0")/../.."

# lsof/ss may be missing, so find Next processes by name. The [x] bracket trick keeps this script from matching itself.
next_pids() { ps -eo pid,args | awk '/[n]ext-server|[n]ext start|[n]ext dev|[n]ext build|[n]ext\/dist\/bin\/next/ {print $1}'; }

for _ in 1 2 3 4 5 6; do
  PIDS="$(next_pids)"
  [ -z "$PIDS" ] && break
  kill $PIDS 2>/dev/null
  sleep 1
done
PIDS="$(next_pids)"
[ -n "$PIDS" ] && kill -9 $PIDS 2>/dev/null
rm -f .next/lock

npx next build > /tmp/next-build.log 2>&1 || { tail -40 /tmp/next-build.log; echo "BUILD FAILED"; exit 1; }
(nohup npx next start -p "$PORT" > /tmp/next-start.log 2>&1 &)
for _ in $(seq 1 40); do
  sleep 1
  if curl -s -o /dev/null -w "%{http_code}" "http://localhost:$PORT/" 2>/dev/null | grep -q 200; then
    echo "prod ready on :$PORT (build $(cat .next/BUILD_ID))"
    exit 0
  fi
done
echo "server did not start"
tail -20 /tmp/next-start.log
exit 1
