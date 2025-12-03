use std::process::Command;
use std::path::PathBuf;
use directories::UserDirs;

/// Get the downloads directory
fn get_downloads_dir() -> PathBuf {
    UserDirs::new()
        .and_then(|dirs| dirs.audio_dir().map(|p| p.to_path_buf()))
        .unwrap_or_else(|| {
            UserDirs::new()
                .map(|dirs| dirs.home_dir().join("Music").join("SonicMix"))
                .unwrap_or_else(|| PathBuf::from("./downloads"))
        })
        .join("SonicMix Downloads")
}

/// Check if yt-dlp is installed
pub async fn check_ytdlp_installed() -> Result<bool, String> {
    let output = Command::new("which")
        .arg("yt-dlp")
        .output();
    
    match output {
        Ok(o) => Ok(o.status.success()),
        Err(_) => {
            // Try direct path on macOS
            let brew_path = PathBuf::from("/opt/homebrew/bin/yt-dlp");
            Ok(brew_path.exists())
        }
    }
}

/// Download audio from URL using yt-dlp
pub async fn download(url: &str, format: &str) -> Result<String, String> {
    let downloads_dir = get_downloads_dir();
    
    // Create directory if it doesn't exist
    std::fs::create_dir_all(&downloads_dir)
        .map_err(|e| format!("Failed to create downloads directory: {}", e))?;
    
    let output_template = downloads_dir.join("%(title)s.%(ext)s");
    
    // Determine audio format args
    let (audio_format, audio_quality) = match format {
        "wav" => ("wav", "0"),
        "flac" => ("flac", "0"),
        "mp3" => ("mp3", "320K"),
        _ => ("mp3", "320K"),
    };
    
    println!("[Downloader] Starting download: {} as {}", url, format);
    
    let output = Command::new("yt-dlp")
        .args([
            "-x",  // Extract audio
            "--audio-format", audio_format,
            "--audio-quality", audio_quality,
            "-o", output_template.to_str().unwrap(),
            "--no-playlist",
            "--embed-metadata",
            "--embed-thumbnail",
            url,
        ])
        .output()
        .map_err(|e| format!("Failed to run yt-dlp: {}", e))?;
    
    if output.status.success() {
        let stdout = String::from_utf8_lossy(&output.stdout);
        
        // Try to extract the output filename from yt-dlp output
        // Look for "[ExtractAudio] Destination:" or the final output path
        for line in stdout.lines() {
            if line.contains("Destination:") || line.contains("[download]") {
                if let Some(path) = line.split(':').last() {
                    let path = path.trim();
                    if !path.is_empty() && PathBuf::from(path).exists() {
                        println!("[Downloader] Success: {}", path);
                        return Ok(path.to_string());
                    }
                }
            }
        }
        
        // If we can't find the exact path, return the downloads directory
        println!("[Downloader] Completed, files in: {:?}", downloads_dir);
        Ok(downloads_dir.to_string_lossy().to_string())
    } else {
        let stderr = String::from_utf8_lossy(&output.stderr);
        println!("[Downloader] Failed: {}", stderr);
        Err(format!("Download failed: {}", stderr))
    }
}

/// Download with progress callback (for future use)
pub async fn download_with_progress<F>(
    url: &str,
    format: &str,
    _on_progress: F,
) -> Result<String, String>
where
    F: Fn(f32) + Send + 'static,
{
    // For now, just use the basic download
    // In the future, we could parse yt-dlp's progress output
    download(url, format).await
}
