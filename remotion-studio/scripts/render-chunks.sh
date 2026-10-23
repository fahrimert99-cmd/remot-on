#!/usr/bin/env bash
# Bir kompozisyonu parça parça üretir; biten parçalar atlanır (kesintiye dayanıklı).
# Sonunda parçaları birleştirip sesi ekler.
# Kullanım: scripts/render-chunks.sh [KOMPOZİSYON] [KARE_SAYISI] [SES] [ÇIKTI]
set -euo pipefail
cd "$(dirname "$0")/.."

COMP=${1:-Gercekci}
TOTAL=${2:-760}
AUDIO=${3:-public/soundtrack.wav}
OUT=${4:-out/gercekci.mp4}
CHUNK=95
DIR=out/chunks-$COMP
mkdir -p "$DIR"

for ((s = 0; s < TOTAL; s += CHUNK)); do
  e=$((s + CHUNK - 1))
  ((e >= TOTAL)) && e=$((TOTAL - 1))
  f=$(printf "%s/part-%04d.mp4" "$DIR" "$s")
  [[ -f "$f" ]] && { echo "atlandı: $f"; continue; }
  echo "üretiliyor: kare $s-$e"
  npx remotion render "$COMP" "$f.tmp.mp4" --frames="$s-$e" --muted \
    --concurrency=4 --timeout=120000 --crf=18 --log=error
  mv "$f.tmp.mp4" "$f"
done

ls "$DIR"/part-*.mp4 | sed "s|^$DIR/|file '|; s|$|'|" > "$DIR/list.txt"
ffmpeg -v error -y -f concat -safe 0 -i "$DIR/list.txt" -i "$AUDIO" \
  -map 0:v -map 1:a -c:v copy -c:a aac -b:a 192k -shortest "$OUT"
echo "bitti: $OUT"
