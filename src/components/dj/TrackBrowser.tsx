import { useState } from 'react';
import { Search, Music, Disc, FolderOpen, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Platform, Track } from '@/types/dj';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

interface TrackBrowserProps {
  onLoadToDeck: (track: Track, deck: 'A' | 'B') => void;
  onAddToMashup: (track: Track) => void;
}

const MOCK_TRACKS: Track[] = [
  { id: '1', title: 'Midnight Drive', artist: 'Synthwave Dreams', duration: 245, bpm: 118, key: 'Am', platform: 'spotify' },
  { id: '2', title: 'Neon Lights', artist: 'Future Bass', duration: 198, bpm: 128, key: 'Cm', platform: 'soundcloud' },
  { id: '3', title: 'Digital Love', artist: 'Daft Punk', duration: 301, bpm: 120, key: 'Fm', platform: 'youtube' },
  { id: '4', title: 'Blinding Lights', artist: 'The Weeknd', duration: 203, bpm: 171, key: 'Cm', platform: 'spotify' },
  { id: '5', title: 'Strobe', artist: 'deadmau5', duration: 637, bpm: 128, key: 'Am', platform: 'local' },
  { id: '6', title: 'Levels', artist: 'Avicii', duration: 213, bpm: 126, key: 'Fm', platform: 'spotify' },
  { id: '7', title: 'One More Time', artist: 'Daft Punk', duration: 320, bpm: 122, key: 'Gm', platform: 'youtube' },
  { id: '8', title: 'Titanium', artist: 'David Guetta ft. Sia', duration: 245, bpm: 126, key: 'Ebm', platform: 'soundcloud' },
];

const PLATFORMS: { id: Platform | 'all'; label: string; icon: typeof Music }[] = [
  { id: 'all', label: 'All', icon: Music },
  { id: 'spotify', label: 'Spotify', icon: Disc },
  { id: 'soundcloud', label: 'SoundCloud', icon: Disc },
  { id: 'youtube', label: 'YouTube', icon: Disc },
  { id: 'local', label: 'Local', icon: FolderOpen },
];

export const TrackBrowser = ({ onLoadToDeck, onAddToMashup }: TrackBrowserProps) => {
  const [search, setSearch] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState<Platform | 'all'>('all');

  const filteredTracks = MOCK_TRACKS.filter(track => {
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

  return (
    <div className="deck-panel rounded-xl p-4 h-full flex flex-col">
      {/* Header */}
      <div className="mb-4">
        <h3 className="font-display text-lg font-bold neon-text-cyan mb-3">LIBRARY</h3>
        
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
        <div className="space-y-2">
          {filteredTracks.map((track) => (
            <div
              key={track.id}
              className={cn(
                "p-3 rounded-lg border border-border bg-card/50",
                "hover:border-primary/50 transition-colors cursor-pointer group"
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate">{track.title}</div>
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
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};
