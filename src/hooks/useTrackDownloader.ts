import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Track, Platform } from '@/types/dj';

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
  const [downloadProgress, setDownloadProgress] = useState<Record<string, 'pending' | 'downloading' | 'complete' | 'error'>>({});
  const { toast } = useToast();

  const downloadSpotifyTrack = async (spotifyTrack: SpotifyTrack): Promise<DownloadResult> => {
    const trackId = spotifyTrack.id;
    setDownloadProgress(prev => ({ ...prev, [trackId]: 'downloading' }));
    
    try {
      // Check if track already exists in our database
      const { data: existingTrack } = await supabase
        .from('tracks')
        .select('*')
        .eq('source_url', spotifyTrack.external_urls.spotify)
        .single();

      if (existingTrack && existingTrack.audio_file_path) {
        // Track already downloaded
        const { data: urlData } = supabase.storage
          .from('audio-files')
          .getPublicUrl(existingTrack.audio_file_path);

        setDownloadProgress(prev => ({ ...prev, [trackId]: 'complete' }));
        
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
          },
          audioUrl: urlData.publicUrl,
        };
      }

      // Download via edge function
      const { data, error } = await supabase.functions.invoke('download-audio', {
        body: {
          url: spotifyTrack.external_urls.spotify,
          title: spotifyTrack.name,
          artist: spotifyTrack.artists.map(a => a.name).join(', '),
        },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      setDownloadProgress(prev => ({ ...prev, [trackId]: 'complete' }));

      const track: Track = {
        id: data.track?.id || `spotify-${trackId}`,
        title: spotifyTrack.name,
        artist: spotifyTrack.artists.map(a => a.name).join(', '),
        duration: Math.floor(spotifyTrack.duration_ms / 1000),
        bpm: data.track?.bpm || 120,
        key: data.track?.key || 'Am',
        platform: 'spotify' as Platform,
        coverUrl: spotifyTrack.album.images[0]?.url,
      };

      return {
        success: true,
        track,
        audioUrl: data.audioUrl,
      };
    } catch (err) {
      console.error('Download error:', err);
      setDownloadProgress(prev => ({ ...prev, [trackId]: 'error' }));
      
      // Even if download fails, create a track entry for reference
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
        error: err instanceof Error ? err.message : 'Download failed',
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
    downloadSpotifyTrack,
    downloadAndAddTrack,
  };
}
