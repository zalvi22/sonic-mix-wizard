import React, { createContext, useContext, ReactNode } from 'react';
import { useTrackDownloader } from '@/hooks/useTrackDownloader';

type TrackDownloaderContextType = ReturnType<typeof useTrackDownloader>;

const TrackDownloaderContext = createContext<TrackDownloaderContextType | null>(null);

export function TrackDownloaderProvider({ children }: { children: ReactNode }) {
  const downloader = useTrackDownloader();
  
  return (
    <TrackDownloaderContext.Provider value={downloader}>
      {children}
    </TrackDownloaderContext.Provider>
  );
}

export function useTrackDownloaderContext() {
  const context = useContext(TrackDownloaderContext);
  if (!context) {
    throw new Error('useTrackDownloaderContext must be used within TrackDownloaderProvider');
  }
  return context;
}
