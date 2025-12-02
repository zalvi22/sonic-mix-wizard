"""
SonicMix Local Download Server
Run this on your local machine to handle music downloads.

Setup:
1. pip install flask flask-cors yt-dlp spotipy youtube-search-python pydub requests python-dotenv
2. Install FFmpeg: https://ffmpeg.org/download.html
3. Create .env file with your credentials (see .env.example)
4. Run: python server.py
5. Use ngrok to expose: ngrok http 5000
6. Add the ngrok URL to SonicMix settings

"""

import os
import json
import uuid
import threading
from pathlib import Path
from flask import Flask, request, jsonify
from flask_cors import CORS
import yt_dlp
from youtube_search import YoutubeSearch
import requests
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app)

# Configuration
DOWNLOAD_DIR = os.getenv("DOWNLOAD_DIR", "./downloads")
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_KEY")
UPLOAD_TO_CLOUD = os.getenv("UPLOAD_TO_CLOUD", "true").lower() == "true"

# Ensure download directory exists
Path(DOWNLOAD_DIR).mkdir(parents=True, exist_ok=True)

# Track download status
download_status = {}

def search_youtube(query, max_results=1):
    """Search YouTube for a track"""
    try:
        results = YoutubeSearch(query, max_results=max_results).to_dict()
        if results:
            return f"https://www.youtube.com{results[0]['url_suffix']}"
    except Exception as e:
        print(f"YouTube search error: {e}")
    return None

def download_audio(url, output_path, format='wav'):
    """Download audio from URL using yt-dlp"""
    ydl_opts = {
        'format': 'bestaudio/best',
        'outtmpl': output_path,
        'postprocessors': [{
            'key': 'FFmpegExtractAudio',
            'preferredcodec': format,
            'preferredquality': '0',  # Best quality for lossless
        }],
        'quiet': False,
        'no_warnings': False,
    }
    
    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        ydl.download([url])
    
    # yt-dlp adds extension, find the actual file
    for ext in [f'.{format}', '.wav', '.mp3', '.m4a', '.opus']:
        if os.path.exists(f"{output_path}{ext}"):
            return f"{output_path}{ext}"
    return None

def upload_to_supabase(file_path, bucket="audio-files"):
    """Upload file to Supabase storage"""
    if not SUPABASE_URL or not SUPABASE_KEY:
        print("Supabase credentials not configured")
        return None
    
    filename = os.path.basename(file_path)
    storage_path = f"downloads/{filename}"
    
    try:
        with open(file_path, 'rb') as f:
            response = requests.post(
                f"{SUPABASE_URL}/storage/v1/object/{bucket}/{storage_path}",
                headers={
                    "Authorization": f"Bearer {SUPABASE_KEY}",
                    "Content-Type": "audio/wav",
                },
                data=f.read()
            )
        
        if response.status_code in [200, 201]:
            public_url = f"{SUPABASE_URL}/storage/v1/object/public/{bucket}/{storage_path}"
            return public_url
        else:
            print(f"Upload failed: {response.text}")
    except Exception as e:
        print(f"Upload error: {e}")
    
    return None

def process_download(job_id, data):
    """Background task to download and process audio"""
    try:
        download_status[job_id] = {"status": "searching", "progress": 10}
        
        url = data.get("url")
        title = data.get("title", "Unknown")
        artist = data.get("artist", "Unknown")
        platform = data.get("platform", "unknown")
        track_id = data.get("track_id")
        
        # If it's a search query (Spotify), find on YouTube
        if platform == "spotify" or not url.startswith("http"):
            search_query = f"{artist} - {title}"
            print(f"Searching YouTube for: {search_query}")
            url = search_youtube(search_query)
            
            if not url:
                download_status[job_id] = {"status": "error", "error": "Track not found on YouTube"}
                return
        
        download_status[job_id] = {"status": "downloading", "progress": 30}
        
        # Generate output filename
        safe_title = "".join(c for c in title if c.isalnum() or c in " -_").strip()
        safe_artist = "".join(c for c in artist if c.isalnum() or c in " -_").strip()
        output_name = f"{safe_artist} - {safe_title}" if safe_artist else safe_title
        output_path = os.path.join(DOWNLOAD_DIR, output_name)
        
        # Download the audio
        print(f"Downloading: {url}")
        downloaded_file = download_audio(url, output_path, format='wav')
        
        if not downloaded_file:
            download_status[job_id] = {"status": "error", "error": "Download failed"}
            return
        
        download_status[job_id] = {"status": "processing", "progress": 70}
        
        result = {
            "status": "complete",
            "progress": 100,
            "local_path": downloaded_file,
            "filename": os.path.basename(downloaded_file),
        }
        
        # Upload to Supabase if configured
        if UPLOAD_TO_CLOUD:
            download_status[job_id] = {"status": "uploading", "progress": 85}
            cloud_url = upload_to_supabase(downloaded_file)
            if cloud_url:
                result["cloud_url"] = cloud_url
                
                # Update track in database if track_id provided
                if track_id and SUPABASE_URL and SUPABASE_KEY:
                    try:
                        response = requests.patch(
                            f"{SUPABASE_URL}/rest/v1/tracks?id=eq.{track_id}",
                            headers={
                                "Authorization": f"Bearer {SUPABASE_KEY}",
                                "apikey": SUPABASE_KEY,
                                "Content-Type": "application/json",
                                "Prefer": "return=minimal"
                            },
                            json={
                                "audio_file_path": f"downloads/{os.path.basename(downloaded_file)}",
                                "analysis_status": "uploaded"
                            }
                        )
                        print(f"Track updated: {response.status_code}")
                    except Exception as e:
                        print(f"Failed to update track: {e}")
        
        download_status[job_id] = result
        print(f"Download complete: {downloaded_file}")
        
    except Exception as e:
        print(f"Download error: {e}")
        download_status[job_id] = {"status": "error", "error": str(e)}

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({"status": "ok", "service": "sonicmix-downloader"})

@app.route('/download', methods=['POST'])
def start_download():
    """Start a download job"""
    data = request.json
    
    if not data:
        return jsonify({"error": "No data provided"}), 400
    
    job_id = str(uuid.uuid4())
    download_status[job_id] = {"status": "queued", "progress": 0}
    
    # Start download in background thread
    thread = threading.Thread(target=process_download, args=(job_id, data))
    thread.start()
    
    return jsonify({"job_id": job_id, "status": "queued"})

@app.route('/status/<job_id>', methods=['GET'])
def get_status(job_id):
    """Get download status"""
    if job_id not in download_status:
        return jsonify({"error": "Job not found"}), 404
    
    return jsonify(download_status[job_id])

@app.route('/batch', methods=['POST'])
def batch_download():
    """Start batch download for multiple tracks"""
    data = request.json
    tracks = data.get("tracks", [])
    
    if not tracks:
        return jsonify({"error": "No tracks provided"}), 400
    
    jobs = []
    for track in tracks:
        job_id = str(uuid.uuid4())
        download_status[job_id] = {"status": "queued", "progress": 0}
        thread = threading.Thread(target=process_download, args=(job_id, track))
        thread.start()
        jobs.append({"job_id": job_id, "title": track.get("title")})
    
    return jsonify({"jobs": jobs})

if __name__ == '__main__':
    print("=" * 50)
    print("SonicMix Local Download Server")
    print("=" * 50)
    print(f"Download directory: {os.path.abspath(DOWNLOAD_DIR)}")
    print(f"Upload to cloud: {UPLOAD_TO_CLOUD}")
    print()
    print("Expose this server with ngrok:")
    print("  ngrok http 5000")
    print()
    print("Then add the ngrok URL to SonicMix settings")
    print("=" * 50)
    
    app.run(host='0.0.0.0', port=5000, debug=True)
