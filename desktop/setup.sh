#!/bin/bash

# SonicMix Desktop Setup Script
# This script copies the main React frontend into the Tauri desktop app

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
DESKTOP_DIR="$SCRIPT_DIR"

echo "🎧 SonicMix Desktop Setup"
echo "========================="
echo ""

# Check prerequisites
echo "📋 Checking prerequisites..."

# Check for Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js v18+ first."
    echo "   Visit: https://nodejs.org/"
    exit 1
fi
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js v18+ required. Current: $(node -v)"
    exit 1
fi
echo "✅ Node.js $(node -v)"

# Check for Rust
if ! command -v rustc &> /dev/null; then
    echo "❌ Rust is not installed."
    echo "   Install with: curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh"
    read -p "   Install Rust now? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
        source "$HOME/.cargo/env"
    else
        exit 1
    fi
fi
echo "✅ Rust $(rustc --version | cut -d' ' -f2)"

# Check for Xcode CLI tools (macOS)
if [[ "$OSTYPE" == "darwin"* ]]; then
    if ! xcode-select -p &> /dev/null; then
        echo "❌ Xcode Command Line Tools not installed."
        echo "   Installing..."
        xcode-select --install
        echo "   Please run this script again after installation completes."
        exit 1
    fi
    echo "✅ Xcode CLI Tools"
fi

echo ""
echo "📁 Setting up project structure..."

# Create necessary directories
mkdir -p "$DESKTOP_DIR/src/components"
mkdir -p "$DESKTOP_DIR/src/hooks"
mkdir -p "$DESKTOP_DIR/src/contexts"
mkdir -p "$DESKTOP_DIR/src/pages"
mkdir -p "$DESKTOP_DIR/src/types"
mkdir -p "$DESKTOP_DIR/src/integrations"
mkdir -p "$DESKTOP_DIR/src/assets"
mkdir -p "$DESKTOP_DIR/public"

# Copy source files from main project
echo "📋 Copying React frontend..."

# Copy components
if [ -d "$ROOT_DIR/src/components" ]; then
    cp -R "$ROOT_DIR/src/components/"* "$DESKTOP_DIR/src/components/" 2>/dev/null || true
    echo "   ✅ Components"
fi

# Copy hooks
if [ -d "$ROOT_DIR/src/hooks" ]; then
    cp -R "$ROOT_DIR/src/hooks/"* "$DESKTOP_DIR/src/hooks/" 2>/dev/null || true
    echo "   ✅ Hooks"
fi

# Copy contexts
if [ -d "$ROOT_DIR/src/contexts" ]; then
    cp -R "$ROOT_DIR/src/contexts/"* "$DESKTOP_DIR/src/contexts/" 2>/dev/null || true
    echo "   ✅ Contexts"
fi

# Copy pages
if [ -d "$ROOT_DIR/src/pages" ]; then
    cp -R "$ROOT_DIR/src/pages/"* "$DESKTOP_DIR/src/pages/" 2>/dev/null || true
    echo "   ✅ Pages"
fi

# Copy types
if [ -d "$ROOT_DIR/src/types" ]; then
    cp -R "$ROOT_DIR/src/types/"* "$DESKTOP_DIR/src/types/" 2>/dev/null || true
    echo "   ✅ Types"
fi

# Copy integrations (Supabase client etc)
if [ -d "$ROOT_DIR/src/integrations" ]; then
    cp -R "$ROOT_DIR/src/integrations/"* "$DESKTOP_DIR/src/integrations/" 2>/dev/null || true
    echo "   ✅ Integrations"
fi

# Copy assets
if [ -d "$ROOT_DIR/src/assets" ]; then
    cp -R "$ROOT_DIR/src/assets/"* "$DESKTOP_DIR/src/assets/" 2>/dev/null || true
    echo "   ✅ Assets"
fi

# Copy lib folder (utils, platform detection, etc)
if [ -d "$ROOT_DIR/src/lib" ]; then
    mkdir -p "$DESKTOP_DIR/src/lib"
    cp -R "$ROOT_DIR/src/lib/"* "$DESKTOP_DIR/src/lib/" 2>/dev/null || true
    echo "   ✅ Lib utilities"
fi

# Copy root source files
cp "$ROOT_DIR/src/App.tsx" "$DESKTOP_DIR/src/" 2>/dev/null || true
cp "$ROOT_DIR/src/App.css" "$DESKTOP_DIR/src/" 2>/dev/null || true
cp "$ROOT_DIR/src/main.tsx" "$DESKTOP_DIR/src/" 2>/dev/null || true
cp "$ROOT_DIR/src/index.css" "$DESKTOP_DIR/src/" 2>/dev/null || true
cp "$ROOT_DIR/src/vite-env.d.ts" "$DESKTOP_DIR/src/" 2>/dev/null || true
echo "   ✅ Root source files"

# Copy public assets
if [ -d "$ROOT_DIR/public" ]; then
    cp -R "$ROOT_DIR/public/"* "$DESKTOP_DIR/public/" 2>/dev/null || true
    echo "   ✅ Public assets"
fi

# Copy index.html
cp "$ROOT_DIR/index.html" "$DESKTOP_DIR/" 2>/dev/null || true
echo "   ✅ index.html"

# Copy config files
cp "$ROOT_DIR/tailwind.config.ts" "$DESKTOP_DIR/" 2>/dev/null || true
cp "$ROOT_DIR/postcss.config.js" "$DESKTOP_DIR/" 2>/dev/null || true
cp "$ROOT_DIR/tsconfig.json" "$DESKTOP_DIR/" 2>/dev/null || true
cp "$ROOT_DIR/tsconfig.app.json" "$DESKTOP_DIR/" 2>/dev/null || true
cp "$ROOT_DIR/tsconfig.node.json" "$DESKTOP_DIR/" 2>/dev/null || true
cp "$ROOT_DIR/components.json" "$DESKTOP_DIR/" 2>/dev/null || true
echo "   ✅ Config files"

# Copy .env if exists (for Supabase etc)
if [ -f "$ROOT_DIR/.env" ]; then
    cp "$ROOT_DIR/.env" "$DESKTOP_DIR/" 2>/dev/null || true
    echo "   ✅ Environment variables"
fi

echo ""
echo "📦 Installing dependencies..."
cd "$DESKTOP_DIR"
npm install

echo ""
echo "🔧 Building Tauri dependencies..."
cd "$DESKTOP_DIR/src-tauri"
cargo fetch

echo ""
echo "✨ Setup complete!"
echo ""
echo "Next steps:"
echo "  1. Run development server:"
echo "     cd desktop && npm run tauri dev"
echo ""
echo "  2. Build production .dmg:"
echo "     cd desktop && npm run tauri build"
echo ""
echo "  3. Find installer at:"
echo "     desktop/src-tauri/target/release/bundle/dmg/"
echo ""
echo "Optional: Install yt-dlp for audio downloads:"
echo "  brew install yt-dlp ffmpeg"
echo ""
