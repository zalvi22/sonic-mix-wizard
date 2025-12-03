import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';

// Types
export interface AppStatus {
  sonic_pi: boolean;
  tunepat_watching: boolean;
  tunepat_path: string | null;
}

export interface NewTrackEvent {
  path: string;
  filename: string;
  artist: string | null;
  title: string | null;
}

// Status
export async function getStatus(): Promise<AppStatus> {
  return invoke('get_status');
}

// Sonic Pi
export async function sonicPiRun(code: string): Promise<boolean> {
  return invoke('sonic_pi_run', { code });
}

export async function sonicPiStop(): Promise<boolean> {
  return invoke('sonic_pi_stop');
}

export async function sonicPiCheck(): Promise<boolean> {
  return invoke('sonic_pi_check');
}

// TunePat
export async function tunepatStartWatching(path: string): Promise<boolean> {
  return invoke('tunepat_start_watching', { path });
}

export async function tunepatStopWatching(): Promise<boolean> {
  return invoke('tunepat_stop_watching');
}

export async function tunepatGetDefaultPath(): Promise<string | null> {
  return invoke('tunepat_get_default_path');
}

export function onNewTrack(callback: (event: NewTrackEvent) => void) {
  return listen<NewTrackEvent>('tunepat-new-track', (event) => {
    callback(event.payload);
  });
}

// Downloader
export async function downloadTrack(url: string, format: string = 'mp3'): Promise<string> {
  return invoke('download_track', { url, format });
}

export async function checkYtdlp(): Promise<boolean> {
  return invoke('check_ytdlp');
}

// Check if running in Tauri
export function isTauri(): boolean {
  return typeof window !== 'undefined' && '__TAURI__' in window;
}
