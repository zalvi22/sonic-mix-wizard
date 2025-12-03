use serde::{Deserialize, Serialize};
use tauri_plugin_updater::UpdaterExt;

#[derive(Serialize, Deserialize, Clone)]
pub struct UpdateInfo {
    pub available: bool,
    pub version: Option<String>,
    pub current_version: String,
    pub body: Option<String>,
    pub date: Option<String>,
}

#[tauri::command]
pub async fn check_for_updates(app: tauri::AppHandle) -> Result<UpdateInfo, String> {
    let current_version = app.package_info().version.to_string();
    
    match app.updater() {
        Ok(updater) => {
            match updater.check().await {
                Ok(Some(update)) => {
                    Ok(UpdateInfo {
                        available: true,
                        version: Some(update.version.clone()),
                        current_version,
                        body: update.body.clone(),
                        date: update.date.map(|d| d.to_string()),
                    })
                }
                Ok(None) => {
                    Ok(UpdateInfo {
                        available: false,
                        version: None,
                        current_version,
                        body: None,
                        date: None,
                    })
                }
                Err(e) => Err(format!("Failed to check for updates: {}", e))
            }
        }
        Err(e) => Err(format!("Updater not available: {}", e))
    }
}

#[tauri::command]
pub async fn install_update(app: tauri::AppHandle) -> Result<(), String> {
    match app.updater() {
        Ok(updater) => {
            match updater.check().await {
                Ok(Some(update)) => {
                    // Download and install
                    let mut downloaded = 0;
                    
                    update.download_and_install(
                        |chunk_length, content_length| {
                            downloaded += chunk_length;
                            if let Some(total) = content_length {
                                println!("Downloaded {} of {} bytes", downloaded, total);
                            }
                        },
                        || {
                            println!("Download complete, installing...");
                        }
                    ).await.map_err(|e| format!("Failed to install update: {}", e))?;
                    
                    Ok(())
                }
                Ok(None) => Err("No update available".to_string()),
                Err(e) => Err(format!("Failed to check for updates: {}", e))
            }
        }
        Err(e) => Err(format!("Updater not available: {}", e))
    }
}
