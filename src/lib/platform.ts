// Platform detection and unified API for web vs desktop (Tauri)

export type PlatformType = 'web' | 'desktop';

export interface PlatformCapabilities {
  sonicPi: boolean;
  localDownloader: boolean;
  tunePatWatcher: boolean;
  systemTray: boolean;
  fileSystemAccess: boolean;
}

export interface UpdateInfo {
  available: boolean;
  version: string | null;
  current_version: string;
  body: string | null;
  date: string | null;
}

declare global {
  interface Window {
    __TAURI__?: {
      core: {
        invoke: <T>(cmd: string, args?: Record<string, unknown>) => Promise<T>;
      };
      event: {
        listen: <T>(event: string, handler: (e: { payload: T }) => void) => Promise<() => void>;
      };
    };
  }
}

export function detectPlatform(): PlatformType {
  if (typeof window !== 'undefined' && window.__TAURI__) {
    return 'desktop';
  }
  return 'web';
}

export function getPlatformCapabilities(): PlatformCapabilities {
  const platform = detectPlatform();
  
  if (platform === 'desktop') {
    return {
      sonicPi: true,
      localDownloader: true,
      tunePatWatcher: true,
      systemTray: true,
      fileSystemAccess: true,
    };
  }
  
  return {
    sonicPi: false,
    localDownloader: false,
    tunePatWatcher: false,
    systemTray: false,
    fileSystemAccess: false,
  };
}

// Type-safe Tauri invoke wrapper
export async function tauriInvoke<T>(command: string, args?: Record<string, unknown>): Promise<T> {
  if (!window.__TAURI__) {
    throw new Error('Tauri commands only available in desktop mode');
  }
  
  return window.__TAURI__.core.invoke<T>(command, args);
}

// Tauri event listener wrapper
export async function tauriListen<T>(
  event: string, 
  callback: (payload: T) => void
): Promise<() => void> {
  if (!window.__TAURI__) {
    return () => {}; // No-op for web
  }
  
  return window.__TAURI__.event.listen<T>(event, (e) => callback(e.payload));
}

// Updater functions
export async function checkForUpdates(): Promise<UpdateInfo> {
  return tauriInvoke<UpdateInfo>('check_for_updates');
}

export async function installUpdate(): Promise<void> {
  return tauriInvoke<void>('install_update');
}
