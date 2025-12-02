#!/bin/bash
# SonicMix Local Downloader - macOS Installer
# Double-click this file to install

set -e

echo "======================================"
echo "  SonicMix Local Downloader Installer"
echo "======================================"
echo ""

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# Check for Homebrew
if ! command -v brew &> /dev/null; then
    echo "📦 Installing Homebrew..."
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
fi

# Check for Python 3
if ! command -v python3 &> /dev/null; then
    echo "🐍 Installing Python 3..."
    brew install python3
fi

# Check for FFmpeg
if ! command -v ffmpeg &> /dev/null; then
    echo "🎬 Installing FFmpeg..."
    brew install ffmpeg
fi

# Check for ngrok
if ! command -v ngrok &> /dev/null; then
    echo "🌐 Installing ngrok..."
    brew install ngrok/ngrok/ngrok
    echo ""
    echo "⚠️  IMPORTANT: You need to configure ngrok with your auth token."
    echo "   1. Sign up at https://ngrok.com (free)"
    echo "   2. Get your auth token from the dashboard"
    echo "   3. Run: ngrok config add-authtoken YOUR_TOKEN"
    echo ""
fi

# Create virtual environment
echo "🔧 Setting up Python environment..."
python3 -m venv venv
source venv/bin/activate

# Install Python dependencies
echo "📥 Installing Python packages..."
pip install --upgrade pip
pip install -r requirements.txt

# Create downloads directory
mkdir -p downloads

# Setup .env file if it doesn't exist
if [ ! -f .env ]; then
    cp .env.example .env
    echo ""
    echo "⚙️  Created .env file. Please edit it with your settings."
fi

# Make launcher executable
chmod +x SonicMix_Downloader.command

echo ""
echo "======================================"
echo "  ✅ Installation Complete!"
echo "======================================"
echo ""
echo "To start the downloader:"
echo "  Double-click 'SonicMix_Downloader.command'"
echo ""
echo "Or run from terminal:"
echo "  cd $SCRIPT_DIR && ./SonicMix_Downloader.command"
echo ""
read -p "Press Enter to close..."
