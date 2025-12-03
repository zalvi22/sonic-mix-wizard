import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Monitor, Download, Music, FolderSync, Zap, Apple, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

const GITHUB_REPO = 'https://github.com/zalvi22/sonic-mix-wizard';

export default function Desktop() {
  const navigate = useNavigate();

  const dmgDownloadUrl = `${GITHUB_REPO}/releases/latest/download/SonicMix.dmg`;

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
        <Card className="deck-panel p-8 mb-8">
          <div className="flex items-center justify-center gap-3 mb-6">
            <Apple className="h-10 w-10 text-foreground" />
            <div className="text-left">
              <h3 className="text-2xl font-display text-foreground">Download for Mac</h3>
              <p className="text-sm text-muted-foreground">macOS 10.15 or later</p>
            </div>
          </div>

          <Button 
            size="lg"
            className="w-full gap-3 text-lg py-7 mb-4"
            onClick={() => window.open(dmgDownloadUrl, '_blank')}
          >
            <Download className="h-6 w-6" />
            Download SonicMix.dmg
          </Button>

          {/* Installation steps */}
          <div className="bg-background/50 rounded-lg p-4 space-y-3">
            <p className="text-sm font-medium text-foreground mb-3">Installation:</p>
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <span className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold">1</span>
              <span>Open the downloaded .dmg file</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <span className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold">2</span>
              <span>Drag SonicMix to Applications folder</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <span className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold">3</span>
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-primary" />
                <span>Click "Open Anyway" when prompted (first launch only)</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Features Grid */}
        <div className="grid grid-cols-2 gap-3">
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
      </main>
    </div>
  );
}
