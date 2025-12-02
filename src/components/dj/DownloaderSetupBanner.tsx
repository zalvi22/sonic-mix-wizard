import { useState, useEffect } from 'react';
import { Server, Download, Check, X, Loader2, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';

const STORAGE_KEY = 'sonicmix_local_downloader_url';
const DISMISSED_KEY = 'sonicmix_setup_dismissed';

export const useLocalDownloader = () => {
  const [url, setUrl] = useState<string | null>(() => {
    return localStorage.getItem(STORAGE_KEY);
  });

  const downloadTrack = async (trackData: {
    url?: string;
    title: string;
    artist: string;
    platform: string;
  }) => {
    if (!url) {
      throw new Error('Local downloader not configured');
    }

    const response = await fetch(`${url}/download`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(trackData),
    });

    if (!response.ok) {
      throw new Error('Failed to start download');
    }

    return response.json();
  };

  const checkStatus = async (jobId: string) => {
    if (!url) {
      throw new Error('Local downloader not configured');
    }

    const response = await fetch(`${url}/status/${jobId}`);
    if (!response.ok) {
      throw new Error('Failed to check status');
    }

    return response.json();
  };

  return {
    isConfigured: !!url,
    url,
    setUrl: (newUrl: string | null) => {
      if (newUrl) {
        localStorage.setItem(STORAGE_KEY, newUrl);
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
      setUrl(newUrl);
    },
    downloadTrack,
    checkStatus,
  };
};

export const DownloaderSetupBanner = () => {
  const { toast } = useToast();
  const [url, setUrl] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    const savedUrl = localStorage.getItem(STORAGE_KEY);
    const dismissed = localStorage.getItem(DISMISSED_KEY);
    
    if (savedUrl) {
      setUrl(savedUrl);
      checkConnection(savedUrl);
    }
    if (dismissed === 'true') {
      setIsDismissed(true);
    }
  }, []);

  const checkConnection = async (checkUrl: string) => {
    if (!checkUrl) {
      setIsConnected(false);
      return;
    }

    setIsChecking(true);
    try {
      const response = await fetch(`${checkUrl}/health`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.service === 'sonicmix-downloader') {
          setIsConnected(true);
          localStorage.setItem(STORAGE_KEY, checkUrl);
          toast({
            title: "Connected!",
            description: "Lossless WAV downloads enabled from Spotify, YouTube & SoundCloud.",
          });
          setIsChecking(false);
          return;
        }
      }
    } catch (error) {
      console.error('Connection check failed:', error);
    }
    
    setIsConnected(false);
    setIsChecking(false);
  };

  const handleConnect = () => {
    const cleanUrl = url.trim().replace(/\/$/, '');
    if (!cleanUrl) {
      toast({
        title: "Enter URL",
        description: "Paste your ngrok URL first",
        variant: "destructive",
      });
      return;
    }
    checkConnection(cleanUrl);
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    localStorage.setItem(DISMISSED_KEY, 'true');
  };

  // Connected state
  if (isConnected) {
    return (
      <div className="mx-4 lg:mx-6 mb-4 p-3 rounded-lg bg-neon-green/10 border border-neon-green/30 flex items-center justify-between">
        <div className="flex items-center gap-2 text-neon-green text-sm">
          <Check className="w-4 h-4" />
          <span><strong>Lossless Mode:</strong> Downloads from Spotify, YouTube & SoundCloud in WAV format</span>
        </div>
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => {
            localStorage.removeItem(STORAGE_KEY);
            setIsConnected(false);
            setUrl('');
          }}
          className="text-muted-foreground hover:text-foreground"
        >
          Disconnect
        </Button>
      </div>
    );
  }

  // Dismissed state
  if (isDismissed) {
    return null;
  }

  return (
    <div className="mx-4 lg:mx-6 mb-4 p-4 rounded-lg bg-gradient-to-r from-neon-purple/20 via-neon-cyan/20 to-neon-pink/20 border border-neon-cyan/30">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-neon-cyan/20">
            <Zap className="w-5 h-5 text-neon-cyan" />
          </div>
          <div className="flex-1">
            <h3 className="font-display font-semibold text-foreground mb-1">
              Enable Lossless Downloads
            </h3>
            <p className="text-sm text-muted-foreground mb-3">
              Connect the local server to download from <strong>Spotify</strong>, <strong>YouTube</strong>, and <strong>SoundCloud</strong> in lossless WAV format.
            </p>
            
            {/* Quick connect */}
            <div className="flex flex-col sm:flex-row gap-2 mb-2">
              <Input
                placeholder="Paste your ngrok URL here..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="flex-1 bg-background/50"
                onKeyDown={(e) => e.key === 'Enter' && handleConnect()}
              />
              <Button 
                onClick={handleConnect}
                disabled={isChecking}
                className="gap-2 min-w-[120px]"
              >
                {isChecking ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <Server className="w-4 h-4" />
                    Connect
                  </>
                )}
              </Button>
            </div>

            <p className="text-xs text-muted-foreground">
              Run <code className="bg-muted px-1 rounded">~/.sonicmix/start.sh</code> or the SonicMix_Setup.command to start the server
            </p>
          </div>
        </div>

        <Button 
          variant="ghost" 
          size="icon"
          onClick={handleDismiss}
          className="text-muted-foreground hover:text-foreground shrink-0"
          title="Use basic mode (MP3 only)"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};
