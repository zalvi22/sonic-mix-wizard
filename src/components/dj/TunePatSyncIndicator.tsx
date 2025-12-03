import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { CloudDownload, Check, Loader2, Music2 } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface SyncedTrack {
  id: string;
  title: string;
  artist: string;
  timestamp: number;
}

export function TunePatSyncIndicator() {
  const [recentSyncs, setRecentSyncs] = useState<SyncedTrack[]>([]);
  const [isAnimating, setIsAnimating] = useState(false);
  const [tunePatTrackCount, setTunePatTrackCount] = useState(0);
  const { toast } = useToast();

  // Fetch initial TunePat track count
  useEffect(() => {
    const fetchCount = async () => {
      const { count } = await supabase
        .from('tracks')
        .select('*', { count: 'exact', head: true })
        .eq('platform', 'tunepat');
      
      if (count !== null) {
        setTunePatTrackCount(count);
      }
    };
    fetchCount();
  }, []);

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
          const newTrack = payload.new as { id: string; title: string; artist: string };
          
          // Add to recent syncs
          setRecentSyncs(prev => [
            { ...newTrack, timestamp: Date.now() },
            ...prev.slice(0, 4) // Keep last 5
          ]);
          
          // Update count
          setTunePatTrackCount(prev => prev + 1);
          
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

  // Clean up old syncs (older than 5 minutes)
  useEffect(() => {
    const interval = setInterval(() => {
      const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
      setRecentSyncs(prev => prev.filter(s => s.timestamp > fiveMinutesAgo));
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const hasRecentSyncs = recentSyncs.length > 0;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all duration-300",
              hasRecentSyncs
                ? "border-green-500/50 bg-green-500/10 text-green-400"
                : "border-border/50 bg-muted/30 text-muted-foreground",
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
            
            {tunePatTrackCount > 0 && (
              <span className={cn(
                "text-[10px] px-1.5 py-0.5 rounded-full",
                hasRecentSyncs
                  ? "bg-green-500/20 text-green-300"
                  : "bg-muted text-muted-foreground"
              )}>
                {tunePatTrackCount}
              </span>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent 
          side="bottom" 
          className="max-w-xs bg-card border-border"
        >
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Music2 className="w-4 h-4 text-primary" />
              TunePat Sync Status
            </div>
            
            {hasRecentSyncs ? (
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Recently synced:</p>
                {recentSyncs.map(track => (
                  <div 
                    key={track.id}
                    className="text-xs flex items-center gap-2 text-green-400"
                  >
                    <Check className="w-3 h-3" />
                    <span className="truncate">{track.title}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">
                {tunePatTrackCount > 0 
                  ? `${tunePatTrackCount} tracks synced. Waiting for new downloads...`
                  : 'Run tunepat_watcher.py to sync tracks from TunePat'}
              </p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
