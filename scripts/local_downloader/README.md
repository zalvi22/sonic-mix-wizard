# SonicMix Local Download Server

This Python server runs on your local machine to download music from YouTube, Spotify (via YouTube search), and SoundCloud.

## Prerequisites

1. **Python 3.8+**
2. **FFmpeg** - Required for audio conversion
   - Windows: Download from https://ffmpeg.org/download.html and add to PATH
   - Mac: `brew install ffmpeg`
   - Linux: `sudo apt install ffmpeg`

3. **ngrok** (free) - To expose your local server
   - Sign up at https://ngrok.com
   - Download and install ngrok

## Setup

1. **Install dependencies:**
   ```bash
   cd scripts/local_downloader
   pip install -r requirements.txt
   ```

2. **Configure environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your Supabase credentials
   ```

3. **Start the server:**
   ```bash
   python server.py
   ```

4. **Expose with ngrok:**
   ```bash
   ngrok http 5000
   ```
   
   Copy the `https://xxxx.ngrok.io` URL

5. **Add to SonicMix:**
   - Open the SonicMix app
   - Go to Platform Settings
   - Paste your ngrok URL as the "Local Downloader URL"

## How It Works

1. When you import a track URL in SonicMix, it sends a request to your local server
2. The server downloads the audio in lossless WAV format
3. If configured, it uploads the file to your Lovable Cloud storage
4. The track becomes available in your SonicMix library

## API Endpoints

- `GET /health` - Check if server is running
- `POST /download` - Start a download job
- `GET /status/<job_id>` - Check download progress
- `POST /batch` - Download multiple tracks

## Supported Sources

- **YouTube** - Direct URLs or searches
- **Spotify** - Searches YouTube for the track (legal gray area)
- **SoundCloud** - Direct URLs

## Notes

- Downloaded files are saved to the `./downloads` folder by default
- Files are converted to lossless WAV format
- The server runs on port 5000 by default
