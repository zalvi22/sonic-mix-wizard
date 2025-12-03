import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Monitor, Download, Music, FolderSync, Zap, Github, Apple, Terminal, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function Desktop() {
  const navigate = useNavigate();

  // TODO: Replace with your actual GitHub repo URL after connecting
  const GITHUB_REPO = ''; // e.g., 'https://github.com/username/sonicmix'
  const LATEST_RELEASE_URL = GITHUB_REPO ? `${GITHUB_REPO}/releases/latest` : '';
  const DMG_DOWNLOAD_URL = GITHUB_REPO ? `${GITHUB_REPO}/releases/latest/download/SonicMix.dmg` : '';

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
              <h3 className="text-xl font-display text-foreground">macOS Download</h3>
              <p className="text-sm text-muted-foreground">Requires macOS 10.15+</p>
            </div>
          </div>

          {DMG_DOWNLOAD_URL ? (
            <div className="space-y-4">
              <Button 
                className="w-full gap-2 text-lg py-6"
                onClick={() => window.open(DMG_DOWNLOAD_URL, '_blank')}
              >
                <Download className="h-5 w-5" />
                Download SonicMix.dmg
              </Button>
              <p className="text-sm text-muted-foreground text-center">
                Just download, open, and drag to Applications folder
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <Alert className="border-primary/50 bg-primary/5">
                <AlertCircle className="h-4 w-4 text-primary" />
                <AlertDescription className="text-sm">
                  <strong>No release available yet.</strong> To get the desktop app:
                  <ol className="list-decimal list-inside mt-2 space-y-1">
                    <li>Connect your GitHub account in Lovable (top-right button)</li>
                    <li>Create a release tag (e.g., <code className="bg-muted px-1 rounded">v1.0.0</code>)</li>
                    <li>GitHub Actions will automatically build the .dmg</li>
                    <li>Return here to download!</li>
                  </ol>
                </AlertDescription>
              </Alert>
              
              <Button 
                variant="outline"
                className="w-full gap-2"
                disabled={!GITHUB_REPO}
                onClick={() => LATEST_RELEASE_URL && window.open(LATEST_RELEASE_URL, '_blank')}
              >
                <Github className="h-4 w-4" />
                {GITHUB_REPO ? 'View Releases on GitHub' : 'Connect GitHub First'}
              </Button>
            </div>
          )}
        </Card>

        {/* Developer Section */}
        <Card className="deck-panel p-6">
          <div className="flex items-center gap-3 mb-4">
            <Terminal className="h-5 w-5 text-primary" />
            <h3 className="font-display text-foreground">For Developers</h3>
          </div>
          
          <p className="text-sm text-muted-foreground mb-4">
            Want to build from source or contribute? Clone the repo and run:
          </p>
          
          <div className="space-y-3 text-sm">
            <code className="block p-3 rounded bg-background text-primary font-mono">
              cd desktop && ./setup.sh && npm run tauri build
            </code>
          </div>
        </Card>
      </main>
    </div>
  );
}
