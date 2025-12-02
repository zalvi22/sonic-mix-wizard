#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════════
#  SonicMix Downloader - One-Line Installer
#  curl -fsSL https://raw.githubusercontent.com/sonicmix/downloader/main/install.sh | bash
# ═══════════════════════════════════════════════════════════════════════════

set -e

# Colors
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
                                                      
         🎧 Music Downloader Installer 🎧
EOF
echo -e "${NC}"
echo ""

# Install location
INSTALL_DIR="$HOME/.sonicmix"
mkdir -p "$INSTALL_DIR"
cd "$INSTALL_DIR"

# ═══════════════════════════════════════════════════════════════════════════
#  Install Homebrew
# ═══════════════════════════════════════════════════════════════════════════
echo -e "${CYAN}[1/6]${NC} Checking Homebrew..."
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
#  Install Python 3
# ═══════════════════════════════════════════════════════════════════════════
echo -e "${CYAN}[2/6]${NC} Checking Python..."
if ! command -v python3 &> /dev/null; then
    echo -e "${YELLOW}Installing Python 3...${NC}"
    brew install python3
else
    echo -e "${GREEN}✓ Python installed${NC}"
fi

# ═══════════════════════════════════════════════════════════════════════════
#  Install FFmpeg
# ═══════════════════════════════════════════════════════════════════════════
echo -e "${CYAN}[3/6]${NC} Checking FFmpeg..."
if ! command -v ffmpeg &> /dev/null; then
    echo -e "${YELLOW}Installing FFmpeg...${NC}"
    brew install ffmpeg
else
    echo -e "${GREEN}✓ FFmpeg installed${NC}"
fi

# ═══════════════════════════════════════════════════════════════════════════
#  Install ngrok
# ═══════════════════════════════════════════════════════════════════════════
echo -e "${CYAN}[4/6]${NC} Checking ngrok..."
if ! command -v ngrok &> /dev/null; then
    echo -e "${YELLOW}Installing ngrok...${NC}"
    brew install ngrok/ngrok/ngrok
else
    echo -e "${GREEN}✓ ngrok installed${NC}"
fi

# Check ngrok auth
if [[ ! -f "$HOME/.config/ngrok/ngrok.yml" ]] && [[ ! -f "$HOME/.ngrok2/ngrok.yml" ]]; then
    echo ""
    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${YELLOW}  ngrok needs your free auth token${NC}"
    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo "  1. Sign up free at: https://dashboard.ngrok.com/signup"
    echo "  2. Get your token at: https://dashboard.ngrok.com/get-started/your-authtoken"
    echo ""
    read -p "  Paste your ngrok auth token: " NGROK_TOKEN
    if [ -n "$NGROK_TOKEN" ]; then
        ngrok config add-authtoken "$NGROK_TOKEN"
        echo -e "${GREEN}✓ ngrok configured!${NC}"
    else
        echo -e "${RED}Skipping - you'll need to add it later${NC}"
    fi
fi

# ═══════════════════════════════════════════════════════════════════════════
#  Download server files
# ═══════════════════════════════════════════════════════════════════════════
echo -e "${CYAN}[5/6]${NC} Downloading server files..."

# Create requirements.txt
cat > requirements.txt << 'REQEOF'
flask==3.0.0
flask-cors==4.0.0
yt-dlp==2024.1.0
spotipy==2.23.0
python-dotenv==1.0.0
requests==2.31.0
supabase==2.3.0
REQEOF

# Create server.py
cat > server.py << 'SERVEREOF'
from flask import Flask, request, jsonify
from flask_cors import CORS
import yt_dlp
import os
import uuid
import threading
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app)

DOWNLOAD_DIR = os.getenv('DOWNLOAD_DIR', './downloads')
os.makedirs(DOWNLOAD_DIR, exist_ok=True)

jobs = {}

def download_audio(job_id, url, title):
    try:
        jobs[job_id]['status'] = 'downloading'
        
        ydl_opts = {
            'format': 'bestaudio/best',
            'postprocessors': [{
                'key': 'FFmpegExtractAudio',
                'preferredcodec': 'wav',
            }],
            'outtmpl': f'{DOWNLOAD_DIR}/{title}.%(ext)s',
            'quiet': True,
        }
        
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            ydl.download([url])
        
        filename = f"{title}.wav"
        jobs[job_id]['status'] = 'complete'
        jobs[job_id]['filename'] = filename
        jobs[job_id]['path'] = os.path.join(DOWNLOAD_DIR, filename)
        
    except Exception as e:
        jobs[job_id]['status'] = 'error'
        jobs[job_id]['error'] = str(e)

@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok', 'service': 'sonicmix-downloader'})

@app.route('/download', methods=['POST'])
def start_download():
    data = request.json
    url = data.get('url')
    title = data.get('title', 'track')
    
    if not url:
        return jsonify({'error': 'URL required'}), 400
    
    job_id = str(uuid.uuid4())
    jobs[job_id] = {'status': 'queued', 'url': url}
    
    thread = threading.Thread(target=download_audio, args=(job_id, url, title))
    thread.start()
    
    return jsonify({'job_id': job_id, 'status': 'queued'})

@app.route('/status/<job_id>', methods=['GET'])
def get_status(job_id):
    if job_id not in jobs:
        return jsonify({'error': 'Job not found'}), 404
    return jsonify(jobs[job_id])

if __name__ == '__main__':
    print(f"Download directory: {os.path.abspath(DOWNLOAD_DIR)}")
    app.run(host='0.0.0.0', port=5000, debug=False)
SERVEREOF

# Create .env
cat > .env << 'ENVEOF'
DOWNLOAD_DIR=./downloads
ENVEOF

echo -e "${GREEN}✓ Server files ready${NC}"

# ═══════════════════════════════════════════════════════════════════════════
#  Setup Python environment
# ═══════════════════════════════════════════════════════════════════════════
echo -e "${CYAN}[6/6]${NC} Setting up Python environment..."
python3 -m venv venv 2>/dev/null || true
source venv/bin/activate
pip install --upgrade pip -q 2>/dev/null
pip install -r requirements.txt -q 2>/dev/null
mkdir -p downloads
echo -e "${GREEN}✓ Environment ready${NC}"

# ═══════════════════════════════════════════════════════════════════════════
#  Create launcher script
# ═══════════════════════════════════════════════════════════════════════════
cat > start.sh << 'STARTEOF'
#!/bin/bash
cd "$HOME/.sonicmix"
source venv/bin/activate
pkill -f "ngrok http 5000" 2>/dev/null || true
ngrok http 5000 --log=stdout > /tmp/ngrok.log 2>&1 &
sleep 4
NGROK_URL=$(curl -s http://localhost:4040/api/tunnels 2>/dev/null | python3 -c "import sys,json;d=json.load(sys.stdin);t=d.get('tunnels',[]);print(next((x['public_url'] for x in t if x.get('proto')=='https'),t[0]['public_url'] if t else ''))" 2>/dev/null)
echo "$NGROK_URL" | pbcopy
echo ""
echo "✅ URL copied to clipboard: $NGROK_URL"
echo ""
echo "Paste this URL into SonicMix to connect!"
echo ""
echo "Server running... Press Ctrl+C to stop"
echo ""
python3 server.py
STARTEOF
chmod +x start.sh

# ═══════════════════════════════════════════════════════════════════════════
#  Done! Start the server
# ═══════════════════════════════════════════════════════════════════════════
echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}  ✅ Installation Complete!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "  To start anytime, run:"
echo -e "  ${CYAN}~/.sonicmix/start.sh${NC}"
echo ""
echo -e "${YELLOW}Starting server now...${NC}"
echo ""

# Start the server
./start.sh
