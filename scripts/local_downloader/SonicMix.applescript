-- SonicMix Downloader - macOS App
-- Save this as an Application: File > Export > File Format: Application

on run
	-- Get the folder where this app is located
	set appPath to (path to me as text)
	set appFolder to do shell script "dirname " & quoted form of POSIX path of appPath
	
	-- Show welcome dialog
	display dialog "🎧 SonicMix Downloader

This will set up and start the music download server.

The server URL will be copied to your clipboard automatically." buttons {"Cancel", "Start"} default button "Start" with title "SonicMix"
	
	-- Run the setup in Terminal
	tell application "Terminal"
		activate
		do script "cd " & quoted form of appFolder & " && bash -c '
# Colors
RED=\"\\033[0;31m\"
GREEN=\"\\033[0;32m\"
CYAN=\"\\033[0;36m\"
YELLOW=\"\\033[1;33m\"
MAGENTA=\"\\033[0;35m\"
NC=\"\\033[0m\"

clear
echo -e \"${MAGENTA}\"
echo \"   _____ ____  _   _ _____ _____ __  __ _______  __\"
echo \"  / ____/ __ \\| \\ | |_   _/ ____|  \\/  |_   _\\ \\/ /\"
echo \" | (___| |  | |  \\| | | || |    | \\  / | | |  \\  / \"
echo \"  \\___ \\ |  | | . \\` | | || |    | |\\/| | | |  /  \\ \"
echo \"  ____) | |__| | |\\  |_| || |____| |  | |_| |_/ /\\ \\\\\"
echo \" |_____/ \\____/|_| \\_|_____\\_____|_|  |_|_____/_/  \\_\\\\\"
echo \"\"
echo \"         🎧 Music Downloader 🎧\"
echo -e \"${NC}\"
echo \"\"

# Check/Install Homebrew
echo -e \"${CYAN}[1/5]${NC} Checking Homebrew...\"
if ! command -v brew &> /dev/null; then
    echo -e \"${YELLOW}Installing Homebrew...${NC}\"
    /bin/bash -c \"$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)\"
    [[ $(uname -m) == \"arm64\" ]] && eval \"$(/opt/homebrew/bin/brew shellenv)\"
else
    echo -e \"${GREEN}✓ Homebrew${NC}\"
fi

# Check/Install Python
echo -e \"${CYAN}[2/5]${NC} Checking Python...\"
command -v python3 &> /dev/null || brew install python3
echo -e \"${GREEN}✓ Python${NC}\"

# Check/Install FFmpeg
echo -e \"${CYAN}[3/5]${NC} Checking FFmpeg...\"
command -v ffmpeg &> /dev/null || brew install ffmpeg
echo -e \"${GREEN}✓ FFmpeg${NC}\"

# Check/Install ngrok
echo -e \"${CYAN}[4/5]${NC} Checking ngrok...\"
command -v ngrok &> /dev/null || brew install ngrok/ngrok/ngrok
echo -e \"${GREEN}✓ ngrok${NC}\"

# Check ngrok auth
if [[ ! -f \"$HOME/.config/ngrok/ngrok.yml\" ]] && [[ ! -f \"$HOME/.ngrok2/ngrok.yml\" ]]; then
    echo \"\"
    echo -e \"${YELLOW}ngrok needs your auth token (free at ngrok.com)${NC}\"
    echo \"\"
    read -p \"Enter your ngrok auth token: \" NGROK_TOKEN
    [ -n \"$NGROK_TOKEN\" ] && ngrok config add-authtoken \"$NGROK_TOKEN\"
fi

# Setup Python env
echo -e \"${CYAN}[5/5]${NC} Setting up...\"
[ ! -d \"venv\" ] && python3 -m venv venv
source venv/bin/activate
pip install --upgrade pip -q 2>/dev/null
pip install -r requirements.txt -q 2>/dev/null
mkdir -p downloads
[ ! -f .env ] && echo \"DOWNLOAD_DIR=./downloads\" > .env
echo -e \"${GREEN}✓ Ready${NC}\"

# Start ngrok
echo \"\"
echo -e \"${CYAN}Starting server...${NC}\"
pkill -f \"ngrok http 5000\" 2>/dev/null || true
ngrok http 5000 --log=stdout > /tmp/ngrok.log 2>&1 &
sleep 4

# Get URL
NGROK_URL=$(curl -s http://localhost:4040/api/tunnels 2>/dev/null | python3 -c \"import sys,json;d=json.load(sys.stdin);t=d.get(\\\"tunnels\\\",[]);print(next((x[\\\"public_url\\\"] for x in t if x.get(\\\"proto\\\")==\\\"https\\\"),t[0][\\\"public_url\\\"] if t else \\\"\\\"))\" 2>/dev/null)

if [ -z \"$NGROK_URL\" ]; then
    echo -e \"${RED}Failed to start. Run: ngrok config add-authtoken YOUR_TOKEN${NC}\"
    read -p \"Press Enter...\"
    exit 1
fi

echo \"$NGROK_URL\" | pbcopy
echo \"\"
echo -e \"${GREEN}════════════════════════════════════════════════════════════${NC}\"
echo \"\"
echo -e \"  ${GREEN}✅ URL copied to clipboard!${NC}\"
echo \"\"
echo -e \"  ${YELLOW}$NGROK_URL${NC}\"
echo \"\"
echo -e \"  Paste this into SonicMix to connect\"
echo \"\"
echo -e \"${GREEN}════════════════════════════════════════════════════════════${NC}\"
echo \"\"
echo -e \"${CYAN}Server running... Close this window to stop${NC}\"
echo \"\"

python3 server.py
'"
	end tell
end run
