import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { CloudDownload, Check, Loader2, Music2, ExternalLink, FolderOpen, RefreshCw } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

interface SyncedTrack {
  id: string;
  title: string;
  artist: string;
  timestamp: number;
}

interface TunePatTrack {
  id: string;
  title: string;
  artist: string;
  created_at: string;
}

export function TunePatSyncIndicator() {
  const [recentSyncs, setRecentSyncs] = useState<SyncedTrack[]>([]);
  const [isAnimating, setIsAnimating] = useState(false);
  const [tunePatTracks, setTunePatTracks] = useState<TunePatTrack[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();

  // Fetch TunePat tracks
  const fetchTunePatTracks = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('tracks')
      .select('id, title, artist, created_at')
      .eq('platform', 'tunepat')
      .order('created_at', { ascending: false })
      .limit(20);
    
    if (data) {
      setTunePatTracks(data);
    }
    setIsLoading(false);
  };

  // Fetch on open
  useEffect(() => {
    if (isOpen) {
      fetchTunePatTracks();
    }
  }, [isOpen]);

  // Listen for new TunePat tracks in real-time
  useEffect(() => {
    const channel = supabase
      .channel('tunepat-sync')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'tracks',
          filter: 'platform=eq.tunepat'
        },
        (payload) => {
          const newTrack = payload.new as { id: string; title: string; artist: string; created_at: string };
          
          // Add to recent syncs
          setRecentSyncs(prev => [
            { ...newTrack, timestamp: Date.now() },
            ...prev.slice(0, 4)
          ]);
          
          // Update tracks list
          setTunePatTracks(prev => [newTrack, ...prev.slice(0, 19)]);
          
          // Trigger animation
          setIsAnimating(true);
          setTimeout(() => setIsAnimating(false), 2000);
          
          // Show toast
          toast({
            title: '🎵 TunePat Sync',
            description: `"${newTrack.title}" by ${newTrack.artist} added to library`,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [toast]);

  // Clean up old syncs
  useEffect(() => {
    const interval = setInterval(() => {
      const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
      setRecentSyncs(prev => prev.filter(s => s.timestamp > fiveMinutesAgo));
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const hasRecentSyncs = recentSyncs.length > 0;
  const trackCount = tunePatTracks.length;

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <button
          className={cn(
            "flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all duration-300 cursor-pointer",
            "hover:bg-muted/50 active:scale-95",
            hasRecentSyncs
              ? "border-green-500/50 bg-green-500/10 text-green-400"
              : "border-border/50 bg-muted/30 text-muted-foreground hover:border-primary/50",
            isAnimating && "animate-pulse border-green-400 shadow-[0_0_15px_rgba(74,222,128,0.3)]"
          )}
        >
          {isAnimating ? (
            <Loader2 className="w-4 h-4 animate-spin text-green-400" />
          ) : hasRecentSyncs ? (
            <Check className="w-4 h-4 text-green-400" />
          ) : (
            <CloudDownload className="w-4 h-4" />
          )}
          
          <span className="text-xs font-medium">TunePat</span>
          
          {trackCount > 0 && (
            <span className={cn(
              "text-[10px] px-1.5 py-0.5 rounded-full",
              hasRecentSyncs
                ? "bg-green-500/20 text-green-300"
                : "bg-muted text-muted-foreground"
            )}>
              {trackCount}
            </span>
          )}
        </button>
      </PopoverTrigger>
      
      <PopoverContent 
        side="bottom" 
        align="end"
        className="w-80 bg-card border-border p-0"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b border-border">
          <div className="flex items-center gap-2">
            <Music2 className="w-4 h-4 text-primary" />
            <span className="font-medium text-sm">TunePat Sync</span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={fetchTunePatTracks}
            disabled={isLoading}
          >
            <RefreshCw className={cn("w-3.5 h-3.5", isLoading && "animate-spin")} />
          </Button>
        </div>
        
        {/* Content */}
        <div className="p-3 space-y-3">
          {/* Status */}
          <div className={cn(
            "flex items-center gap-2 p-2 rounded-md text-xs",
            hasRecentSyncs 
              ? "bg-green-500/10 text-green-400 border border-green-500/30"
              : "bg-muted/50 text-muted-foreground"
          )}>
            {hasRecentSyncs ? (
              <>
                <Check className="w-4 h-4" />
                <span>Syncing active - {recentSyncs.length} recent</span>
              </>
            ) : (
              <>
                <CloudDownload className="w-4 h-4" />
                <span>Waiting for TunePat downloads...</span>
              </>
            )}
          </div>
          
          {/* Recently synced */}
          {hasRecentSyncs && (
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground font-medium">Just synced:</p>
              {recentSyncs.map(track => (
                <div 
                  key={track.id}
                  className="text-xs flex items-center gap-2 text-green-400 p-1 bg-green-500/5 rounded"
                >
                  <Check className="w-3 h-3 flex-shrink-0" />
                  <span className="truncate">{track.artist} - {track.title}</span>
                </div>
              ))}
            </div>
          )}
          
          {/* Synced tracks list */}
          {trackCount > 0 && (
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground font-medium">
                Library ({trackCount} tracks)
              </p>
              <ScrollArea className="h-32">
                <div className="space-y-1 pr-2">
                  {tunePatTracks.map(track => (
                    <div 
                      key={track.id}
                      className="text-xs p-1.5 hover:bg-muted/50 rounded flex items-center gap-2"
                    >
                      <FolderOpen className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                      <div className="truncate">
                        <span className="text-foreground">{track.title}</span>
                        <span className="text-muted-foreground"> • {track.artist}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}
          
          {/* Setup instructions */}
          {trackCount === 0 && !hasRecentSyncs && (
            <div className="space-y-2 text-xs text-muted-foreground">
              <p className="font-medium text-foreground">Setup Instructions:</p>
              <ol className="space-y-1.5 list-decimal list-inside">
                <li>Download the local_downloader folder</li>
                <li>Double-click <code className="bg-muted px-1 rounded">TunePat_Setup.command</code></li>
                <li>Enter your service key when prompted</li>
                <li>Download songs in TunePat</li>
              </ol>
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="p-2 border-t border-border bg-muted/30">
          <a 
            href="https://github.com" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <ExternalLink className="w-3 h-3" />
            View setup guide
          </a>
        </div>
      </PopoverContent>
    </Popover>
  );
}
