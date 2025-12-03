import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Monitor, Download, Music, FolderSync, Zap, Apple, Cpu, HardDrive, MemoryStick, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

const GITHUB_REPO = 'https://github.com/zalvi22/sonic-mix-wizard';

export default function Desktop() {
  const navigate = useNavigate();

  const releasesUrl = `${GITHUB_REPO}/releases`;

  const features = [
    {
      icon: Music,
      title: 'Sonic Pi Integration',
      description: 'Direct OSC connection to Sonic Pi',
    },
    {
      icon: FolderSync,
      title: 'TunePat Auto-Import',
      description: 'Auto-detect downloaded tracks',
    },
    {
      icon: Download,
      title: 'Lossless Downloads',
      description: 'WAV/FLAC via yt-dlp',
    },
    {
      icon: Zap,
      title: 'Native Performance',
      description: 'Fast Tauri-powered app',
    },
  ];

  const systemRequirements = [
    { icon: Apple, label: 'macOS', value: '10.15 Catalina or later' },
    { icon: Cpu, label: 'Processor', value: 'Apple Silicon or Intel Core i5+' },
    { icon: MemoryStick, label: 'RAM', value: '8GB minimum, 16GB recommended' },
    { icon: HardDrive, label: 'Storage', value: '500MB + space for audio files' },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-display neon-text-cyan">Desktop App</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 max-w-3xl">
        {/* Hero */}
        <div className="text-center mb-10">
          <div className="inline-flex p-4 rounded-2xl bg-primary/10 border border-primary/30 mb-6">
            <Monitor className="h-16 w-16 text-primary" />
          </div>
          <h2 className="text-4xl font-display mb-4">
            <span className="neon-text-cyan">SONIC</span>
            <span className="neon-text-magenta">MIX</span>
            <span className="text-foreground"> Desktop</span>
          </h2>
          <p className="text-muted-foreground text-lg">
            Native macOS app with full audio control
          </p>
        </div>

        {/* Download Card */}
        <Card className="deck-panel p-8 mb-6">
          <div className="flex items-center justify-center gap-3 mb-6">
            <Apple className="h-10 w-10 text-foreground" />
            <div className="text-left">
              <h3 className="text-2xl font-display text-foreground">Download for Mac</h3>
              <p className="text-sm text-muted-foreground">One-click install</p>
            </div>
          </div>

          <Button 
            size="lg"
            className="w-full gap-3 text-lg py-7 mb-6"
            onClick={() => window.open(releasesUrl, '_blank')}
          >
            <Download className="h-6 w-6" />
            Download SonicMix.dmg
          </Button>

          {/* Simple install info */}
          <div className="bg-background/50 rounded-lg p-4 text-center">
            <p className="text-sm text-muted-foreground mb-2">
              <span className="text-foreground font-medium">Standard macOS install:</span>
            </p>
            <p className="text-sm text-muted-foreground">
              Open the .dmg → Drag to Applications → Done
            </p>
            <p className="text-xs text-muted-foreground mt-2 opacity-70">
              macOS will prompt for permission on first launch
            </p>
          </div>
        </Card>

        {/* System Requirements */}
        <Card className="deck-panel p-6 mb-6">
          <h3 className="font-display text-foreground mb-4 flex items-center gap-2">
            <Cpu className="h-5 w-5 text-primary" />
            System Requirements
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {systemRequirements.map((req) => (
              <div key={req.label} className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-muted/50">
                  <req.icon className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{req.label}</p>
                  <p className="text-sm text-foreground">{req.value}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 p-3 rounded-lg bg-primary/5 border border-primary/20">
            <p className="text-xs text-muted-foreground">
              <span className="text-primary font-medium">Recommended:</span> Apple Silicon Mac with 16GB RAM for real-time audio processing.
            </p>
          </div>
        </Card>

        {/* Features Grid */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          {features.map((feature) => (
            <Card key={feature.title} className="deck-panel p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <feature.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-display text-sm text-foreground">{feature.title}</h3>
                  <p className="text-xs text-muted-foreground">{feature.description}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* View all releases link */}
        <div className="text-center">
          <Button 
            variant="link"
            className="gap-2 text-muted-foreground hover:text-foreground"
            onClick={() => window.open(releasesUrl, '_blank')}
          >
            View all releases & changelog
            <ExternalLink className="h-3 w-3" />
          </Button>
        </div>
      </main>
    </div>
  );
}
