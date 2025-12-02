#!/bin/bash
# SonicMix Local Downloader - Launcher
# Double-click to start the download server with ngrok

set -e

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# Terminal colors
RED='\033[0;31m'
GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

clear
echo -e "${CYAN}"
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║                                                           ║"
echo "║     🎧  SonicMix Local Downloader  🎧                    ║"
echo "║                                                           ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo -e "${RED}❌ Virtual environment not found.${NC}"
    echo "Please run install_macos.command first."
    read -p "Press Enter to close..."
    exit 1
fi

# Activate virtual environment
source venv/bin/activate

# Check if ngrok is installed
if ! command -v ngrok &> /dev/null; then
    echo -e "${RED}❌ ngrok not found.${NC}"
    echo "Please install ngrok: brew install ngrok/ngrok/ngrok"
    read -p "Press Enter to close..."
    exit 1
fi

# Create a temporary file to store the ngrok URL
NGROK_URL_FILE="/tmp/sonicmix_ngrok_url.txt"
rm -f "$NGROK_URL_FILE"

# Function to cleanup on exit
cleanup() {
    echo ""
    echo -e "${YELLOW}Shutting down...${NC}"
    pkill -f "ngrok http 5000" 2>/dev/null || true
    pkill -f "server.py" 2>/dev/null || true
    rm -f "$NGROK_URL_FILE"
    exit 0
}
trap cleanup SIGINT SIGTERM

# Start ngrok in background
echo -e "${CYAN}🌐 Starting ngrok tunnel...${NC}"
ngrok http 5000 --log=stdout > /tmp/ngrok.log 2>&1 &
NGROK_PID=$!

# Wait for ngrok to start and get the URL
sleep 3

# Get the ngrok URL from the API
NGROK_URL=$(curl -s http://localhost:4040/api/tunnels 2>/dev/null | python3 -c "import sys, json; tunnels = json.load(sys.stdin).get('tunnels', []); print(tunnels[0]['public_url'] if tunnels else '')" 2>/dev/null || echo "")

if [ -z "$NGROK_URL" ]; then
    echo -e "${RED}❌ Failed to start ngrok tunnel.${NC}"
    echo ""
    echo "This usually means:"
    echo "  1. ngrok is not authenticated"
    echo "  2. Another ngrok session is running"
    echo ""
    echo "To fix:"
    echo "  1. Sign up at https://ngrok.com"
    echo "  2. Run: ngrok config add-authtoken YOUR_TOKEN"
    echo ""
    cleanup
fi

echo ""
echo -e "${GREEN}════════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "  ${GREEN}✅ Server URL:${NC}"
echo ""
echo -e "  ${YELLOW}${NGROK_URL}${NC}"
echo ""
echo -e "${GREEN}════════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "  ${CYAN}Copy this URL and paste it into SonicMix:${NC}"
echo "    Settings → Platform → Local Server URL"
echo ""
echo -e "${GREEN}════════════════════════════════════════════════════════════${NC}"
echo ""

# Copy to clipboard on macOS
echo "$NGROK_URL" | pbcopy
echo -e "  ${GREEN}📋 URL copied to clipboard!${NC}"
echo ""

# Start the Python server
echo -e "${CYAN}🚀 Starting download server...${NC}"
echo ""
echo "─────────────────────────────────────────────────────────────"
echo ""

python3 server.py

# Keep running until interrupted
wait
