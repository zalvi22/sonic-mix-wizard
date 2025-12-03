import { useState, useEffect, useCallback } from 'react';
import { detectPlatform, checkForUpdates as tauriCheckForUpdates, installUpdate as tauriInstallUpdate, UpdateInfo } from '@/lib/platform';

interface UseAppUpdaterReturn {
  updateAvailable: boolean;
  updateInfo: UpdateInfo | null;
  checking: boolean;
  installing: boolean;
  error: string | null;
  checkForUpdates: () => Promise<void>;
  installUpdate: () => Promise<void>;
  dismissUpdate: () => void;
}

export function useAppUpdater(): UseAppUpdaterReturn {
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
  const [checking, setChecking] = useState(false);
  const [installing, setInstalling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState(false);

  const platform = detectPlatform();

  const checkForUpdates = useCallback(async () => {
    if (platform !== 'desktop') return;

    setChecking(true);
    setError(null);

    try {
      const info = await tauriCheckForUpdates();
      setUpdateInfo(info);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to check for updates');
    } finally {
      setChecking(false);
    }
  }, [platform]);

  const installUpdate = useCallback(async () => {
    if (platform !== 'desktop' || !updateInfo?.available) return;

    setInstalling(true);
    setError(null);

    try {
      await tauriInstallUpdate();
      // App will restart after install
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to install update');
      setInstalling(false);
    }
  }, [platform, updateInfo]);

  const dismissUpdate = useCallback(() => {
    setDismissed(true);
  }, []);

  // Check for updates on mount (desktop only)
  useEffect(() => {
    if (platform === 'desktop') {
      // Delay check to not block app startup
      const timer = setTimeout(() => {
        checkForUpdates();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [platform, checkForUpdates]);

  return {
    updateAvailable: !dismissed && (updateInfo?.available ?? false),
    updateInfo,
    checking,
    installing,
    error,
    checkForUpdates,
    installUpdate,
    dismissUpdate,
  };
}
