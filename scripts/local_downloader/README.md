# SonicMix Local Download Server

Download music from YouTube, Spotify (via YouTube search), and SoundCloud directly to your SonicMix library.

## macOS Quick Start

### 1. Install (One-time setup)

1. **Download** this folder to your Mac
2. **Make scripts executable** - Open Terminal and run:
   ```bash
   chmod +x ~/Downloads/local_downloader/*.command
   ```
   *(Adjust the path if you extracted the files elsewhere)*
3. **Double-click** `install_macos.command`
4. Follow the prompts to install dependencies

The installer will automatically set up:
- Python 3
- FFmpeg (for audio conversion)
- ngrok (for secure tunneling)
- All required Python packages

### 2. Configure ngrok (One-time)

1. Create a free account at [ngrok.com](https://ngrok.com)
2. Copy your auth token from the dashboard
3. Open Terminal and run:
   ```bash
   ngrok config add-authtoken YOUR_TOKEN_HERE
   ```

### 3. Start the Server

1. **Double-click** `SonicMix_Downloader.command`
2. The ngrok URL will be **automatically copied** to your clipboard
3. Paste the URL into SonicMix → Settings → Platform → Local Server URL

That's it! You can now import tracks from any URL.

---

## Manual Setup (Advanced)

If you prefer manual installation:

### Prerequisites

1. **Python 3.8+**
2. **FFmpeg** - `brew install ffmpeg`
3. **ngrok** - `brew install ngrok/ngrok/ngrok`

### Installation

```bash
cd scripts/local_downloader
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
```

### Running

Terminal 1:
```bash
source venv/bin/activate
python server.py
```

Terminal 2:
```bash
ngrok http 5000
```

Copy the ngrok URL to SonicMix settings.

---

## Configuration

Edit `.env` to customize:

```bash
# Directory for downloaded files
DOWNLOAD_DIR=./downloads

# Supabase credentials (for cloud upload)
SUPABASE_URL=https://guvcwvqkxnrwcdmwbifh.supabase.co
SUPABASE_SERVICE_KEY=your_service_key_here

# Auto-upload to cloud storage
UPLOAD_TO_CLOUD=true
```

---

## Supported Sources

| Platform | Support |
|----------|---------|
| YouTube | ✅ Direct URLs |
| YouTube Music | ✅ Direct URLs |
| Spotify | ✅ Via YouTube search |
| SoundCloud | ✅ Direct URLs |

---

## Troubleshooting

### "ngrok not authenticated"
Run: `ngrok config add-authtoken YOUR_TOKEN`

### "FFmpeg not found"
Run: `brew install ffmpeg`

### "Permission denied"
Run: `chmod +x *.command`

### Server won't start
Check if port 5000 is in use: `lsof -i :5000`

---

## How It Works

1. You paste a track URL in SonicMix
2. SonicMix sends the URL to your local server (via ngrok)
3. The server downloads the audio in lossless WAV format
4. If configured, uploads to your cloud storage
5. Track appears in your SonicMix library
