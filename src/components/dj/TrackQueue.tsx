import { Track } from '@/types/dj';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Play, Trash2, GripVertical, ListMusic } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TrackQueueProps {
  queue: Track[];
  onLoadToDeck: (track: Track, deck: 'A' | 'B') => void;
  onRemoveFromQueue: (trackId: string) => void;
  onClearQueue: () => void;
}

export function TrackQueue({ queue, onLoadToDeck, onRemoveFromQueue, onClearQueue }: TrackQueueProps) {
  if (queue.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-2 p-4">
        <ListMusic className="w-8 h-8 opacity-50" />
        <p className="text-sm text-center">Queue is empty</p>
        <p className="text-xs text-center opacity-70">Add tracks from Spotify to queue them up</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-3 border-b border-border">
        <span className="text-sm font-medium text-foreground">
          {queue.length} track{queue.length !== 1 ? 's' : ''} queued
        </span>
        <Button 
          variant="ghost" 
          size="sm" 
          className="text-xs text-muted-foreground hover:text-destructive"
          onClick={onClearQueue}
        >
          Clear All
        </Button>
      </div>
      
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {queue.map((track, index) => (
            <div 
              key={`${track.id}-${index}`}
              className="flex items-center gap-2 p-2 rounded-lg bg-accent/30 hover:bg-accent/50 transition-colors group"
            >
              <div className="flex items-center justify-center w-6 h-6 text-xs text-muted-foreground font-mono">
                {index + 1}
              </div>
              
              {track.coverUrl && (
                <img 
                  src={track.coverUrl} 
                  alt={track.title}
                  className="w-10 h-10 rounded object-cover flex-shrink-0"
                />
              )}
              
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground line-clamp-1" title={track.title}>
                  {track.title}
                </p>
                <p className="text-xs text-muted-foreground line-clamp-1">
                  {track.artist}
                </p>
              </div>
              
              <div className="flex items-center gap-1 flex-shrink-0">
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 px-2 text-xs hover:bg-primary/20 hover:text-primary"
                  onClick={() => onLoadToDeck(track, 'A')}
                  title="Load to Deck A"
                >
                  A
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 px-2 text-xs hover:bg-secondary/20 hover:text-secondary"
                  onClick={() => onLoadToDeck(track, 'B')}
                  title="Load to Deck B"
                >
                  B
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 text-muted-foreground hover:text-destructive"
                  onClick={() => onRemoveFromQueue(track.id)}
                  title="Remove from queue"
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
