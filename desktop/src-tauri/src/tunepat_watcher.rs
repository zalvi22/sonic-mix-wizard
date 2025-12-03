use notify::{Config, RecommendedWatcher, RecursiveMode, Watcher, Event, EventKind};
use std::path::Path;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;
use tauri::{AppHandle, Emitter};
use tokio::sync::mpsc;
use serde::Serialize;

static WATCHING: AtomicBool = AtomicBool::new(false);

#[derive(Clone, Serialize)]
pub struct NewTrackEvent {
    pub path: String,
    pub filename: String,
    pub artist: Option<String>,
    pub title: Option<String>,
}

/// Get the default TunePat output directory
pub fn get_default_tunepat_path() -> Result<Option<String>, String> {
    let home = directories::UserDirs::new()
        .ok_or("Could not find home directory")?;
    
    let music_dir = home.audio_dir()
        .or_else(|| home.home_dir().join("Music").exists().then(|| home.home_dir().join("Music").as_path()))
        .map(|p| p.to_path_buf());
    
    if let Some(music) = music_dir {
        // Check common TunePat locations
        let tunepat_paths = [
            music.join("TunePat Spotify Converter"),
            music.join("TunePat"),
            music.join("TunePat Amazon Music Converter"),
            music.join("TunePat Apple Music Converter"),
        ];
        
        for path in tunepat_paths {
            if path.exists() {
                return Ok(Some(path.to_string_lossy().to_string()));
            }
        }
    }
    
    Ok(None)
}

/// Parse artist and title from filename
fn parse_track_info(filename: &str) -> (Option<String>, Option<String>) {
    let name = Path::new(filename)
        .file_stem()
        .and_then(|s| s.to_str())
        .unwrap_or(filename);
    
    // Common patterns: "Artist - Title", "Artist_-_Title", "Artist – Title"
    let separators = [" - ", " – ", "_-_", " _ "];
    
    for sep in separators {
        if let Some(idx) = name.find(sep) {
            let artist = name[..idx].trim().to_string();
            let title = name[idx + sep.len()..].trim().to_string();
            if !artist.is_empty() && !title.is_empty() {
                return (Some(artist), Some(title));
            }
        }
    }
    
    (None, Some(name.to_string()))
}

/// Check if file is a supported audio format
fn is_audio_file(path: &Path) -> bool {
    let extensions = ["mp3", "flac", "wav", "m4a", "aac", "ogg", "wma"];
    path.extension()
        .and_then(|e| e.to_str())
        .map(|e| extensions.contains(&e.to_lowercase().as_str()))
        .unwrap_or(false)
}

/// Start watching a directory for new audio files
pub async fn start_watching(path: String, app: AppHandle) -> Result<bool, String> {
    if WATCHING.load(Ordering::SeqCst) {
        return Err("Already watching".to_string());
    }
    
    let watch_path = Path::new(&path);
    if !watch_path.exists() {
        return Err(format!("Directory does not exist: {}", path));
    }
    
    WATCHING.store(true, Ordering::SeqCst);
    
    let (tx, mut rx) = mpsc::channel::<Event>(100);
    
    // Spawn watcher in background
    let path_clone = path.clone();
    std::thread::spawn(move || {
        let rt = tokio::runtime::Runtime::new().unwrap();
        rt.block_on(async {
            let tx = tx;
            let mut watcher = RecommendedWatcher::new(
                move |res: Result<Event, notify::Error>| {
                    if let Ok(event) = res {
                        let _ = tx.blocking_send(event);
                    }
                },
                Config::default(),
            ).expect("Failed to create watcher");
            
            watcher.watch(Path::new(&path_clone), RecursiveMode::Recursive)
                .expect("Failed to watch directory");
            
            println!("[TunePat] Watching: {}", path_clone);
            
            // Keep thread alive while watching
            while WATCHING.load(Ordering::SeqCst) {
                std::thread::sleep(std::time::Duration::from_secs(1));
            }
        });
    });
    
    // Process events
    let app_clone = app.clone();
    tokio::spawn(async move {
        while let Some(event) = rx.recv().await {
            if !WATCHING.load(Ordering::SeqCst) {
                break;
            }
            
            if let EventKind::Create(_) = event.kind {
                for path in event.paths {
                    if is_audio_file(&path) {
                        let filename = path.file_name()
                            .and_then(|n| n.to_str())
                            .unwrap_or("unknown")
                            .to_string();
                        
                        let (artist, title) = parse_track_info(&filename);
                        
                        let track_event = NewTrackEvent {
                            path: path.to_string_lossy().to_string(),
                            filename: filename.clone(),
                            artist,
                            title,
                        };
                        
                        println!("[TunePat] New track: {}", filename);
                        
                        // Emit event to frontend
                        let _ = app_clone.emit("tunepat-new-track", track_event);
                    }
                }
            }
        }
    });
    
    Ok(true)
}

/// Stop watching
pub async fn stop_watching() -> Result<bool, String> {
    WATCHING.store(false, Ordering::SeqCst);
    println!("[TunePat] Stopped watching");
    Ok(true)
}
