import { useState, useEffect } from 'react';
import { Server, Check, X, Loader2, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';

const STORAGE_KEY = 'sonicmix_local_downloader_url';

interface LocalDownloaderSettingsProps {
  onUrlChange?: (url: string | null) => void;
}

export const LocalDownloaderSettings = ({ onUrlChange }: LocalDownloaderSettingsProps) => {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [url, setUrl] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const savedUrl = localStorage.getItem(STORAGE_KEY);
    if (savedUrl) {
      setUrl(savedUrl);
      checkConnection(savedUrl);
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
          onUrlChange?.(checkUrl);
          return;
        }
      }
    } catch (error) {
      console.error('Connection check failed:', error);
    }
    
    setIsConnected(false);
    setIsChecking(false);
  };

  const handleSave = () => {
    const cleanUrl = url.trim().replace(/\/$/, ''); // Remove trailing slash
    localStorage.setItem(STORAGE_KEY, cleanUrl);
    checkConnection(cleanUrl);
    
    toast({
      title: "Settings saved",
      description: cleanUrl ? "Testing connection..." : "Local downloader URL cleared",
    });
  };

  const handleClear = () => {
    setUrl('');
    localStorage.removeItem(STORAGE_KEY);
    setIsConnected(false);
    onUrlChange?.(null);
    
    toast({
      title: "Disconnected",
      description: "Local downloader URL has been cleared",
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className={`gap-2 ${isConnected ? 'border-neon-green/50 text-neon-green' : 'border-border'}`}
        >
          <Server className="w-4 h-4" />
          {isConnected ? 'Connected' : 'Local Server'}
          {isConnected && <Check className="w-3 h-3" />}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Server className="w-5 h-5 text-neon-cyan" />
            Local Download Server
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Connect to your local Python server to download music from YouTube, Spotify, and SoundCloud in lossless format.
          </p>

          <div className="space-y-2">
            <Label htmlFor="downloader-url">ngrok URL</Label>
            <div className="flex gap-2">
              <Input
                id="downloader-url"
                placeholder="https://xxxx.ngrok.io"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
              {isChecking ? (
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground self-center" />
              ) : isConnected ? (
                <Check className="w-5 h-5 text-neon-green self-center" />
              ) : url ? (
                <X className="w-5 h-5 text-destructive self-center" />
              ) : null}
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={handleSave} className="flex-1">
              Save & Test
            </Button>
            <Button variant="outline" onClick={handleClear}>
              Clear
            </Button>
          </div>

          {isConnected && (
            <div className="p-3 rounded-lg bg-neon-green/10 border border-neon-green/30">
              <p className="text-sm text-neon-green">
                ✓ Connected to local download server
              </p>
            </div>
          )}

          <div className="border-t border-border pt-4">
            <h4 className="text-sm font-medium mb-2">Setup Instructions</h4>
            <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
              <li>Run the Python server on your machine</li>
              <li>Use ngrok to expose it: <code className="bg-muted px-1 rounded">ngrok http 5000</code></li>
              <li>Copy the https URL and paste above</li>
            </ol>
            <a 
              href="https://github.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-neon-cyan hover:underline mt-2"
            >
              View setup guide <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Hook to use the local downloader
export const useLocalDownloader = () => {
  const [url, setUrl] = useState<string | null>(() => {
    return localStorage.getItem(STORAGE_KEY);
  });

  const downloadTrack = async (trackData: {
    url?: string;
    title: string;
    artist: string;
    platform: string;
    track_id?: string;
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
    setUrl,
    downloadTrack,
    checkStatus,
  };
};
