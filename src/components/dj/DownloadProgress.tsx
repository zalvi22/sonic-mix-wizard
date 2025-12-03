import { X, Download, CheckCircle, AlertCircle, Loader2, Music, Waves } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';

export interface DownloadItem {
  id: string;
  title: string;
  artist: string;
  status: 'pending' | 'downloading' | 'analyzing' | 'complete' | 'error';
  progress: number;
  destination: string;
  startedAt: number;
  error?: string;
}

interface DownloadProgressProps {
  downloads: DownloadItem[];
  onDismiss: (id: string) => void;
  onClearCompleted: () => void;
  className?: string;
}

export function DownloadProgress({ 
  downloads, 
  onDismiss, 
  onClearCompleted,
  className 
}: DownloadProgressProps) {
  if (downloads.length === 0) return null;

  const activeDownloads = downloads.filter(d => d.status === 'downloading' || d.status === 'analyzing');
  const completedDownloads = downloads.filter(d => d.status === 'complete');
  const errorDownloads = downloads.filter(d => d.status === 'error');

  const getStatusIcon = (status: DownloadItem['status']) => {
    switch (status) {
      case 'pending':
        return <Download className="w-4 h-4 text-muted-foreground" />;
      case 'downloading':
        return <Loader2 className="w-4 h-4 text-cyan-500 animate-spin" />;
      case 'analyzing':
        return <Waves className="w-4 h-4 text-purple-500 animate-pulse" />;
      case 'complete':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-destructive" />;
    }
  };

  const getStatusText = (item: DownloadItem) => {
    switch (item.status) {
      case 'pending':
        return 'Waiting...';
      case 'downloading':
        return `Downloading... ${item.progress}%`;
      case 'analyzing':
        return 'Analyzing waveform...';
      case 'complete':
        return 'Complete';
      case 'error':
        return item.error || 'Failed';
    }
  };

  const getElapsedTime = (startedAt: number) => {
    const elapsed = Math.floor((Date.now() - startedAt) / 1000);
    if (elapsed < 60) return `${elapsed}s`;
    const mins = Math.floor(elapsed / 60);
    const secs = elapsed % 60;
    return `${mins}m ${secs}s`;
  };

  return (
    <div className={cn(
      "fixed bottom-4 right-4 w-80 bg-card border border-border rounded-lg shadow-2xl overflow-hidden z-50",
      className
    )}>
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-border bg-muted/50">
        <div className="flex items-center gap-2">
          <Download className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium">Downloads</span>
          {activeDownloads.length > 0 && (
            <span className="text-xs bg-primary/20 text-primary px-1.5 py-0.5 rounded">
              {activeDownloads.length} active
            </span>
          )}
        </div>
        {completedDownloads.length > 0 && (
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-xs h-6 px-2"
            onClick={onClearCompleted}
          >
            Clear done
          </Button>
        )}
      </div>

      {/* Download List */}
      <ScrollArea className="max-h-64">
        <div className="p-2 space-y-2">
          {downloads.map((item) => (
            <div 
              key={item.id}
              className={cn(
                "p-2 rounded-md border transition-colors",
                item.status === 'error' && "border-destructive/50 bg-destructive/10",
                item.status === 'complete' && "border-green-500/30 bg-green-500/5",
                (item.status === 'downloading' || item.status === 'analyzing') && "border-primary/30 bg-primary/5",
                item.status === 'pending' && "border-border bg-muted/30"
              )}
            >
              <div className="flex items-start gap-2">
                <div className="mt-0.5">{getStatusIcon(item.status)}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium truncate">{item.title}</p>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5 -mr-1"
                      onClick={() => onDismiss(item.id)}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{item.artist}</p>
                  
                  {/* Progress bar for downloading */}
                  {item.status === 'downloading' && (
                    <Progress value={item.progress} className="h-1 mt-2" />
                  )}
                  
                  {/* Analyzing animation */}
                  {item.status === 'analyzing' && (
                    <div className="h-1 mt-2 bg-muted rounded overflow-hidden">
                      <div className="h-full w-1/3 bg-purple-500 animate-pulse rounded" 
                           style={{ animation: 'pulse 1s ease-in-out infinite, slideRight 1.5s ease-in-out infinite' }} />
                    </div>
                  )}
                  
                  {/* Status and destination */}
                  <div className="flex items-center justify-between mt-1.5 text-[10px] text-muted-foreground">
                    <span>{getStatusText(item)}</span>
                    <span>{getElapsedTime(item.startedAt)}</span>
                  </div>
                  
                  {/* Destination */}
                  {item.destination && (
                    <div className="flex items-center gap-1 mt-1 text-[10px] text-muted-foreground/70">
                      <Music className="w-3 h-3" />
                      <span className="truncate">{item.destination}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* Summary footer */}
      {(completedDownloads.length > 0 || errorDownloads.length > 0) && (
        <div className="px-3 py-2 border-t border-border bg-muted/30 text-[10px] text-muted-foreground flex gap-3">
          {completedDownloads.length > 0 && (
            <span className="text-green-500">{completedDownloads.length} completed</span>
          )}
          {errorDownloads.length > 0 && (
            <span className="text-destructive">{errorDownloads.length} failed</span>
          )}
        </div>
      )}
    </div>
  );
}
