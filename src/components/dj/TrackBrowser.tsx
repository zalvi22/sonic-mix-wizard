import { useState, useEffect } from 'react';
import { Search, Music, Disc, FolderOpen, Plus, Scissors, Loader2, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Platform, Track } from '@/types/dj';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { TrackImporter, StemAnalyzer } from './TrackImporter';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface TrackBrowserProps {
  onLoadToDeck: (track: Track, deck: 'A' | 'B') => void;
  onAddToMashup: (track: Track) => void;
}

// Demo tracks for when database is empty
const DEMO_TRACKS: Track[] = [
  { id: 'demo-1', title: 'Midnight Drive', artist: 'Synthwave Dreams', duration: 245, bpm: 118, key: 'Am', platform: 'local' },
  { id: 'demo-2', title: 'Neon Lights', artist: 'Future Bass', duration: 198, bpm: 128, key: 'Cm', platform: 'local' },
  { id: 'demo-3', title: 'Digital Love', artist: 'Daft Punk', duration: 301, bpm: 120, key: 'Fm', platform: 'local' },
];

const PLATFORMS: { id: Platform | 'all'; label: string; icon: typeof Music }[] = [
  { id: 'all', label: 'All', icon: Music },
  { id: 'spotify', label: 'Spotify', icon: Disc },
  { id: 'soundcloud', label: 'SoundCloud', icon: Disc },
  { id: 'youtube', label: 'YouTube', icon: Disc },
  { id: 'local', label: 'Local', icon: FolderOpen },
];

interface DBTrack {
  id: string;
  title: string;
  artist: string;
  duration: number | null;
  bpm: number | null;
  key: string | null;
  platform: string;
  audio_file_path: string | null;
  analysis_status: string | null;
  stems: any;
  waveform: any;
}

export const TrackBrowser = ({ onLoadToDeck, onAddToMashup }: TrackBrowserProps) => {
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState<Platform | 'all'>('all');
  const [tracks, setTracks] = useState<Track[]>(DEMO_TRACKS);
  const [dbTracks, setDbTracks] = useState<DBTrack[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchTracks = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('tracks')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data && data.length > 0) {
        setDbTracks(data);
        const convertedTracks: Track[] = data.map((t: DBTrack) => ({
          id: t.id,
          title: t.title,
          artist: t.artist,
          duration: t.duration || 0,
          bpm: t.bpm || 120,
          key: t.key || 'Am',
          platform: t.platform as Platform,
          waveform: t.waveform || undefined, // Pass waveform data
        }));
        setTracks([...convertedTracks, ...DEMO_TRACKS]);
      }
    } catch (error) {
      console.error('Error fetching tracks:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTracks();
  }, []);

  const handleTrackImported = (track: any) => {
    // Add to dbTracks and tracks list
    const newTrack: Track = {
      id: track.id,
      title: track.title,
      artist: track.artist,
      duration: track.duration || 0,
      bpm: track.bpm || 120,
      key: track.key || 'Am',
      platform: track.platform as Platform,
      waveform: track.waveform || undefined,
    };
    
    setDbTracks(prev => [track, ...prev]);
    setTracks(prev => [newTrack, ...prev.filter(t => !t.id.startsWith('demo-'))]);
  };

  const handleStemComplete = (trackId: string, stems: any) => {
    setDbTracks(prev => 
      prev.map(t => t.id === trackId ? { ...t, stems, analysis_status: 'complete' } : t)
    );
    toast({
      title: "Stems ready!",
      description: "You can now use individual stems in your mashup",
    });
  };

  const getAudioUrl = (track: DBTrack): string | null => {
    if (!track.audio_file_path) return null;
    const { data } = supabase.storage.from('audio-files').getPublicUrl(track.audio_file_path);
    return data.publicUrl;
  };

  const filteredTracks = tracks.filter(track => {
    const matchesSearch = track.title.toLowerCase().includes(search.toLowerCase()) ||
      track.artist.toLowerCase().includes(search.toLowerCase());
    const matchesPlatform = selectedPlatform === 'all' || track.platform === selectedPlatform;
    return matchesSearch && matchesPlatform;
  });

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getDbTrack = (trackId: string): DBTrack | undefined => {
    return dbTracks.find(t => t.id === trackId);
  };

  return (
    <div className="deck-panel rounded-xl p-4 h-full flex flex-col">
      {/* Header */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-display text-lg font-bold neon-text-cyan">LIBRARY</h3>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={fetchTracks}
              disabled={isLoading}
              title="Refresh"
            >
              <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} />
            </Button>
            <TrackImporter onTrackImported={handleTrackImported} />
          </div>
        </div>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search tracks..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-muted border-border"
          />
        </div>
      </div>

      {/* Platform Filters */}
      <div className="flex gap-1 mb-4 overflow-x-auto pb-2">
        {PLATFORMS.map(({ id, label }) => (
          <Button
            key={id}
            variant="ghost"
            size="sm"
            className={cn(
              "text-xs whitespace-nowrap",
              selectedPlatform === id && "bg-primary/20 text-primary"
            )}
            onClick={() => setSelectedPlatform(id)}
          >
            {label}
          </Button>
        ))}
      </div>

      {/* Track List */}
      <ScrollArea className="flex-1">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-2">
            {filteredTracks.map((track) => {
              const dbTrack = getDbTrack(track.id);
              const audioUrl = dbTrack ? getAudioUrl(dbTrack) : null;
              const hasStems = dbTrack?.stems && Object.keys(dbTrack.stems).length > 0;
              const isAnalyzing = dbTrack?.analysis_status === 'processing';

              return (
                <div
                  key={track.id}
                  className={cn(
                    "p-3 rounded-lg border border-border bg-card/50",
                    "hover:border-primary/50 transition-colors cursor-pointer group",
                    track.id.startsWith('demo-') && "opacity-60"
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate flex items-center gap-2">
                        {track.title}
                        {hasStems && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-neon-green/20 text-neon-green">
                            STEMS
                          </span>
                        )}
                        {isAnalyzing && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-neon-yellow/20 text-neon-yellow flex items-center gap-1">
                            <Loader2 className="w-2 h-2 animate-spin" />
                            ANALYZING
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">{track.artist}</div>
                      <div className="flex items-center gap-3 mt-1">
                        <span className={cn(
                          "platform-badge text-[10px] py-0.5",
                          `platform-badge-${track.platform}`
                        )}>
                          {track.platform}
                        </span>
                        <span className="text-[10px] text-muted-foreground">{track.bpm} BPM</span>
                        <span className="text-[10px] text-muted-foreground">{track.key}</span>
                        <span className="text-[10px] text-muted-foreground">{formatDuration(track.duration)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {/* Stem analysis button for uploaded tracks */}
                      {audioUrl && !hasStems && !isAnalyzing && (
                        <StemAnalyzer
                          trackId={track.id}
                          audioUrl={audioUrl}
                          onComplete={(stems) => handleStemComplete(track.id, stems)}
                        />
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-neon-cyan hover:text-neon-cyan hover:bg-neon-cyan/20"
                        onClick={(e) => { e.stopPropagation(); onLoadToDeck(track, 'A'); }}
                        title="Load to Deck A"
                      >
                        A
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-neon-magenta hover:text-neon-magenta hover:bg-neon-magenta/20"
                        onClick={(e) => { e.stopPropagation(); onLoadToDeck(track, 'B'); }}
                        title="Load to Deck B"
                      >
                        B
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-neon-purple hover:text-neon-purple hover:bg-neon-purple/20"
                        onClick={(e) => { e.stopPropagation(); onAddToMashup(track); }}
                        title="Add to Mashup"
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}

            {filteredTracks.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Music className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No tracks found</p>
                <p className="text-xs mt-1">Import some tracks to get started</p>
              </div>
            )}
          </div>
        )}
      </ScrollArea>
    </div>
  );
};
