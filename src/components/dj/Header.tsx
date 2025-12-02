import { Disc3, Settings, HelpCircle, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PlatformConnector } from './PlatformConnector';

export const Header = () => {
  return (
    <header className="flex items-center justify-between px-6 py-4 border-b border-border bg-card/50 backdrop-blur-sm">
      {/* Logo */}
      <div className="flex items-center gap-3">
        <div className="relative">
          <Disc3 className="w-10 h-10 text-primary animate-spin-slow" />
          <div className="absolute inset-0 blur-lg bg-primary/30 animate-pulse-glow" />
        </div>
        <div>
          <h1 className="font-display text-2xl font-bold tracking-wider">
            <span className="neon-text-cyan">SONIC</span>
            <span className="neon-text-magenta">MIX</span>
          </h1>
          <p className="text-[10px] text-muted-foreground tracking-widest uppercase">
            AI-Powered DJ • Sonic Pi Integration
          </p>
        </div>
      </div>

      {/* Center - Platform Connections */}
      <div className="flex items-center gap-4">
        <PlatformConnector />
      </div>

      {/* Status & Actions */}
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/50 border border-border">
          <div className="w-2 h-2 rounded-full bg-neon-green animate-pulse" />
          <span className="text-xs text-muted-foreground">Ready</span>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="h-9 w-9">
            <Zap className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-9 w-9">
            <HelpCircle className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-9 w-9">
            <Settings className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </header>
  );
};
