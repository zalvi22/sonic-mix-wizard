#!/bin/bash

# ============================================
# SonicMix TunePat Integration - One Click Setup
# ============================================

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

clear
echo -e "${CYAN}"
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║                                                              ║"
echo "║   🎵  SonicMix TunePat Integration Setup                     ║"
echo "║                                                              ║"
echo "║   This will set up automatic syncing from TunePat            ║"
echo "║   to your SonicMix cloud library.                            ║"
echo "║                                                              ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo -e "${NC}"
echo ""

# Check for Python 3
echo -e "${YELLOW}[1/5]${NC} Checking Python installation..."
if command -v python3 &> /dev/null; then
    PYTHON_VERSION=$(python3 --version 2>&1)
    echo -e "  ${GREEN}✓${NC} $PYTHON_VERSION found"
else
    echo -e "  ${RED}✗${NC} Python 3 not found"
    echo ""
    echo -e "${YELLOW}Installing Python via Homebrew...${NC}"
    
    # Check/install Homebrew
    if ! command -v brew &> /dev/null; then
        echo "Installing Homebrew first..."
        /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    fi
    
    brew install python3
    
    if ! command -v python3 &> /dev/null; then
        echo -e "${RED}Failed to install Python. Please install manually.${NC}"
        exit 1
    fi
fi

# Install pip dependencies
echo ""
echo -e "${YELLOW}[2/5]${NC} Installing Python dependencies..."
pip3 install --quiet watchdog requests python-dotenv 2>/dev/null || pip3 install watchdog requests python-dotenv
echo -e "  ${GREEN}✓${NC} Dependencies installed"

# Create .env file if it doesn't exist
echo ""
echo -e "${YELLOW}[3/5]${NC} Configuring settings..."

if [ ! -f ".env" ]; then
    cp .env.example .env 2>/dev/null || cat > .env << 'EOF'
# SonicMix TunePat Configuration
SUPABASE_URL=https://guvcwvqkxnrwcdmwbifh.supabase.co
SUPABASE_SERVICE_KEY=
TUNEPAT_OUTPUT_DIR=~/Music/TunePat Spotify Converter
UPLOAD_TO_CLOUD=true
EOF
    echo -e "  ${GREEN}✓${NC} Created .env configuration file"
else
    echo -e "  ${GREEN}✓${NC} Configuration file exists"
fi

# Find TunePat output folder
echo ""
echo -e "${YELLOW}[4/5]${NC} Detecting TunePat output folder..."

TUNEPAT_FOLDERS=(
    "$HOME/Music/TunePat Spotify Converter"
    "$HOME/Music/TunePat"
    "$HOME/Music/TunePat Amazon Music Converter"
    "$HOME/Music/TunePat Apple Music Converter"
)

FOUND_FOLDER=""
for folder in "${TUNEPAT_FOLDERS[@]}"; do
    if [ -d "$folder" ]; then
        FOUND_FOLDER="$folder"
        break
    fi
done

if [ -n "$FOUND_FOLDER" ]; then
    echo -e "  ${GREEN}✓${NC} Found: $FOUND_FOLDER"
    # Update .env with found folder
    if [[ "$OSTYPE" == "darwin"* ]]; then
        sed -i '' "s|TUNEPAT_OUTPUT_DIR=.*|TUNEPAT_OUTPUT_DIR=$FOUND_FOLDER|g" .env
    else
        sed -i "s|TUNEPAT_OUTPUT_DIR=.*|TUNEPAT_OUTPUT_DIR=$FOUND_FOLDER|g" .env
    fi
else
    echo -e "  ${YELLOW}⚠${NC} TunePat folder not found in common locations"
    echo ""
    echo "  Please enter your TunePat output folder path:"
    echo "  (Check TunePat → Settings → Output)"
    echo ""
    read -p "  Path: " CUSTOM_PATH
    
    if [ -n "$CUSTOM_PATH" ]; then
        CUSTOM_PATH="${CUSTOM_PATH/#\~/$HOME}"
        if [[ "$OSTYPE" == "darwin"* ]]; then
            sed -i '' "s|TUNEPAT_OUTPUT_DIR=.*|TUNEPAT_OUTPUT_DIR=$CUSTOM_PATH|g" .env
        else
            sed -i "s|TUNEPAT_OUTPUT_DIR=.*|TUNEPAT_OUTPUT_DIR=$CUSTOM_PATH|g" .env
        fi
        echo -e "  ${GREEN}✓${NC} Set folder to: $CUSTOM_PATH"
    fi
fi

# Check for Supabase service key
echo ""
echo -e "${YELLOW}[5/5]${NC} Checking Supabase credentials..."

CURRENT_KEY=$(grep "SUPABASE_SERVICE_KEY=" .env | cut -d'=' -f2)

if [ -z "$CURRENT_KEY" ] || [ "$CURRENT_KEY" == "" ]; then
    echo -e "  ${YELLOW}⚠${NC} Supabase Service Key not set"
    echo ""
    echo -e "  ${CYAN}To get your service key:${NC}"
    echo "  1. Open SonicMix in your browser"
    echo "  2. Click 'View Backend' in the app"
    echo "  3. Go to Settings → API"
    echo "  4. Copy the 'service_role' key (NOT the anon key)"
    echo ""
    read -p "  Paste your service_role key here: " SERVICE_KEY
    
    if [ -n "$SERVICE_KEY" ]; then
        if [[ "$OSTYPE" == "darwin"* ]]; then
            sed -i '' "s|SUPABASE_SERVICE_KEY=.*|SUPABASE_SERVICE_KEY=$SERVICE_KEY|g" .env
        else
            sed -i "s|SUPABASE_SERVICE_KEY=.*|SUPABASE_SERVICE_KEY=$SERVICE_KEY|g" .env
        fi
        echo -e "  ${GREEN}✓${NC} Service key saved"
    else
        echo -e "  ${RED}✗${NC} No key provided - uploads will fail"
        echo "  You can add it later by editing .env"
    fi
else
    echo -e "  ${GREEN}✓${NC} Service key configured"
fi

# Create launcher script
cat > TunePat_Watcher.command << 'LAUNCHER'
#!/bin/bash
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

clear
echo ""
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║   🎵  SonicMix TunePat Watcher                               ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

python3 tunepat_watcher.py
LAUNCHER

chmod +x TunePat_Watcher.command

# Done!
echo ""
echo -e "${GREEN}"
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║                                                              ║"
echo "║   ✅  Setup Complete!                                        ║"
echo "║                                                              ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo -e "${NC}"
echo ""
echo "  To start syncing TunePat downloads to SonicMix:"
echo ""
echo -e "  ${CYAN}Double-click${NC} TunePat_Watcher.command"
echo ""
echo "  Or run in Terminal:"
echo -e "  ${YELLOW}python3 tunepat_watcher.py${NC}"
echo ""
echo "  The watcher will:"
echo "  • Scan existing files in your TunePat folder"
echo "  • Upload them to your SonicMix cloud library"
echo "  • Watch for new downloads and sync automatically"
echo ""

# Ask to start now
read -p "  Start the watcher now? (y/n): " START_NOW

if [[ "$START_NOW" =~ ^[Yy]$ ]]; then
    echo ""
    echo -e "${CYAN}Starting TunePat Watcher...${NC}"
    echo ""
    python3 tunepat_watcher.py
fi
