"""
TunePat Integration - Folder Watcher
Watches TunePat's output folder and auto-uploads new files to cloud storage.

Setup:
1. pip install watchdog requests python-dotenv
2. Set TUNEPAT_OUTPUT_DIR in .env to your TunePat output folder
3. Run: python tunepat_watcher.py
"""

import os
import time
import json
import hashlib
from pathlib import Path
from datetime import datetime
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler
import requests
from dotenv import load_dotenv

load_dotenv()

# Configuration
TUNEPAT_OUTPUT_DIR = os.getenv("TUNEPAT_OUTPUT_DIR", os.path.expanduser("~/Music/TunePat"))
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_KEY")
PROCESSED_FILES_LOG = os.path.join(os.path.dirname(__file__), ".processed_files.json")

# Supported audio formats
AUDIO_EXTENSIONS = {'.mp3', '.flac', '.wav', '.m4a', '.aac', '.ogg', '.opus'}

def load_processed_files():
    """Load list of already processed files"""
    if os.path.exists(PROCESSED_FILES_LOG):
        with open(PROCESSED_FILES_LOG, 'r') as f:
            return set(json.load(f))
    return set()

def save_processed_files(processed):
    """Save list of processed files"""
    with open(PROCESSED_FILES_LOG, 'w') as f:
        json.dump(list(processed), f)

def get_file_hash(filepath):
    """Get MD5 hash of file for deduplication"""
    hasher = hashlib.md5()
    with open(filepath, 'rb') as f:
        for chunk in iter(lambda: f.read(65536), b""):
            hasher.update(chunk)
    return hasher.hexdigest()

def extract_metadata(filepath):
    """Extract artist and title from filename or path"""
    filename = Path(filepath).stem
    parent_dir = Path(filepath).parent.name
    
    # Common patterns: "Artist - Title", "Title", or folder structure
    if " - " in filename:
        parts = filename.split(" - ", 1)
        artist = parts[0].strip()
        title = parts[1].strip()
    elif parent_dir and parent_dir != Path(TUNEPAT_OUTPUT_DIR).name:
        # Use parent folder as artist
        artist = parent_dir
        title = filename
    else:
        artist = "Unknown Artist"
        title = filename
    
    return {"artist": artist, "title": title}

def get_content_type(filepath):
    """Get MIME type for audio file"""
    ext = Path(filepath).suffix.lower()
    types = {
        '.mp3': 'audio/mpeg',
        '.flac': 'audio/flac',
        '.wav': 'audio/wav',
        '.m4a': 'audio/mp4',
        '.aac': 'audio/aac',
        '.ogg': 'audio/ogg',
        '.opus': 'audio/opus',
    }
    return types.get(ext, 'audio/mpeg')

def upload_to_supabase(filepath, metadata):
    """Upload file to Supabase storage and create track entry"""
    if not SUPABASE_URL or not SUPABASE_KEY:
        print("❌ Supabase credentials not configured in .env")
        return None
    
    filename = Path(filepath).name
    safe_filename = "".join(c for c in filename if c.isalnum() or c in ".-_ ").strip()
    storage_path = f"tunepat/{safe_filename}"
    
    print(f"📤 Uploading: {filename}")
    
    try:
        # Upload to storage
        with open(filepath, 'rb') as f:
            file_data = f.read()
            
        response = requests.post(
            f"{SUPABASE_URL}/storage/v1/object/audio-files/{storage_path}",
            headers={
                "Authorization": f"Bearer {SUPABASE_KEY}",
                "Content-Type": get_content_type(filepath),
            },
            data=file_data
        )
        
        if response.status_code not in [200, 201]:
            # Try upsert if file exists
            response = requests.put(
                f"{SUPABASE_URL}/storage/v1/object/audio-files/{storage_path}",
                headers={
                    "Authorization": f"Bearer {SUPABASE_KEY}",
                    "Content-Type": get_content_type(filepath),
                },
                data=file_data
            )
        
        if response.status_code in [200, 201]:
            public_url = f"{SUPABASE_URL}/storage/v1/object/public/audio-files/{storage_path}"
            
            # Create track entry in database
            track_data = {
                "title": metadata["title"],
                "artist": metadata["artist"],
                "platform": "tunepat",
                "audio_file_path": storage_path,
                "analysis_status": "uploaded",
                "source_url": f"tunepat://{filename}",
            }
            
            track_response = requests.post(
                f"{SUPABASE_URL}/rest/v1/tracks",
                headers={
                    "Authorization": f"Bearer {SUPABASE_KEY}",
                    "apikey": SUPABASE_KEY,
                    "Content-Type": "application/json",
                    "Prefer": "return=representation"
                },
                json=track_data
            )
            
            if track_response.status_code in [200, 201]:
                track = track_response.json()
                track_id = track[0]["id"] if isinstance(track, list) else track.get("id")
                print(f"✅ Uploaded and added to library: {metadata['title']} (ID: {track_id})")
                return {"url": public_url, "track_id": track_id}
            else:
                print(f"⚠️ File uploaded but failed to create track entry: {track_response.text}")
                return {"url": public_url}
        else:
            print(f"❌ Upload failed: {response.text}")
            return None
            
    except Exception as e:
        print(f"❌ Error uploading: {e}")
        return None

class TunePatHandler(FileSystemEventHandler):
    """Handle file system events from TunePat output folder"""
    
    def __init__(self):
        self.processed_files = load_processed_files()
        self.pending_files = {}  # Track files being written
    
    def on_created(self, event):
        if event.is_directory:
            return
        self.schedule_process(event.src_path)
    
    def on_modified(self, event):
        if event.is_directory:
            return
        self.schedule_process(event.src_path)
    
    def schedule_process(self, filepath):
        """Schedule file processing after a delay (to ensure write is complete)"""
        ext = Path(filepath).suffix.lower()
        if ext not in AUDIO_EXTENSIONS:
            return
        
        # Track when we first saw this file
        if filepath not in self.pending_files:
            self.pending_files[filepath] = time.time()
    
    def process_pending(self):
        """Process files that have been stable for a few seconds"""
        now = time.time()
        to_remove = []
        
        for filepath, first_seen in list(self.pending_files.items()):
            # Wait 3 seconds after last modification
            if now - first_seen < 3:
                continue
            
            # Check if file still exists and is complete
            if not os.path.exists(filepath):
                to_remove.append(filepath)
                continue
            
            # Get file hash for deduplication
            try:
                file_hash = get_file_hash(filepath)
            except:
                continue  # File still being written
            
            if file_hash in self.processed_files:
                print(f"⏭️ Skipping (already processed): {Path(filepath).name}")
                to_remove.append(filepath)
                continue
            
            # Process the file
            metadata = extract_metadata(filepath)
            result = upload_to_supabase(filepath, metadata)
            
            if result:
                self.processed_files.add(file_hash)
                save_processed_files(self.processed_files)
            
            to_remove.append(filepath)
        
        for filepath in to_remove:
            self.pending_files.pop(filepath, None)

def scan_existing_files(handler):
    """Scan for existing files that haven't been processed"""
    print(f"\n🔍 Scanning existing files in: {TUNEPAT_OUTPUT_DIR}")
    
    count = 0
    for root, dirs, files in os.walk(TUNEPAT_OUTPUT_DIR):
        for filename in files:
            ext = Path(filename).suffix.lower()
            if ext in AUDIO_EXTENSIONS:
                filepath = os.path.join(root, filename)
                
                try:
                    file_hash = get_file_hash(filepath)
                    if file_hash not in handler.processed_files:
                        print(f"  📁 Found: {filename}")
                        metadata = extract_metadata(filepath)
                        result = upload_to_supabase(filepath, metadata)
                        
                        if result:
                            handler.processed_files.add(file_hash)
                            count += 1
                except Exception as e:
                    print(f"  ❌ Error processing {filename}: {e}")
    
    if count > 0:
        save_processed_files(handler.processed_files)
        print(f"\n✅ Uploaded {count} existing files")
    else:
        print("\n✅ No new files to upload")

def main():
    print("=" * 60)
    print("🎵 TunePat Integration - Folder Watcher")
    print("=" * 60)
    print(f"\n📁 Watching: {TUNEPAT_OUTPUT_DIR}")
    print(f"☁️  Uploading to: {SUPABASE_URL or 'NOT CONFIGURED'}")
    
    if not os.path.exists(TUNEPAT_OUTPUT_DIR):
        print(f"\n⚠️  TunePat output directory doesn't exist!")
        print(f"   Creating: {TUNEPAT_OUTPUT_DIR}")
        os.makedirs(TUNEPAT_OUTPUT_DIR, exist_ok=True)
    
    handler = TunePatHandler()
    
    # First, scan existing files
    scan_existing_files(handler)
    
    # Set up folder watcher
    observer = Observer()
    observer.schedule(handler, TUNEPAT_OUTPUT_DIR, recursive=True)
    observer.start()
    
    print(f"\n👀 Watching for new files...")
    print("   Press Ctrl+C to stop\n")
    
    try:
        while True:
            handler.process_pending()
            time.sleep(1)
    except KeyboardInterrupt:
        print("\n\n👋 Stopping watcher...")
        observer.stop()
    
    observer.join()
    print("✅ Done!")

if __name__ == '__main__':
    main()
