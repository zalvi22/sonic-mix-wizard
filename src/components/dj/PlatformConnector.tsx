import { useState } from 'react';
import { ExternalLink, Check, Server, Music, Cloud, HardDrive, LogIn, Copy, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Platform, Track } from '@/types/dj';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LocalDownloaderSettings } from './LocalDownloaderSettings';
import { useSpotify } from '@/hooks/useSpotify';
import { SpotifyBrowser } from './SpotifyBrowser';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface PlatformConnectorProps {
  onTrackSelect?: (track: Track) => void;
  onAddToMashup?: (track: Track) => void;
}

interface PlatformStatus {
  platform: Platform;
  connected: boolean;
  label: string;
  description: string;
  color: string;
  icon: string;
}

export const PlatformConnector = ({ onTrackSelect, onAddToMashup }: PlatformConnectorProps) => {
  const { isConnected: spotifyConnected, connect: connectSpotify, user: spotifyUser, isLoading: spotifyLoading } = useSpotify();
  const [soundcloudConnected, setSoundcloudConnected] = useState(false);
  const [youtubeConnected, setYoutubeConnected] = useState(false);
  const [spotifyBrowserOpen, setSpotifyBrowserOpen] = useState(false);
  const [downloadMode, setDownloadMode] = useState<'cloud' | 'local'>('cloud');
  const { toast } = useToast();

  const redirectUri = `${window.location.origin}/`;

  const copyRedirectUri = () => {
    navigator.clipboard.writeText(redirectUri);
    toast({
      title: 'Copied!',
      description: 'Redirect URI copied to clipboard. Add this to your Spotify app settings.',
    });
  };

  const platforms: PlatformStatus[] = [
    {
      platform: 'spotify',
      connected: spotifyConnected,
      label: 'Spotify',
      description: spotifyConnected ? `Connected as ${spotifyUser?.display_name}` : 'Search & browse your Spotify library',
      color: 'bg-[#1DB954]',
      icon: '🎵',
    },
    {
      platform: 'soundcloud',
      connected: soundcloudConnected,
      label: 'SoundCloud',
      description: 'Browse and import SoundCloud tracks',
      color: 'bg-[#FF5500]',
      icon: '☁️',
    },
    {
      platform: 'youtube',
      connected: youtubeConnected,
      label: 'YouTube Music',
      description: 'Search and import from YouTube',
      color: 'bg-[#FF0000]',
      icon: '▶️',
    },
    {
      platform: 'local',
      connected: true,
      label: 'Local Files',
      description: 'Upload audio files from your computer',
      color: 'bg-cyan-500',
      icon: '💾',
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
      {/* Spotify Quick Connect/Access */}
      {spotifyConnected ? (
        <Sheet open={spotifyBrowserOpen} onOpenChange={setSpotifyBrowserOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2 border-[#1DB954]/50 hover:bg-[#1DB954]/10 hover:border-[#1DB954]">
              <div className="w-4 h-4 rounded-full bg-[#1DB954] flex items-center justify-center">
                <Music className="w-2.5 h-2.5 text-black" />
              </div>
              <span className="hidden sm:inline">Spotify</span>
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-[#1DB954]/20 text-[#1DB954]">
                Connected
              </Badge>
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[95vw] max-w-[480px] sm:max-w-[550px] p-0 flex flex-col">
            <SheetHeader className="sr-only">
              <SheetTitle>Spotify Browser</SheetTitle>
            </SheetHeader>
            <div className="flex-1 min-h-0 overflow-hidden">
              <SpotifyBrowser 
                onTrackSelect={onTrackSelect}
                onAddToMashup={onAddToMashup}
              />
            </div>
          </SheetContent>
        </Sheet>
      ) : (
        <div className="flex items-center gap-1">
          <Button 
            variant="outline" 
            size="sm" 
            className="gap-2 border-[#1DB954]/30 hover:bg-[#1DB954]/10 hover:border-[#1DB954]"
            onClick={connectSpotify}
            disabled={spotifyLoading}
          >
            <div className="w-4 h-4 rounded-full bg-[#1DB954] flex items-center justify-center">
              <Music className="w-2.5 h-2.5 text-black" />
            </div>
            <span className="hidden sm:inline">Connect Spotify</span>
            <LogIn className="w-3 h-3 sm:hidden" />
          </Button>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Info className="w-4 h-4 text-muted-foreground" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80" align="start">
              <div className="space-y-2">
                <p className="text-sm font-medium">Spotify Setup Required</p>
                <p className="text-xs text-muted-foreground">
                  Add this redirect URI to your Spotify Developer Dashboard:
                </p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-xs bg-muted p-2 rounded break-all">
                    {redirectUri}
                  </code>
                  <Button size="icon" variant="outline" className="h-8 w-8 shrink-0" onClick={copyRedirectUri}>
                    <Copy className="w-3 h-3" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Go to <a href="https://developer.spotify.com/dashboard" target="_blank" rel="noopener noreferrer" className="text-primary underline">developer.spotify.com</a> → Your App → Settings → Redirect URIs
                </p>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      )}

      {/* Local Downloader Settings */}
      <LocalDownloaderSettings />
      
      {/* All Platforms Dialog */}
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <ExternalLink className="w-4 h-4" />
            <span className="hidden sm:inline">All Platforms</span>
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-lg bg-card border-border">
          <DialogHeader>
            <DialogTitle className="font-display neon-text-cyan">Music Platforms</DialogTitle>
            <DialogDescription>
              Connect to streaming platforms and choose your download method
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="platforms" className="mt-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="platforms">Platforms</TabsTrigger>
              <TabsTrigger value="download">Download Mode</TabsTrigger>
            </TabsList>

            <TabsContent value="platforms" className="space-y-3 mt-4">
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
                      "w-10 h-10 rounded-lg flex items-center justify-center text-lg",
                      p.color
                    )}>
                      {p.icon}
                    </div>
                    <div>
                      <div className="font-medium text-sm flex items-center gap-2">
                        {p.label}
                        {p.connected && (
                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                            Connected
                          </Badge>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">{p.description}</div>
                    </div>
                  </div>
                  <Button
                    variant={p.connected ? "default" : "outline"}
                    size="sm"
                    onClick={() => handlePlatformClick(p.platform)}
                    disabled={p.platform === 'local'}
                    className={cn(
                      "min-w-[90px]",
                      p.connected && "bg-primary text-primary-foreground"
                    )}
                  >
                    {p.connected ? (
                      <>
                        <Check className="w-4 h-4 mr-1" />
                        {p.platform === 'spotify' ? 'Browse' : 'On'}
                      </>
                    ) : (
                      'Connect'
                    )}
                  </Button>
                </div>
              ))}
            </TabsContent>

            <TabsContent value="download" className="space-y-4 mt-4">
              <p className="text-sm text-muted-foreground">
                Choose how tracks are downloaded when importing from streaming platforms:
              </p>

              <div className="space-y-3">
                {/* Cloud Option */}
                <div 
                  className={cn(
                    "flex items-start gap-4 p-4 rounded-lg border cursor-pointer transition-colors",
                    downloadMode === 'cloud' 
                      ? "border-primary bg-primary/5" 
                      : "border-border bg-muted/30 hover:border-muted-foreground/50"
                  )}
                  onClick={() => setDownloadMode('cloud')}
                >
                  <div className={cn(
                    "w-10 h-10 rounded-lg flex items-center justify-center",
                    downloadMode === 'cloud' ? "bg-primary text-primary-foreground" : "bg-muted"
                  )}>
                    <Cloud className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-sm flex items-center gap-2">
                      Cloud Processing
                      <Badge variant="outline" className="text-[10px]">Recommended</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Downloads are processed on our servers. No setup required, works everywhere.
                      Files are stored in your cloud library.
                    </p>
                    <div className="flex gap-2 mt-2">
                      <Badge variant="secondary" className="text-[10px]">No Setup</Badge>
                      <Badge variant="secondary" className="text-[10px]">Instant</Badge>
                    </div>
                  </div>
                  {downloadMode === 'cloud' && (
                    <Check className="w-5 h-5 text-primary" />
                  )}
                </div>

                {/* Local Option */}
                <div 
                  className={cn(
                    "flex items-start gap-4 p-4 rounded-lg border cursor-pointer transition-colors",
                    downloadMode === 'local' 
                      ? "border-primary bg-primary/5" 
                      : "border-border bg-muted/30 hover:border-muted-foreground/50"
                  )}
                  onClick={() => setDownloadMode('local')}
                >
                  <div className={cn(
                    "w-10 h-10 rounded-lg flex items-center justify-center",
                    downloadMode === 'local' ? "bg-primary text-primary-foreground" : "bg-muted"
                  )}>
                    <HardDrive className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-sm flex items-center gap-2">
                      Local Server
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Run Python server on your machine for lossless WAV downloads.
                      Best quality, files saved locally first.
                    </p>
                    <div className="flex gap-2 mt-2">
                      <Badge variant="secondary" className="text-[10px]">Lossless WAV</Badge>
                      <Badge variant="secondary" className="text-[10px]">Local Storage</Badge>
                    </div>
                  </div>
                  {downloadMode === 'local' && (
                    <Check className="w-5 h-5 text-primary" />
                  )}
                </div>
              </div>

              {downloadMode === 'local' && (
                <div className="p-3 rounded-lg bg-muted/50 border border-border">
                  <div className="flex items-start gap-2 text-xs text-muted-foreground">
                    <Server className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-foreground mb-1">Local server required</p>
                      <p>
                        Configure your ngrok URL in the Local Server settings above.
                        Run the Python server on your machine to enable downloads.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </div>
  );
};
