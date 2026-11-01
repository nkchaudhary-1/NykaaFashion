#!/usr/bin/env bash
# Rebuilds the launch video (docs/LAUNCH_VIDEO.md). Each step reads what the one before wrote into $OUT, so any of them can be run on its own.
#
#   scripts/video/build.sh capture    pictures of the real site                → $OUT/shots     (the site must be running: scripts/qa/prod.sh 3100)
#   scripts/video/build.sh render     every scene, frame by frame              → $OUT/scenes
#   scripts/video/build.sh music      the original score, cut to the scenes    → $OUT/music.wav
#   scripts/video/build.sh assemble   join, mix and encode the deliverables    → $OUT/final
#   scripts/video/build.sh qa         stream, frame-count, loudness and size checks on $OUT/final
#   scripts/video/build.sh all        capture → render → music → assemble → qa
#
# Environment:  OUT (default /tmp/nf-launch-video) · BASE (default http://localhost:3100) · WORKERS (default 3)
# Needs: node + playwright (found through the repo's node_modules or the global ones), ffmpeg / ffprobe, python3 with numpy.
set -euo pipefail
cd "$(dirname "$0")/../.."
ROOT="$PWD"
OUT="${OUT:-/tmp/nf-launch-video}"
BASE="${BASE:-http://localhost:3100}"
WORKERS="${WORKERS:-3}"
export NODE_PATH="${NODE_PATH:+$NODE_PATH:}$ROOT/node_modules:$(npm root -g 2>/dev/null || true)"
NAME="nykaa-fashion-new-look-launch"
FINAL="$OUT/final"

step() { printf '\n━━ %s\n' "$*"; }

do_capture() {
  step "capture — the real site, state by state ($BASE)"
  curl -s -o /dev/null -w "" --max-time 10 "$BASE/" || { echo "nothing answers on $BASE — start the site first: scripts/qa/prod.sh 3100"; exit 1; }
  node scripts/video/capture.cjs "$BASE" --out "$OUT/shots"
}

do_render() {
  step "render — every scene, frame by frame ($WORKERS at a time)"
  node scripts/video/render.cjs --shots "$OUT/shots" --out "$OUT" --workers "$WORKERS"
}

# scene start times, in seconds, from the rendered clips themselves (the music changes its arrangement on the cuts)
cuts() { node -e '
  const s = JSON.parse(require("fs").readFileSync(process.argv[1], "utf8")); let t = 0; const c = [];
  for (const x of s) { if (t > 0) c.push(+t.toFixed(3)); t += x.duration; } console.log(c.join(","));
' "$OUT/scenes/index.json"; }
total() { node -e 'console.log(JSON.parse(require("fs").readFileSync(process.argv[1], "utf8")).reduce((n, x) => n + x.duration, 0))' "$OUT/scenes/index.json"; }

do_music() {
  step "music — an original score, synthesised from sine / saw / noise (nothing sampled)"
  python3 -I scripts/video/music.py --out "$OUT/music.wav" --duration "$(total)" --cuts "$(cuts)"
}

do_assemble() {
  step "assemble — join the clips, mix the score, encode"
  mkdir -p "$FINAL"
  local dur; dur="$(total)"
  # the clips share one encoder setting, so joining them is a stream copy: nothing is re-encoded until the finals below
  node -e 'const s = JSON.parse(require("fs").readFileSync(process.argv[1], "utf8")); console.log(s.map((x) => `file ${JSON.stringify(process.argv[2] + "/scenes/" + x.id + ".mp4").replace(/"/g, "\x27")}`).join("\n"))' "$OUT/scenes/index.json" "$OUT" > "$OUT/concat.txt"
  ffmpeg -y -loglevel error -f concat -safe 0 -i "$OUT/concat.txt" -c copy "$OUT/video-raw.mp4"

  # the score sits about 3 dB down from where it was synthesised (≈ −14 LUFS, the usual level for web video), fades in over 0.6 s and out over 2.2 s
  local mix="[1:a]volume=-3dB,afade=t=in:st=0:d=0.6,afade=t=out:st=$(node -e "console.log((${dur} - 2.2).toFixed(2))"):d=2.2,aresample=48000[a]"
  local x264=(-c:v libx264 -preset slow -profile:v high -pix_fmt yuv420p -colorspace bt709 -color_primaries bt709 -color_trc bt709 -color_range tv -r 30 -movflags +faststart)

  echo "   1080p picture (one slow encode; the music version copies it)"
  ffmpeg -y -loglevel error -i "$OUT/video-raw.mp4" "${x264[@]}" -crf 18 -an "$FINAL/$NAME-1080p-silent.mp4"
  echo "   1080p with music"
  ffmpeg -y -loglevel error -i "$FINAL/$NAME-1080p-silent.mp4" -i "$OUT/music.wav" -filter_complex "$mix" -map 0:v -map "[a]" -c:v copy -c:a aac -b:a 192k -movflags +faststart -shortest "$FINAL/$NAME-1080p.mp4"
  echo "   720p share cut (capped bitrate, small enough for a chat message)"
  ffmpeg -y -loglevel error -i "$OUT/video-raw.mp4" -i "$OUT/music.wav" -filter_complex "[0:v]scale=1280:720:flags=lanczos[v];$mix" -map "[v]" -map "[a]" "${x264[@]}" -crf 24 -maxrate 1500k -bufsize 3000k -c:a aac -b:a 128k -shortest "$FINAL/$NAME-720p.mp4"
  echo "   poster (the title, mid-word: frame 66)"
  ffmpeg -y -loglevel error -i "$FINAL/$NAME-1080p-silent.mp4" -vf "select=eq(n\,66)" -frames:v 1 -q:v 2 "$FINAL/$NAME-poster.jpg"
  ls -l "$FINAL"
}

do_qa() {
  step "qa — what was made"
  local dur frames; dur="$(total)"; frames="$(node -e "console.log(Math.round($dur * 30))")"
  local fail=0
  check() { if [ "$2" = "$3" ]; then echo "   ok    $1 ($2)"; else echo "   FAIL  $1: expected $3, got $2"; fail=$((fail + 1)); fi; }
  for f in "$FINAL/$NAME-1080p-silent.mp4" "$FINAL/$NAME-1080p.mp4" "$FINAL/$NAME-720p.mp4"; do
    echo " · $(basename "$f")"
    local size; size="$(ffprobe -v error -select_streams v:0 -show_entries stream=width,height,codec_name,pix_fmt,r_frame_rate -of csv=p=0 "$f")"
    local n; n="$(ffprobe -v error -count_frames -select_streams v:0 -show_entries stream=nb_read_frames -of csv=p=0 "$f")"
    check "frames" "$n" "$frames"
    case "$f" in *720p*) check "picture" "$size" "h264,1280,720,yuv420p,30/1" ;; *) check "picture" "$size" "h264,1920,1080,yuv420p,30/1" ;; esac
    local a; a="$(ffprobe -v error -select_streams a -show_entries stream=codec_name,channels,sample_rate -of csv=p=0 "$f" | head -1)"
    case "$f" in *silent*) check "audio streams" "${a:-none}" "none" ;; *) check "audio" "$a" "aac,48000,2" ;;
    esac
  done
  echo " · loudness of the mixed 1080p (target ≈ −14 LUFS, true peak under −1 dBFS)"
  ffmpeg -hide_banner -nostats -i "$FINAL/$NAME-1080p.mp4" -af ebur128=peak=true -f null - 2>&1 | sed -n '/Summary:/,$p' | awk '/ I: |Peak:/ {print "   " $0}'
  ls -l "$FINAL" | awk 'NR > 1 {printf "   %8.1f MB  %s\n", $5 / 1048576, $9}'
  [ "$fail" -eq 0 ] && echo "qa passed" || { echo "qa: $fail check(s) failed"; exit 1; }
}

case "${1:-all}" in
  capture) do_capture ;;
  render) do_render ;;
  music) do_music ;;
  assemble) do_assemble ;;
  qa) do_qa ;;
  all) do_capture; do_render; do_music; do_assemble; do_qa ;;
  *) sed -n 2,13p "$0"; exit 1 ;;
esac
