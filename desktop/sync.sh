#!/bin/bash

# SonicMix Desktop Sync Script
# Quickly sync changes from main project to desktop app

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
DESKTOP_DIR="$SCRIPT_DIR"

echo "🔄 Syncing SonicMix Desktop..."

# Sync source files
rsync -av --delete \
    --exclude='lib/tauri.ts' \
    "$ROOT_DIR/src/components/" "$DESKTOP_DIR/src/components/"

rsync -av --delete \
    "$ROOT_DIR/src/hooks/" "$DESKTOP_DIR/src/hooks/"

rsync -av --delete \
    "$ROOT_DIR/src/contexts/" "$DESKTOP_DIR/src/contexts/"

rsync -av --delete \
    "$ROOT_DIR/src/pages/" "$DESKTOP_DIR/src/pages/"

rsync -av --delete \
    "$ROOT_DIR/src/types/" "$DESKTOP_DIR/src/types/"

rsync -av --delete \
    "$ROOT_DIR/src/integrations/" "$DESKTOP_DIR/src/integrations/"

# Sync lib but preserve tauri.ts
rsync -av \
    --exclude='tauri.ts' \
    "$ROOT_DIR/src/lib/" "$DESKTOP_DIR/src/lib/"

# Sync root files
cp "$ROOT_DIR/src/App.tsx" "$DESKTOP_DIR/src/"
cp "$ROOT_DIR/src/App.css" "$DESKTOP_DIR/src/"
cp "$ROOT_DIR/src/index.css" "$DESKTOP_DIR/src/"
cp "$ROOT_DIR/src/main.tsx" "$DESKTOP_DIR/src/"

# Sync configs
cp "$ROOT_DIR/tailwind.config.ts" "$DESKTOP_DIR/"
cp "$ROOT_DIR/index.html" "$DESKTOP_DIR/"

echo "✅ Sync complete!"
