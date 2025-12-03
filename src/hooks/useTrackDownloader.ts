import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Track, Platform } from '@/types/dj';
import { generateWaveformFromUrl, WaveformData } from '@/lib/waveformGenerator';
import { DownloadItem } from '@/components/dj/DownloadProgress';

interface SpotifyTrack {
  id: string;
  name: string;
  artists: { name: string }[];
  album: { name: string; images: { url: string }[] };
  duration_ms: number;
  external_urls: { spotify: string };
  preview_url: string | null;
}

interface DownloadResult {
  success: boolean;
  track?: Track;
  audioUrl?: string;
  error?: string;
}

export function useTrackDownloader() {
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState<Record<string, 'pending' | 'downloading' | 'complete' | 'error' | 'analyzing'>>({});
  const [downloadItems, setDownloadItems] = useState<DownloadItem[]>([]);
  const { toast } = useToast();

  // Update download item
  const updateDownloadItem = useCallback((id: string, updates: Partial<DownloadItem>) => {
    setDownloadItems(prev => prev.map(item => 
      item.id === id ? { ...item, ...updates } : item
    ));
  }, []);

  // Add new download item
  const addDownloadItem = useCallback((track: SpotifyTrack): DownloadItem => {
    const item: DownloadItem = {
      id: track.id,
      title: track.name,
      artist: track.artists.map(a => a.name).join(', '),
      status: 'pending',
      progress: 0,
      destination: 'Cloud Storage / audio-files',
      startedAt: Date.now(),
    };
    setDownloadItems(prev => [item, ...prev]);
    return item;
  }, []);

  // Dismiss download item
  const dismissDownload = useCallback((id: string) => {
    setDownloadItems(prev => prev.filter(item => item.id !== id));
  }, []);

  // Clear completed downloads
  const clearCompletedDownloads = useCallback(() => {
    setDownloadItems(prev => prev.filter(item => item.status !== 'complete'));
  }, []);

  // Generate waveform from audio URL
  const generateWaveform = async (audioUrl: string): Promise<WaveformData | null> => {
    try {
      console.log('Generating waveform from audio URL...');
      const waveformData = await generateWaveformFromUrl(audioUrl);
      console.log('Waveform generated:', waveformData.length, 'points');
      return waveformData;
    } catch (err) {
      console.error('Waveform generation failed:', err);
      return null;
    }
  };

  const downloadSpotifyTrack = async (spotifyTrack: SpotifyTrack): Promise<DownloadResult> => {
    const trackId = spotifyTrack.id;
    
    // Add to download items
    addDownloadItem(spotifyTrack);
    
    // Simulate progress updates
    const progressInterval = setInterval(() => {
      setDownloadItems(prev => prev.map(item => {
        if (item.id === trackId && item.status === 'downloading' && item.progress < 90) {
          return { ...item, progress: Math.min(item.progress + Math.random() * 15, 90) };
        }
        return item;
      }));
    }, 500);

    setDownloadProgress(prev => ({ ...prev, [trackId]: 'downloading' }));
    updateDownloadItem(trackId, { status: 'downloading', progress: 10 });
    
    try {
      // Check if track already exists in our database
      const { data: existingTrack } = await supabase
        .from('tracks')
        .select('*')
        .eq('source_url', spotifyTrack.external_urls.spotify)
        .single();

      if (existingTrack && existingTrack.audio_file_path) {
        clearInterval(progressInterval);
        updateDownloadItem(trackId, { status: 'downloading', progress: 100, destination: `audio-files/${existingTrack.audio_file_path}` });
        
        // Track already downloaded
        const { data: urlData } = supabase.storage
          .from('audio-files')
          .getPublicUrl(existingTrack.audio_file_path);

        setDownloadProgress(prev => ({ ...prev, [trackId]: 'analyzing' }));
        updateDownloadItem(trackId, { status: 'analyzing' });
        
        // Generate waveform if not already stored
        let waveformData: WaveformData | null = existingTrack.waveform 
          ? (existingTrack.waveform as unknown as WaveformData) 
          : null;
        if (!waveformData && urlData.publicUrl) {
          waveformData = await generateWaveform(urlData.publicUrl);
          
          // Store waveform in database for future use
          if (waveformData) {
            await supabase
              .from('tracks')
              .update({ waveform: JSON.parse(JSON.stringify(waveformData)) })
              .eq('id', existingTrack.id);
          }
        }

        setDownloadProgress(prev => ({ ...prev, [trackId]: 'complete' }));
        updateDownloadItem(trackId, { status: 'complete' });
        
        return {
          success: true,
          track: {
            id: existingTrack.id,
            title: existingTrack.title,
            artist: existingTrack.artist,
            duration: existingTrack.duration || Math.floor(spotifyTrack.duration_ms / 1000),
            bpm: existingTrack.bpm || 120,
            key: existingTrack.key || 'Am',
            platform: 'spotify' as Platform,
            coverUrl: spotifyTrack.album.images[0]?.url,
            audioUrl: urlData.publicUrl,
            waveform: waveformData || undefined,
          },
          audioUrl: urlData.publicUrl,
        };
      }

      updateDownloadItem(trackId, { progress: 30 });

      // Try downloading via edge function (works for YouTube, SoundCloud, etc.)
      const { data, error } = await supabase.functions.invoke('download-audio', {
        body: {
          url: spotifyTrack.external_urls.spotify,
          title: spotifyTrack.name,
          artist: spotifyTrack.artists.map(a => a.name).join(', '),
        },
      });

      clearInterval(progressInterval);

      // Check if we got actual audio back
      let audioUrl = data?.audioUrl;
      let waveformData: WaveformData | null = null;

      // If no audio from download, use Spotify preview URL as fallback
      if (!audioUrl && spotifyTrack.preview_url) {
        console.log('Using Spotify preview URL as fallback');
        audioUrl = spotifyTrack.preview_url;
        updateDownloadItem(trackId, { 
          progress: 100, 
          destination: 'Spotify Preview (30s)'
        });
      } else if (audioUrl) {
        updateDownloadItem(trackId, { 
          progress: 100, 
          destination: data.track?.audio_file_path ? `audio-files/${data.track.audio_file_path}` : 'Cloud Storage'
        });
      }

      // Generate waveform if we have audio
      if (audioUrl) {
        setDownloadProgress(prev => ({ ...prev, [trackId]: 'analyzing' }));
        updateDownloadItem(trackId, { status: 'analyzing' });
        
        try {
          waveformData = await generateWaveform(audioUrl);
          
          // Store waveform in database if we have a track ID
          if (waveformData && data?.track?.id) {
            await supabase
              .from('tracks')
              .update({ waveform: JSON.parse(JSON.stringify(waveformData)) })
              .eq('id', data.track.id);
          }
        } catch (waveformErr) {
          console.error('Waveform generation failed:', waveformErr);
        }
      }

      setDownloadProgress(prev => ({ ...prev, [trackId]: 'complete' }));
      updateDownloadItem(trackId, { status: 'complete' });

      const track: Track = {
        id: data?.track?.id || `spotify-${trackId}`,
        title: spotifyTrack.name,
        artist: spotifyTrack.artists.map(a => a.name).join(', '),
        duration: Math.floor(spotifyTrack.duration_ms / 1000),
        bpm: data?.track?.bpm || 120,
        key: data?.track?.key || 'Am',
        platform: 'spotify' as Platform,
        coverUrl: spotifyTrack.album.images[0]?.url,
        audioUrl: audioUrl || undefined,
        waveform: waveformData || undefined,
      };

      return {
        success: !!audioUrl,
        track,
        audioUrl: audioUrl || undefined,
      };
    } catch (err) {
      clearInterval(progressInterval);
      console.error('Download error:', err);
      
      // Fallback to Spotify preview URL even on error
      let audioUrl = spotifyTrack.preview_url || undefined;
      let waveformData: WaveformData | null = null;
      
      if (audioUrl) {
        console.log('Error occurred, falling back to Spotify preview URL');
        try {
          setDownloadProgress(prev => ({ ...prev, [trackId]: 'analyzing' }));
          updateDownloadItem(trackId, { status: 'analyzing', progress: 100, destination: 'Spotify Preview (30s)' });
          waveformData = await generateWaveform(audioUrl);
        } catch (waveformErr) {
          console.error('Waveform generation failed:', waveformErr);
        }
        
        setDownloadProgress(prev => ({ ...prev, [trackId]: 'complete' }));
        updateDownloadItem(trackId, { status: 'complete' });
        
        const track: Track = {
          id: `spotify-${trackId}`,
          title: spotifyTrack.name,
          artist: spotifyTrack.artists.map(a => a.name).join(', '),
          duration: Math.floor(spotifyTrack.duration_ms / 1000),
          bpm: 120,
          key: 'Am',
          platform: 'spotify' as Platform,
          coverUrl: spotifyTrack.album.images[0]?.url,
          audioUrl,
          waveform: waveformData || undefined,
        };

        return {
          success: true,
          track,
          audioUrl,
        };
      }
      
      setDownloadProgress(prev => ({ ...prev, [trackId]: 'error' }));
      updateDownloadItem(trackId, { 
        status: 'error', 
        error: 'No audio available - track has no preview' 
      });
      
      // Create a track entry without audio
      const track: Track = {
        id: `spotify-${trackId}`,
        title: spotifyTrack.name,
        artist: spotifyTrack.artists.map(a => a.name).join(', '),
        duration: Math.floor(spotifyTrack.duration_ms / 1000),
        bpm: 120,
        key: 'Am',
        platform: 'spotify' as Platform,
        coverUrl: spotifyTrack.album.images[0]?.url,
      };

      return {
        success: false,
        track,
        error: 'No audio available for this track',
      };
    }
  };

  const downloadAndAddTrack = async (
    spotifyTrack: SpotifyTrack,
    onSuccess: (track: Track) => void,
    actionLabel: string = 'deck'
  ) => {
    setIsDownloading(true);
    
    toast({
      title: 'Downloading track...',
      description: `Adding "${spotifyTrack.name}" to ${actionLabel}`,
    });

    const result = await downloadSpotifyTrack(spotifyTrack);
    
    setIsDownloading(false);

    if (result.success && result.track) {
      toast({
        title: 'Track ready!',
        description: result.audioUrl 
          ? `"${spotifyTrack.name}" downloaded and added to ${actionLabel}`
          : `"${spotifyTrack.name}" added to ${actionLabel} (audio pending)`,
      });
      onSuccess(result.track);
    } else {
      toast({
        title: 'Download issue',
        description: result.error || 'Track added but audio may not be available',
        variant: 'destructive',
      });
      // Still add the track even if download failed
      if (result.track) {
        onSuccess(result.track);
      }
    }
  };

  return {
    isDownloading,
    downloadProgress,
    downloadItems,
    downloadSpotifyTrack,
    downloadAndAddTrack,
    dismissDownload,
    clearCompletedDownloads,
  };
}
