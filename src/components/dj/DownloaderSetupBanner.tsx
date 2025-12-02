import { useState, useEffect } from 'react';
import { Server, Download, Check, X, Loader2, Copy, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const STORAGE_KEY = 'sonicmix_local_downloader_url';
const DISMISSED_KEY = 'sonicmix_setup_dismissed';

export const DownloaderSetupBanner = () => {
  const { toast } = useToast();
  const [url, setUrl] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);

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
            description: "Local downloader is ready. You can now import from YouTube, Spotify & SoundCloud.",
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

  const copyCommand = (cmd: string) => {
    navigator.clipboard.writeText(cmd);
    toast({
      title: "Copied!",
      description: "Command copied to clipboard",
    });
  };

  // Don't show if connected or dismissed
  if (isConnected || isDismissed) {
    return isConnected ? (
      <div className="mx-4 lg:mx-6 mb-4 p-3 rounded-lg bg-neon-green/10 border border-neon-green/30 flex items-center justify-between">
        <div className="flex items-center gap-2 text-neon-green text-sm">
          <Check className="w-4 h-4" />
          <span>Local downloader connected - Ready to import from YouTube, Spotify & SoundCloud</span>
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
    ) : null;
  }

  return (
    <div className="mx-4 lg:mx-6 mb-4 p-4 rounded-lg bg-gradient-to-r from-neon-purple/20 via-neon-cyan/20 to-neon-pink/20 border border-neon-cyan/30">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-neon-cyan/20">
            <Download className="w-5 h-5 text-neon-cyan" />
          </div>
          <div className="flex-1">
            <h3 className="font-display font-semibold text-foreground mb-1">
              Enable Music Downloads
            </h3>
            <p className="text-sm text-muted-foreground mb-3">
              Connect the local downloader to import tracks from YouTube, Spotify, and SoundCloud in lossless quality.
            </p>
            
            {/* Quick connect */}
            <div className="flex flex-col sm:flex-row gap-2 mb-3">
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

            {/* Expandable instructions */}
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setShowInstructions(!showInstructions)}
              className="text-muted-foreground hover:text-foreground gap-1 p-0 h-auto"
            >
              {showInstructions ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              {showInstructions ? 'Hide setup instructions' : 'First time? View setup instructions'}
            </Button>

            {showInstructions && (
              <div className="mt-3 p-3 rounded-lg bg-background/50 border border-border space-y-3">
                <div className="space-y-2">
                  <p className="text-xs font-medium text-foreground">1. First, make the scripts executable (one-time)</p>
                  <div className="flex gap-2 items-center">
                    <code className="flex-1 text-xs bg-muted px-2 py-1.5 rounded font-mono text-neon-cyan overflow-x-auto">
                      chmod +x ~/Downloads/local_downloader/*.command
                    </code>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => copyCommand('chmod +x ~/Downloads/local_downloader/*.command')}
                      className="shrink-0"
                    >
                      <Copy className="w-3 h-3" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">Open Terminal app and paste this command</p>
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-medium text-foreground">2. Double-click install_macos.command</p>
                  <p className="text-xs text-muted-foreground">This installs Python, FFmpeg, and ngrok automatically</p>
                </div>
                
                <div className="space-y-2">
                  <p className="text-xs font-medium text-foreground">3. Double-click SonicMix_Downloader.command</p>
                  <p className="text-xs text-muted-foreground">The URL will be copied to your clipboard - paste it above!</p>
                </div>

                <div className="pt-2 border-t border-border">
                  <p className="text-xs text-muted-foreground">
                    <strong>Note:</strong> You'll need a free <a href="https://ngrok.com" target="_blank" rel="noopener" className="text-neon-cyan hover:underline">ngrok.com</a> account and run <code className="bg-muted px-1 rounded">ngrok config add-authtoken YOUR_TOKEN</code> once.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        <Button 
          variant="ghost" 
          size="icon"
          onClick={handleDismiss}
          className="text-muted-foreground hover:text-foreground shrink-0"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};
