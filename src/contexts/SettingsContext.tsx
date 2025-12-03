import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type AudioQuality = 'low' | 'medium' | 'high' | 'lossless';
export type KeyNotation = 'camelot' | 'openkey' | 'standard';
export type ThemeAccent = 'cyan' | 'magenta' | 'purple' | 'green' | 'orange';

export interface Settings {
  // Audio Settings
  audioQuality: AudioQuality;
  autoGainControl: boolean;
  masterLimiter: boolean;
  crossfadeDuration: number; // seconds
  
  // BPM Settings
  defaultBpm: number;
  bpmRange: [number, number];
  autoSyncEnabled: boolean;
  
  // Key Detection
  keyNotation: KeyNotation;
  harmonicMixing: boolean;
  keyLock: boolean;
  
  // Theme
  themeAccent: ThemeAccent;
  showWaveformColors: boolean;
  highContrastMode: boolean;
  animationsEnabled: boolean;
  
  // Performance
  waveformResolution: 'low' | 'medium' | 'high';
  preloadTracks: boolean;
}

const defaultSettings: Settings = {
  audioQuality: 'high',
  autoGainControl: true,
  masterLimiter: true,
  crossfadeDuration: 8,
  
  defaultBpm: 128,
  bpmRange: [70, 180],
  autoSyncEnabled: true,
  
  keyNotation: 'camelot',
  harmonicMixing: true,
  keyLock: false,
  
  themeAccent: 'cyan',
  showWaveformColors: true,
  highContrastMode: false,
  animationsEnabled: true,
  
  waveformResolution: 'high',
  preloadTracks: true,
};

interface SettingsContextType {
  settings: Settings;
  updateSettings: (partial: Partial<Settings>) => void;
  resetSettings: () => void;
}

const SettingsContext = createContext<SettingsContextType | null>(null);

const STORAGE_KEY = 'sonicmix-settings';

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        return { ...defaultSettings, ...JSON.parse(stored) };
      } catch {
        return defaultSettings;
      }
    }
    return defaultSettings;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  // Apply theme accent to CSS variables
  useEffect(() => {
    const root = document.documentElement;
    const accentColors: Record<ThemeAccent, string> = {
      cyan: '185 100% 50%',
      magenta: '320 100% 60%',
      purple: '270 100% 65%',
      green: '150 100% 50%',
      orange: '30 100% 55%',
    };
    root.style.setProperty('--primary', accentColors[settings.themeAccent]);
    root.style.setProperty('--ring', accentColors[settings.themeAccent]);
  }, [settings.themeAccent]);

  const updateSettings = (partial: Partial<Settings>) => {
    setSettings(prev => ({ ...prev, ...partial }));
  };

  const resetSettings = () => {
    setSettings(defaultSettings);
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, resetSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}
