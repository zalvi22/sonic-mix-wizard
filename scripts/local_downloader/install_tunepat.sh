#!/bin/bash
# Quick install script for TunePat integration
# Run: curl -fsSL <url> | bash

cd "$(dirname "$0")" 2>/dev/null || cd ~/Downloads/local_downloader 2>/dev/null

pip3 install watchdog requests python-dotenv

if [ ! -f ".env" ]; then
    cp .env.example .env 2>/dev/null
fi

echo ""
echo "✅ TunePat integration installed!"
echo ""
echo "Next steps:"
echo "1. Edit .env and set your SUPABASE_SERVICE_KEY"
echo "2. Set TUNEPAT_OUTPUT_DIR to your TunePat output folder"
echo "3. Run: python3 tunepat_watcher.py"
