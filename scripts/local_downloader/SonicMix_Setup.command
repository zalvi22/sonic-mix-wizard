#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════════
#  SonicMix Downloader - One-Click Setup & Launch
#  Just double-click this file to get started!
# ═══════════════════════════════════════════════════════════════════════════

# Terminal colors
RED='\033[0;31m'
GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
MAGENTA='\033[0;35m'
NC='\033[0m'

clear
echo -e "${MAGENTA}"
cat << "EOF"
   _____ ____  _   _ _____ _____ __  __ _______  __
  / ____/ __ \| \ | |_   _/ ____|  \/  |_   _\ \/ /
 | (___| |  | |  \| | | || |    | \  / | | |  \  / 
  \___ \ |  | | . ` | | || |    | |\/| | | |  /  \ 
  ____) | |__| | |\  |_| || |____| |  | |_| |_/ /\ \
 |_____/ \____/|_| \_|_____\_____|_|  |_|_____/_/  \_\
                                                      
         🎧 Music Downloader Setup 🎧
EOF
echo -e "${NC}"
echo ""

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# ═══════════════════════════════════════════════════════════════════════════
#  STEP 1: Check/Install Homebrew
# ═══════════════════════════════════════════════════════════════════════════
echo -e "${CYAN}[1/5]${NC} Checking Homebrew..."
if ! command -v brew &> /dev/null; then
    echo -e "${YELLOW}Installing Homebrew (this may take a minute)...${NC}"
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    
    # Add to path for Apple Silicon Macs
    if [[ $(uname -m) == 'arm64' ]]; then
        echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zprofile
        eval "$(/opt/homebrew/bin/brew shellenv)"
    fi
else
    echo -e "${GREEN}✓ Homebrew installed${NC}"
fi

# ═══════════════════════════════════════════════════════════════════════════
#  STEP 2: Check/Install Python 3
# ═══════════════════════════════════════════════════════════════════════════
echo -e "${CYAN}[2/5]${NC} Checking Python..."
if ! command -v python3 &> /dev/null; then
    echo -e "${YELLOW}Installing Python 3...${NC}"
    brew install python3
else
    echo -e "${GREEN}✓ Python installed${NC}"
fi

# ═══════════════════════════════════════════════════════════════════════════
#  STEP 3: Check/Install FFmpeg
# ═══════════════════════════════════════════════════════════════════════════
echo -e "${CYAN}[3/5]${NC} Checking FFmpeg..."
if ! command -v ffmpeg &> /dev/null; then
    echo -e "${YELLOW}Installing FFmpeg...${NC}"
    brew install ffmpeg
else
    echo -e "${GREEN}✓ FFmpeg installed${NC}"
fi

# ═══════════════════════════════════════════════════════════════════════════
#  STEP 4: Check/Install & Configure ngrok
# ═══════════════════════════════════════════════════════════════════════════
echo -e "${CYAN}[4/5]${NC} Checking ngrok..."
if ! command -v ngrok &> /dev/null; then
    echo -e "${YELLOW}Installing ngrok...${NC}"
    brew install ngrok/ngrok/ngrok
else
    echo -e "${GREEN}✓ ngrok installed${NC}"
fi

# Check if ngrok needs auth token
NGROK_CONFIG=$(ngrok config check 2>&1 || true)
if [[ ! -f "$HOME/.config/ngrok/ngrok.yml" ]] && [[ ! -f "$HOME/.ngrok2/ngrok.yml" ]]; then
    echo ""
    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${YELLOW}  ngrok needs to be configured with your auth token${NC}"
    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo "  1. Go to https://dashboard.ngrok.com/get-started/your-authtoken"
    echo "  2. Copy your auth token"
    echo "  3. Paste it below"
    echo ""
    read -p "  Enter your ngrok auth token: " NGROK_TOKEN
    if [ -n "$NGROK_TOKEN" ]; then
        ngrok config add-authtoken "$NGROK_TOKEN"
        echo -e "${GREEN}✓ ngrok configured!${NC}"
    else
        echo -e "${RED}Skipping ngrok config - you'll need to add it later${NC}"
    fi
fi

# ═══════════════════════════════════════════════════════════════════════════
#  STEP 5: Setup Python environment
# ═══════════════════════════════════════════════════════════════════════════
echo -e "${CYAN}[5/5]${NC} Setting up Python environment..."

if [ ! -d "venv" ]; then
    python3 -m venv venv
fi
source venv/bin/activate

# Install/update dependencies quietly
pip install --upgrade pip -q
pip install -r requirements.txt -q

# Create downloads folder
mkdir -p downloads

# Create .env if doesn't exist
if [ ! -f .env ]; then
    cp .env.example .env 2>/dev/null || echo "DOWNLOAD_DIR=./downloads" > .env
fi

echo -e "${GREEN}✓ Python environment ready${NC}"

# ═══════════════════════════════════════════════════════════════════════════
#  ALL DONE - START THE SERVER
# ═══════════════════════════════════════════════════════════════════════════
echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}  ✅ Setup Complete! Starting server...${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Function to cleanup on exit
cleanup() {
    echo ""
    echo -e "${YELLOW}Shutting down...${NC}"
    pkill -f "ngrok http 5000" 2>/dev/null || true
    pkill -f "server.py" 2>/dev/null || true
    exit 0
}
trap cleanup SIGINT SIGTERM EXIT

# Start ngrok in background
echo -e "${CYAN}🌐 Starting tunnel...${NC}"
ngrok http 5000 --log=stdout > /tmp/ngrok.log 2>&1 &

# Wait for ngrok
sleep 4

# Get ngrok URL
NGROK_URL=$(curl -s http://localhost:4040/api/tunnels 2>/dev/null | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    tunnels = data.get('tunnels', [])
    for t in tunnels:
        if t.get('proto') == 'https':
            print(t['public_url'])
            break
    else:
        if tunnels:
            print(tunnels[0]['public_url'])
except:
    pass
" 2>/dev/null || echo "")

if [ -z "$NGROK_URL" ]; then
    echo -e "${RED}❌ Could not start ngrok tunnel${NC}"
    echo ""
    echo "  This usually means ngrok is not configured."
    echo "  Run: ngrok config add-authtoken YOUR_TOKEN"
    echo ""
    read -p "Press Enter to exit..."
    exit 1
fi

# Copy to clipboard
echo "$NGROK_URL" | pbcopy

echo ""
echo -e "${MAGENTA}╔═══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${MAGENTA}║                                                               ║${NC}"
echo -e "${MAGENTA}║  ${GREEN}🎉 YOUR URL (copied to clipboard):${MAGENTA}                         ║${NC}"
echo -e "${MAGENTA}║                                                               ║${NC}"
echo -e "${MAGENTA}║  ${YELLOW}${NGROK_URL}${MAGENTA}"
printf "${MAGENTA}%*s║${NC}\n" $((62 - ${#NGROK_URL})) ""
echo -e "${MAGENTA}║                                                               ║${NC}"
echo -e "${MAGENTA}║  ${NC}Paste this URL into SonicMix to connect!${MAGENTA}                   ║${NC}"
echo -e "${MAGENTA}║                                                               ║${NC}"
echo -e "${MAGENTA}╚═══════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${CYAN}Server running... Press Ctrl+C to stop${NC}"
echo ""
echo "─────────────────────────────────────────────────────────────────"
echo ""

# Start Python server (foreground)
python3 server.py
