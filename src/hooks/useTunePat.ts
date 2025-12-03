import { useState, useCallback, useEffect, useRef } from 'react';
import { detectPlatform, tauriInvoke, tauriListen } from '@/lib/platform';
import { useToast } from '@/hooks/use-toast';
import { Track } from '@/types/dj';

interface NewTrackEvent {
  path: string;
  filename: string;
  artist: string | null;
  title: string | null;
}

interface TunePatState {
  isWatching: boolean;
  watchPath: string | null;
  recentTracks: NewTrackEvent[];
  error: string | null;
}

export function useTunePat(onNewTrack?: (track: Track) => void) {
  const platform = detectPlatform();
  const { toast } = useToast();
  const unlistenRef = useRef<(() => void) | null>(null);
  
  const [state, setState] = useState<TunePatState>({
    isWatching: false,
    watchPath: null,
    recentTracks: [],
    error: null,
  });

  // Get default TunePat path
  const getDefaultPath = useCallback(async (): Promise<string | null> => {
    if (platform !== 'desktop') return null;
    
    try {
      return await tauriInvoke<string | null>('tunepat_get_default_path');
    } catch {
      return null;
    }
  }, [platform]);

  // Start watching
  const startWatching = useCallback(async (path?: string): Promise<boolean> => {
    if (platform !== 'desktop') {
      toast({
        title: 'Desktop Required',
        description: 'TunePat integration requires the desktop app.',
        variant: 'destructive',
      });
      return false;
    }
    
    try {
      const watchPath = path || await getDefaultPath();
      if (!watchPath) {
        toast({
          title: 'No Path Found',
          description: 'Could not find TunePat output folder. Please specify manually.',
          variant: 'destructive',
        });
        return false;
      }
      
      await tauriInvoke<boolean>('tunepat_start_watching', { path: watchPath });
      setState(prev => ({ ...prev, isWatching: true, watchPath, error: null }));
      
      toast({
        title: 'Watching for Downloads',
        description: `Monitoring: ${watchPath}`,
      });
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to start watching';
      setState(prev => ({ ...prev, error: message }));
      toast({
        title: 'TunePat Error',
        description: message,
        variant: 'destructive',
      });
      return false;
    }
  }, [platform, getDefaultPath, toast]);

  // Stop watching
  const stopWatching = useCallback(async (): Promise<boolean> => {
    if (platform !== 'desktop') return false;
    
    try {
      await tauriInvoke<boolean>('tunepat_stop_watching');
      setState(prev => ({ ...prev, isWatching: false, error: null }));
      toast({
        title: 'Stopped Watching',
        description: 'TunePat folder monitoring stopped',
      });
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to stop watching';
      setState(prev => ({ ...prev, error: message }));
      return false;
    }
  }, [platform, toast]);

  // Handle new track event
  const handleNewTrack = useCallback((event: NewTrackEvent) => {
    setState(prev => ({
      ...prev,
      recentTracks: [event, ...prev.recentTracks.slice(0, 9)],
    }));
    
    toast({
      title: 'New Track Downloaded',
      description: event.title || event.filename,
    });
    
    // Convert to Track type and call callback
    if (onNewTrack) {
      const track: Track = {
        id: `tunepat-${Date.now()}`,
        title: event.title || event.filename.replace(/\.[^/.]+$/, ''),
        artist: event.artist || 'Unknown Artist',
        duration: 0,
        bpm: 120,
        key: 'Am',
        platform: 'local',
        // The audioUrl would need to be uploaded to cloud storage
      };
      onNewTrack(track);
    }
  }, [onNewTrack, toast]);

  // Set up event listener
  useEffect(() => {
    if (platform === 'desktop') {
      tauriListen<NewTrackEvent>('tunepat-new-track', handleNewTrack)
        .then(unlisten => {
          unlistenRef.current = unlisten;
        });
    }
    
    return () => {
      if (unlistenRef.current) {
        unlistenRef.current();
      }
    };
  }, [platform, handleNewTrack]);

  // Check initial status
  useEffect(() => {
    if (platform === 'desktop') {
      getDefaultPath().then(path => {
        if (path) {
          setState(prev => ({ ...prev, watchPath: path }));
        }
      });
    }
  }, [platform, getDefaultPath]);

  return {
    ...state,
    isDesktop: platform === 'desktop',
    startWatching,
    stopWatching,
    getDefaultPath,
  };
}
