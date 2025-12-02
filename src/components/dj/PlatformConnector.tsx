import { useState } from 'react';
import { ExternalLink, Check, Server, Music } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Platform } from '@/types/dj';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { LocalDownloaderSettings } from './LocalDownloaderSettings';
import { useSpotify } from '@/hooks/useSpotify';
import { SpotifyBrowser } from './SpotifyBrowser';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';

interface PlatformStatus {
  platform: Platform;
  connected: boolean;
  label: string;
  description: string;
  color: string;
}

export const PlatformConnector = () => {
  const { isConnected: spotifyConnected, connect: connectSpotify, user: spotifyUser } = useSpotify();
  const [soundcloudConnected, setSoundcloudConnected] = useState(false);
  const [youtubeConnected, setYoutubeConnected] = useState(false);
  const [spotifyBrowserOpen, setSpotifyBrowserOpen] = useState(false);

  const platforms: PlatformStatus[] = [
    {
      platform: 'spotify',
      connected: spotifyConnected,
      label: 'Spotify',
      description: spotifyConnected ? `Connected as ${spotifyUser?.display_name}` : 'Search & browse your Spotify library',
      color: 'from-green-500 to-green-700',
    },
    {
      platform: 'soundcloud',
      connected: soundcloudConnected,
      label: 'SoundCloud',
      description: 'Download tracks from SoundCloud URLs',
      color: 'from-orange-500 to-orange-700',
    },
    {
      platform: 'youtube',
      connected: youtubeConnected,
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

  const handlePlatformClick = (platform: Platform) => {
    switch (platform) {
      case 'spotify':
        if (!spotifyConnected) {
          connectSpotify();
        } else {
          setSpotifyBrowserOpen(true);
        }
        break;
      case 'soundcloud':
        setSoundcloudConnected(!soundcloudConnected);
        break;
      case 'youtube':
        setYoutubeConnected(!youtubeConnected);
        break;
    }
  };

  return (
    <div className="flex items-center gap-2">
      <LocalDownloaderSettings />
      
      {/* Quick Spotify access button when connected */}
      {spotifyConnected && (
        <Sheet open={spotifyBrowserOpen} onOpenChange={setSpotifyBrowserOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2 border-green-500/50 hover:bg-green-500/10">
              <div className="w-4 h-4 rounded-full bg-[#1DB954] flex items-center justify-center">
                <Music className="w-2.5 h-2.5 text-black" />
              </div>
              Spotify
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[500px] sm:w-[600px] p-0">
            <SheetHeader className="sr-only">
              <SheetTitle>Spotify Browser</SheetTitle>
            </SheetHeader>
            <SpotifyBrowser />
          </SheetContent>
        </Sheet>
      )}
      
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
              Connect to streaming platforms to browse and import tracks
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
                  onClick={() => handlePlatformClick(p.platform)}
                  disabled={p.platform === 'local'}
                  className={cn(
                    "min-w-[100px]",
                    p.connected && "bg-primary text-primary-foreground"
                  )}
                >
                  {p.connected ? (
                    <>
                      <Check className="w-4 h-4 mr-1" />
                      {p.platform === 'spotify' ? 'Browse' : 'Enabled'}
                    </>
                  ) : (
                    'Connect'
                  )}
                </Button>
              </div>
            ))}
          </div>

          <div className="mt-4 p-3 rounded-lg bg-muted/50 border border-border">
            <div className="flex items-start gap-2 text-xs text-muted-foreground">
              <Server className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <p>
                Spotify requires OAuth login. SoundCloud and YouTube require the local Python server
                for downloading (music is converted to lossless WAV format).
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
