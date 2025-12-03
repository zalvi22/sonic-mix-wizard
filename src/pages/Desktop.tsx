import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Monitor, Download, Music, FolderSync, Zap, Github, Apple, Terminal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default function Desktop() {
  const navigate = useNavigate();

  const features = [
    {
      icon: Music,
      title: 'Sonic Pi Integration',
      description: 'Send generated code directly to Sonic Pi via OSC protocol',
    },
    {
      icon: FolderSync,
      title: 'TunePat Auto-Import',
      description: 'Automatically import tracks downloaded via TunePat',
    },
    {
      icon: Download,
      title: 'Lossless Downloads',
      description: 'Download tracks in WAV/FLAC using yt-dlp',
    },
    {
      icon: Zap,
      title: 'Native Performance',
      description: 'Built with Tauri for fast, lightweight native experience',
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

      <main className="container mx-auto px-4 py-12 max-w-4xl">
        {/* Hero */}
        <div className="text-center mb-12">
          <div className="inline-flex p-4 rounded-2xl bg-primary/10 border border-primary/30 mb-6">
            <Monitor className="h-16 w-16 text-primary" />
          </div>
          <h2 className="text-4xl font-display mb-4">
            <span className="neon-text-cyan">SONIC</span>
            <span className="neon-text-magenta">MIX</span>
            <span className="text-foreground"> Desktop</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Full-featured native app with Sonic Pi integration, TunePat sync, and lossless audio downloads.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12">
          {features.map((feature) => (
            <Card key={feature.title} className="deck-panel p-6">
              <div className="flex items-start gap-4">
                <div className="p-2 rounded-lg bg-primary/10">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-display text-foreground mb-1">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Download Section */}
        <Card className="deck-panel p-8 mb-8">
          <div className="flex items-center gap-3 mb-6">
            <Apple className="h-8 w-8 text-foreground" />
            <div>
              <h3 className="text-xl font-display text-foreground">macOS</h3>
              <p className="text-sm text-muted-foreground">Requires macOS 10.15+</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-muted/50 border border-border">
              <p className="text-sm text-muted-foreground mb-3">
                Clone the repo and run the setup script:
              </p>
              <code className="block p-3 rounded bg-background text-sm font-mono text-primary">
                cd desktop && ./setup.sh
              </code>
            </div>

            <Button 
              className="w-full gap-2"
              onClick={() => window.open('https://github.com', '_blank')}
            >
              <Github className="h-4 w-4" />
              View on GitHub
            </Button>
          </div>
        </Card>

        {/* Build Instructions */}
        <Card className="deck-panel p-6">
          <div className="flex items-center gap-3 mb-4">
            <Terminal className="h-5 w-5 text-primary" />
            <h3 className="font-display text-foreground">Build from Source</h3>
          </div>
          
          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-3">
              <span className="px-2 py-0.5 rounded bg-primary/20 text-primary font-mono">1</span>
              <div>
                <p className="text-foreground">Install prerequisites</p>
                <code className="text-muted-foreground">brew install rust node yt-dlp ffmpeg</code>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="px-2 py-0.5 rounded bg-primary/20 text-primary font-mono">2</span>
              <div>
                <p className="text-foreground">Run setup</p>
                <code className="text-muted-foreground">cd desktop && ./setup.sh</code>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="px-2 py-0.5 rounded bg-primary/20 text-primary font-mono">3</span>
              <div>
                <p className="text-foreground">Build .dmg installer</p>
                <code className="text-muted-foreground">npm run tauri build</code>
              </div>
            </div>
          </div>
        </Card>
      </main>
    </div>
  );
}
