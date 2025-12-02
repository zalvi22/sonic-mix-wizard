import { useState } from 'react';
import { ExternalLink, Check, AlertCircle, Server } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Platform } from '@/types/dj';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { LocalDownloaderSettings } from './LocalDownloaderSettings';

interface PlatformStatus {
  platform: Platform;
  connected: boolean;
  label: string;
  description: string;
  color: string;
}

const PLATFORMS: PlatformStatus[] = [
  {
    platform: 'spotify',
    connected: false,
    label: 'Spotify',
    description: 'Search & download tracks via local server',
    color: 'from-green-500 to-green-700',
  },
  {
    platform: 'soundcloud',
    connected: false,
    label: 'SoundCloud',
    description: 'Download tracks from SoundCloud URLs',
    color: 'from-orange-500 to-orange-700',
  },
  {
    platform: 'youtube',
    connected: false,
    label: 'YouTube Music',
    description: 'Download audio from YouTube videos',
    color: 'from-red-500 to-red-700',
  },
  {
    platform: 'local',
    connected: true,
    label: 'Local Files',
    description: 'Upload and use audio files from your computer',
    color: 'from-cyan-500 to-cyan-700',
  },
];

export const PlatformConnector = () => {
  const [platforms, setPlatforms] = useState(PLATFORMS);

  const toggleConnection = (platform: Platform) => {
    setPlatforms(prev => 
      prev.map(p => 
        p.platform === platform ? { ...p, connected: !p.connected } : p
      )
    );
  };

  return (
    <div className="flex items-center gap-2">
      <LocalDownloaderSettings />
      
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline" className="gap-2">
            <ExternalLink className="w-4 h-4" />
            Platforms
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md bg-card border-border">
          <DialogHeader>
            <DialogTitle className="font-display neon-text-cyan">Connect Music Platforms</DialogTitle>
            <DialogDescription>
              Enable platforms to search and download music (requires local server)
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-3 mt-4">
            {platforms.map((p) => (
              <div
                key={p.platform}
                className={cn(
                  "flex items-center justify-between p-4 rounded-lg border transition-colors",
                  p.connected ? "border-primary/50 bg-primary/5" : "border-border bg-muted/30"
                )}
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-10 h-10 rounded-lg bg-gradient-to-br flex items-center justify-center",
                    p.color
                  )}>
                    <span className="text-white font-bold text-sm">
                      {p.label[0]}
                    </span>
                  </div>
                  <div>
                    <div className="font-medium text-sm">{p.label}</div>
                    <div className="text-xs text-muted-foreground">{p.description}</div>
                  </div>
                </div>
                <Button
                  variant={p.connected ? "default" : "outline"}
                  size="sm"
                  onClick={() => toggleConnection(p.platform)}
                  className={cn(
                    "min-w-[100px]",
                    p.connected && "bg-primary text-primary-foreground"
                  )}
                >
                  {p.connected ? (
                    <>
                      <Check className="w-4 h-4 mr-1" />
                      Enabled
                    </>
                  ) : (
                    'Enable'
                  )}
                </Button>
              </div>
            ))}
          </div>

          <div className="mt-4 p-3 rounded-lg bg-muted/50 border border-border">
            <div className="flex items-start gap-2 text-xs text-muted-foreground">
              <Server className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <p>
                To download from streaming platforms, connect to the local Python server. 
                Music is downloaded in lossless WAV format and uploaded to your library.
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
