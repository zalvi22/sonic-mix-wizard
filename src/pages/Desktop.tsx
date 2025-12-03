import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Monitor, Download, Music, FolderSync, Zap, Github, Apple, Terminal, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

const GITHUB_REPO = 'https://github.com/zalvi22/sonic-mix-wizard';

export default function Desktop() {
  const navigate = useNavigate();

  const dmgDownloadUrl = `${GITHUB_REPO}/releases/latest/download/SonicMix.dmg`;
  const releasesUrl = `${GITHUB_REPO}/releases`;

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

          <div className="space-y-4">
            <Button 
              className="w-full gap-2 text-lg py-6"
              onClick={() => window.open(dmgDownloadUrl, '_blank')}
            >
              <Download className="h-5 w-5" />
              Download SonicMix.dmg
            </Button>
            <p className="text-sm text-muted-foreground text-center">
              Just download, open, and drag to Applications folder
            </p>
            <Button 
              variant="outline"
              className="w-full gap-2"
              onClick={() => window.open(releasesUrl, '_blank')}
            >
              <ExternalLink className="h-4 w-4" />
              View All Releases
            </Button>
          </div>
        </Card>

        {/* How to Create First Release */}
        <Card className="deck-panel p-6 mb-8">
          <h3 className="font-display text-foreground mb-4">First Time? Create a Release</h3>
          <p className="text-sm text-muted-foreground mb-4">
            If no .dmg is available yet, create your first release:
          </p>
          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-3">
              <span className="px-2 py-0.5 rounded bg-primary/20 text-primary font-mono">1</span>
              <p className="text-muted-foreground">
                Go to <a href={`${GITHUB_REPO}/releases/new`} target="_blank" rel="noopener" className="text-primary hover:underline">GitHub Releases</a>
              </p>
            </div>
            <div className="flex items-start gap-3">
              <span className="px-2 py-0.5 rounded bg-primary/20 text-primary font-mono">2</span>
              <p className="text-muted-foreground">
                Create tag <code className="bg-muted px-1 rounded">v1.0.0</code> and click "Publish release"
              </p>
            </div>
            <div className="flex items-start gap-3">
              <span className="px-2 py-0.5 rounded bg-primary/20 text-primary font-mono">3</span>
              <p className="text-muted-foreground">
                Wait ~10 min for GitHub Actions to build the .dmg
              </p>
            </div>
          </div>
          <Button 
            variant="secondary"
            className="w-full mt-4 gap-2"
            onClick={() => window.open(`${GITHUB_REPO}/releases/new`, '_blank')}
          >
            <Github className="h-4 w-4" />
            Create Release on GitHub
          </Button>
        </Card>

        {/* Developer Section */}
        <Card className="deck-panel p-6">
          <div className="flex items-center gap-3 mb-4">
            <Terminal className="h-5 w-5 text-muted-foreground" />
            <h3 className="font-display text-muted-foreground">For Developers</h3>
          </div>
          <code className="block p-3 rounded bg-background text-xs text-muted-foreground font-mono">
            cd desktop && ./setup.sh && npm run tauri build
          </code>
        </Card>
      </main>
    </div>
  );
}
