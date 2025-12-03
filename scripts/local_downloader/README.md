# SonicMix Local Downloader & TunePat Integration

Download music from YouTube, Spotify, and SoundCloud in lossless quality.
**Now with TunePat integration!**

---

## 🎵 TunePat Integration (Recommended)

If you have TunePat on your Mac, you can automatically sync your TunePat downloads to SonicMix.

### Quick Setup

1. **Install dependencies** (one time):
   ```bash
   cd scripts/local_downloader
   pip3 install watchdog requests python-dotenv
   ```

2. **Configure** - Copy `.env.example` to `.env` and set:
   ```bash
   TUNEPAT_OUTPUT_DIR=~/Music/TunePat Spotify Converter
   SUPABASE_URL=https://guvcwvqkxnrwcdmwbifh.supabase.co
   SUPABASE_SERVICE_KEY=your_service_role_key_here
   ```
   
   > Find your TunePat output folder in TunePat → Settings → Output

3. **Run the watcher**:
   ```bash
   python3 tunepat_watcher.py
   ```

4. **Download in TunePat as normal** - files are automatically:
   - ✅ Detected when TunePat finishes downloading
   - ✅ Uploaded to cloud storage
   - ✅ Added to your SonicMix library

### How it works

The watcher monitors your TunePat output folder. When you download songs in TunePat, they're automatically uploaded to SonicMix's cloud storage and added to your library. It also scans existing files on startup.

---

## 🎬 YouTube/URL Downloads

Download from YouTube, SoundCloud, and other URLs.

### macOS - One Click Setup

1. **Download** this folder to your Mac

2. **Make it executable** - Open Terminal (one time only):
   ```bash
   chmod +x ~/Downloads/local_downloader/*.command
   ```

3. **Double-click** `SonicMix_Setup.command`

That's it! The script will:
- ✅ Install Homebrew (if needed)
- ✅ Install Python, FFmpeg, ngrok
- ✅ Ask for your ngrok token (free at ngrok.com)
- ✅ Start the server and copy the URL to your clipboard

Just paste the URL into SonicMix!

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

# TunePat Integration
TUNEPAT_OUTPUT_DIR=~/Music/TunePat Spotify Converter
```

---

## Supported Sources

| Source | Method | Quality |
|--------|--------|---------|
| TunePat | Folder watcher | Lossless (whatever TunePat outputs) |
| YouTube | Direct URLs | WAV/MP3 |
| YouTube Music | Direct URLs | WAV/MP3 |
| Spotify | Via YouTube search | WAV/MP3 |
| SoundCloud | Direct URLs | WAV/MP3 |

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

### TunePat files not syncing
- Check that `TUNEPAT_OUTPUT_DIR` matches your TunePat output folder
- Make sure the watcher script is running
- Check the terminal for error messages

---

## How It Works

### TunePat Integration
1. You download songs in TunePat
2. The watcher detects new files in TunePat's output folder
3. Files are uploaded to your cloud storage
4. Track entries are created in your SonicMix library
5. Refresh SonicMix to see your new tracks

### URL Downloads
1. You paste a track URL in SonicMix
2. SonicMix sends the URL to your local server (via ngrok)
3. The server downloads the audio in lossless WAV format
4. If configured, uploads to your cloud storage
5. Track appears in your SonicMix library
