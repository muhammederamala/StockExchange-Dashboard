#!/usr/bin/env bash
# =============================================================================
# deploy.sh — build the dashboard and publish the bundle into StockExchange-AI.
#
# server.js serves `StockExchange-AI/dist` with express.static and falls back to
# dist/index.html for client-side routes, so "deploying" the dashboard just means
# putting a fresh Vite build there.
#
# Safety: the AI dist is only touched AFTER a build succeeds and is sanity-checked,
# and the previous bundle is kept as dist.bak-<timestamp> so a bad deploy is one
# `mv` away from being undone. A failed build leaves the running bundle untouched.
#
# Usage:
#   bash deploy.sh              # build + publish
#   bash deploy.sh --build-only # build, don't touch the AI repo
#   KEEP_BACKUPS=3 bash deploy.sh
# =============================================================================
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
AI_ROOT="$(cd "$HERE/../StockExchange-AI" && pwd)"
DEST="$AI_ROOT/dist"
KEEP_BACKUPS="${KEEP_BACKUPS:-3}"
BUILD_ONLY=0
[ "${1:-}" = "--build-only" ] && BUILD_ONLY=1

cd "$HERE"

echo "▶ building dashboard…"
npm run build

# Sanity-check the build before it is allowed anywhere near the served directory.
[ -d "$HERE/dist" ]            || { echo "❌ build produced no dist/"; exit 1; }
[ -f "$HERE/dist/index.html" ] || { echo "❌ dist/index.html missing — refusing to deploy"; exit 1; }
ASSETS=$(find "$HERE/dist" -type f | wc -l | tr -d ' ')
[ "$ASSETS" -ge 3 ] || { echo "❌ dist has only $ASSETS files — looks broken, refusing"; exit 1; }
echo "  build OK — $ASSETS files, $(du -sh "$HERE/dist" | cut -f1)"

if [ "$BUILD_ONLY" = "1" ]; then
    echo "✅ --build-only: AI repo untouched."
    exit 0
fi

if [ -d "$DEST" ]; then
    STAMP="$(date +%Y%m%d-%H%M%S)"
    mv "$DEST" "$AI_ROOT/dist.bak-$STAMP"
    echo "  previous bundle → dist.bak-$STAMP"
fi

mkdir -p "$DEST"
# copy contents, not the directory itself
cp -R "$HERE/dist/." "$DEST/"

[ -f "$DEST/index.html" ] || { echo "❌ copy failed — index.html not at destination"; exit 1; }
echo "✅ deployed → $DEST  ($(du -sh "$DEST" | cut -f1))"

# Prune old backups, newest KEEP_BACKUPS retained.
# NB: no `mapfile` — macOS ships bash 3.2, where it does not exist. A while-read loop
# is portable across that and modern bash alike.
ls -1dt "$AI_ROOT"/dist.bak-* 2>/dev/null | tail -n +$((KEEP_BACKUPS + 1)) | while IFS= read -r d; do
    [ -n "$d" ] && rm -rf "$d" && echo "  pruned $(basename "$d")"
done

echo
echo "NOTE: the AI server serves this statically — a running server picks up the new"
echo "      files on the next request, no restart needed for the dashboard itself."
echo "      (Server-side changes DO still need a restart.)"
