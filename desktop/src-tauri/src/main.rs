// Prevents additional console window on Windows in release
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod sonic_pi;
mod tunepat_watcher;
mod downloader;
mod updater;

use std::sync::Mutex;
use tauri::State;
use serde::{Deserialize, Serialize};

// Application state
pub struct AppState {
    sonic_pi_connected: Mutex<bool>,
    tunepat_watching: Mutex<bool>,
    tunepat_path: Mutex<Option<String>>,
}

#[derive(Serialize, Deserialize)]
pub struct StatusResponse {
    sonic_pi: bool,
    tunepat_watching: bool,
    tunepat_path: Option<String>,
}

// Get overall status
#[tauri::command]
async fn get_status(state: State<'_, AppState>) -> Result<StatusResponse, String> {
    let sonic_pi = *state.sonic_pi_connected.lock().unwrap();
    let tunepat_watching = *state.tunepat_watching.lock().unwrap();
    let tunepat_path = state.tunepat_path.lock().unwrap().clone();
    
    Ok(StatusResponse {
        sonic_pi,
        tunepat_watching,
        tunepat_path,
    })
}

// Sonic Pi commands
#[tauri::command]
async fn sonic_pi_run(code: String, state: State<'_, AppState>) -> Result<bool, String> {
    match sonic_pi::run_code(&code).await {
        Ok(_) => {
            *state.sonic_pi_connected.lock().unwrap() = true;
            Ok(true)
        }
        Err(e) => {
            *state.sonic_pi_connected.lock().unwrap() = false;
            Err(e)
        }
    }
}

#[tauri::command]
async fn sonic_pi_stop(state: State<'_, AppState>) -> Result<bool, String> {
    match sonic_pi::stop().await {
        Ok(_) => Ok(true),
        Err(e) => {
            *state.sonic_pi_connected.lock().unwrap() = false;
            Err(e)
        }
    }
}

#[tauri::command]
async fn sonic_pi_check() -> Result<bool, String> {
    sonic_pi::check_connection().await
}

// TunePat watcher commands
#[tauri::command]
async fn tunepat_start_watching(
    path: String,
    state: State<'_, AppState>,
    app: tauri::AppHandle,
) -> Result<bool, String> {
    *state.tunepat_path.lock().unwrap() = Some(path.clone());
    *state.tunepat_watching.lock().unwrap() = true;
    
    // Start watching in background
    tunepat_watcher::start_watching(path, app).await
}

#[tauri::command]
async fn tunepat_stop_watching(state: State<'_, AppState>) -> Result<bool, String> {
    *state.tunepat_watching.lock().unwrap() = false;
    tunepat_watcher::stop_watching().await
}

#[tauri::command]
async fn tunepat_get_default_path() -> Result<Option<String>, String> {
    tunepat_watcher::get_default_tunepat_path()
}

// Downloader commands
#[tauri::command]
async fn download_track(url: String, format: String) -> Result<String, String> {
    downloader::download(&url, &format).await
}

#[tauri::command]
async fn check_ytdlp() -> Result<bool, String> {
    downloader::check_ytdlp_installed().await
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .manage(AppState {
            sonic_pi_connected: Mutex::new(false),
            tunepat_watching: Mutex::new(false),
            tunepat_path: Mutex::new(None),
        })
        .invoke_handler(tauri::generate_handler![
            get_status,
            sonic_pi_run,
            sonic_pi_stop,
            sonic_pi_check,
            tunepat_start_watching,
            tunepat_stop_watching,
            tunepat_get_default_path,
            download_track,
            check_ytdlp,
            updater::check_for_updates,
            updater::install_update,
        ])
        .setup(|app| {
            #[cfg(debug_assertions)]
            {
                let window = app.get_webview_window("main").unwrap();
                window.open_devtools();
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
