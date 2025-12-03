import { useEffect, useState } from 'react';
import { Terminal, FolderOpen, Monitor, Download, Check, X, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { detectPlatform, getPlatformCapabilities, tauriInvoke } from '@/lib/platform';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface AppStatus {
  sonic_pi: boolean;
  tunepat_watching: boolean;
  tunepat_path: string | null;
}

export function DesktopStatusBar() {
  const platform = detectPlatform();
  const capabilities = getPlatformCapabilities();
  const [status, setStatus] = useState<AppStatus | null>(null);
  const [ytdlpInstalled, setYtdlpInstalled] = useState<boolean | null>(null);

  // Fetch status periodically
  useEffect(() => {
    if (platform !== 'desktop') return;

    const fetchStatus = async () => {
      try {
        const appStatus = await tauriInvoke<AppStatus>('get_status');
        setStatus(appStatus);
      } catch (err) {
        console.error('Failed to get status:', err);
      }
    };

    const checkYtdlp = async () => {
      try {
        const installed = await tauriInvoke<boolean>('check_ytdlp');
        setYtdlpInstalled(installed);
      } catch {
        setYtdlpInstalled(false);
      }
    };

    fetchStatus();
    checkYtdlp();
    const interval = setInterval(fetchStatus, 5000);
    return () => clearInterval(interval);
  }, [platform]);

  if (platform !== 'desktop') {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/30 border border-border">
        <Monitor className="w-3.5 h-3.5 text-muted-foreground" />
        <span className="text-xs text-muted-foreground">Web Mode</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      {/* Desktop Badge */}
      <Badge variant="secondary" className="gap-1.5 bg-neon-cyan/10 text-neon-cyan border-neon-cyan/30">
        <Monitor className="w-3 h-3" />
        Desktop
      </Badge>

      {/* Sonic Pi Status */}
      <Tooltip>
        <TooltipTrigger>
          <div className={cn(
            'flex items-center gap-1.5 px-2 py-1 rounded-full text-xs',
            status?.sonic_pi 
              ? 'bg-neon-green/10 text-neon-green border border-neon-green/30'
              : 'bg-muted/50 text-muted-foreground border border-border'
          )}>
            <Terminal className="w-3 h-3" />
            <span>Sonic Pi</span>
            {status?.sonic_pi ? (
              <Check className="w-3 h-3" />
            ) : (
              <X className="w-3 h-3" />
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          {status?.sonic_pi 
            ? 'Sonic Pi is running - ready for live coding'
            : 'Open Sonic Pi to enable live coding'}
        </TooltipContent>
      </Tooltip>

      {/* TunePat Status */}
      <Tooltip>
        <TooltipTrigger>
          <div className={cn(
            'flex items-center gap-1.5 px-2 py-1 rounded-full text-xs',
            status?.tunepat_watching 
              ? 'bg-neon-magenta/10 text-neon-magenta border border-neon-magenta/30'
              : 'bg-muted/50 text-muted-foreground border border-border'
          )}>
            <FolderOpen className="w-3 h-3" />
            <span>TunePat</span>
            {status?.tunepat_watching ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <X className="w-3 h-3" />
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          {status?.tunepat_watching 
            ? `Watching: ${status.tunepat_path}`
            : 'TunePat folder watcher not active'}
        </TooltipContent>
      </Tooltip>

      {/* yt-dlp Status */}
      <Tooltip>
        <TooltipTrigger>
          <div className={cn(
            'flex items-center gap-1.5 px-2 py-1 rounded-full text-xs',
            ytdlpInstalled 
              ? 'bg-neon-orange/10 text-neon-orange border border-neon-orange/30'
              : 'bg-muted/50 text-muted-foreground border border-border'
          )}>
            <Download className="w-3 h-3" />
            <span>yt-dlp</span>
            {ytdlpInstalled ? (
              <Check className="w-3 h-3" />
            ) : (
              <X className="w-3 h-3" />
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          {ytdlpInstalled 
            ? 'yt-dlp installed - ready for downloads'
            : 'Install yt-dlp for local downloads: brew install yt-dlp'}
        </TooltipContent>
      </Tooltip>
    </div>
  );
}
