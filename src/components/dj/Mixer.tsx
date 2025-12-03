import { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { MixerState } from '@/types/dj';
import { ArrowLeftRight, RotateCcw } from 'lucide-react';

interface MixerProps {
  mixer: MixerState;
  onUpdateMixer: (updates: Partial<MixerState>) => void;
  deckAVolume: number;
  deckBVolume: number;
  deckAPlaying?: boolean;
  deckBPlaying?: boolean;
}

export const Mixer = ({ mixer, onUpdateMixer, deckAVolume, deckBVolume, deckAPlaying, deckBPlaying }: MixerProps) => {
  const [vuLevelA, setVuLevelA] = useState(0);
  const [vuLevelB, setVuLevelB] = useState(0);
  const animationRef = useRef<number | null>(null);

  // Calculate effective volumes based on crossfader
  const effectiveA = deckAVolume * Math.min(1, 1 - mixer.crossfader);
  const effectiveB = deckBVolume * Math.min(1, 1 + mixer.crossfader);

  // Animate VU meters
  useEffect(() => {
    const animate = () => {
      setVuLevelA(prev => {
        const target = deckAPlaying ? effectiveA * (0.7 + Math.random() * 0.3) : 0;
        return prev + (target - prev) * 0.3;
      });
      setVuLevelB(prev => {
        const target = deckBPlaying ? effectiveB * (0.7 + Math.random() * 0.3) : 0;
        return prev + (target - prev) * 0.3;
      });
      animationRef.current = requestAnimationFrame(animate);
    };
    animationRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [effectiveA, effectiveB, deckAPlaying, deckBPlaying]);

  // Quick crossfade to center
  const centerCrossfader = () => {
    onUpdateMixer({ crossfader: 0 });
  };

  return (
    <div className="deck-panel rounded-xl p-6 space-y-6">
      {/* Header */}
      <div className="text-center">
        <h3 className="font-display text-xl font-bold neon-text-purple">MIXER</h3>
      </div>

      {/* VU Meters */}
      <div className="flex justify-center gap-8">
        {/* Deck A Meter */}
        <div className="flex flex-col items-center gap-2">
          <span className="text-xs text-muted-foreground">A</span>
          <div className="w-4 h-32 bg-muted rounded-full overflow-hidden rotate-180 relative">
            <div 
              className="w-full bg-gradient-to-t from-neon-cyan via-neon-cyan to-neon-green transition-all duration-75"
              style={{ height: `${vuLevelA * 100}%` }}
            />
            {/* Peak indicator */}
            {vuLevelA > 0.9 && (
              <div className="absolute top-0 w-full h-1 bg-destructive animate-pulse" />
            )}
          </div>
          <span className="text-[10px] text-neon-cyan">{Math.round(effectiveA * 100)}</span>
        </div>
        
        {/* Master Meter */}
        <div className="flex flex-col items-center gap-2">
          <span className="text-xs text-muted-foreground">M</span>
          <div className="w-4 h-32 bg-muted rounded-full overflow-hidden rotate-180">
            <div 
              className="w-full bg-gradient-to-t from-neon-purple via-neon-purple to-neon-orange transition-all duration-100"
              style={{ height: `${mixer.masterVolume * 100}%` }}
            />
          </div>
          <span className="text-[10px] text-neon-purple">{Math.round(mixer.masterVolume * 100)}</span>
        </div>

        {/* Deck B Meter */}
        <div className="flex flex-col items-center gap-2">
          <span className="text-xs text-muted-foreground">B</span>
          <div className="w-4 h-32 bg-muted rounded-full overflow-hidden rotate-180 relative">
            <div 
              className="w-full bg-gradient-to-t from-neon-magenta via-neon-magenta to-neon-orange transition-all duration-75"
              style={{ height: `${vuLevelB * 100}%` }}
            />
            {/* Peak indicator */}
            {vuLevelB > 0.9 && (
              <div className="absolute top-0 w-full h-1 bg-destructive animate-pulse" />
            )}
          </div>
          <span className="text-[10px] text-neon-magenta">{Math.round(effectiveB * 100)}</span>
        </div>
      </div>

      {/* Master Volume */}
      <div className="space-y-2">
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">MASTER</span>
          <span className="neon-text-purple">{Math.round(mixer.masterVolume * 100)}%</span>
        </div>
        <Slider
          value={[mixer.masterVolume * 100]}
          min={0}
          max={100}
          step={1}
          onValueChange={([value]) => onUpdateMixer({ masterVolume: value / 100 })}
          className="[&_[role=slider]]:bg-neon-purple"
        />
      </div>

      {/* Crossfader */}
      <div className="space-y-3">
        <div className="flex justify-between items-center text-xs">
          <span className="neon-text-cyan font-bold">A</span>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">CROSSFADER</span>
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5"
              onClick={centerCrossfader}
              title="Center crossfader"
            >
              <RotateCcw className="w-3 h-3" />
            </Button>
          </div>
          <span className="neon-text-magenta font-bold">B</span>
        </div>
        <div className="relative">
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-0.5 h-4 bg-muted-foreground/30" />
          </div>
          <Slider
            value={[(mixer.crossfader + 1) * 50]}
            min={0}
            max={100}
            step={1}
            onValueChange={([value]) => onUpdateMixer({ crossfader: (value / 50) - 1 })}
            className="[&_[role=slider]]:bg-gradient-to-r [&_[role=slider]]:from-neon-cyan [&_[role=slider]]:to-neon-magenta"
          />
        </div>
        {/* Crossfader position indicator */}
        <div className="text-center text-[10px] text-muted-foreground">
          {mixer.crossfader < -0.1 ? 'Deck A' : mixer.crossfader > 0.1 ? 'Deck B' : 'Center'}
        </div>
      </div>

      {/* EQ Section */}
      <div className="space-y-3">
        <div className="text-xs text-center text-muted-foreground">EQ</div>
        <div className="grid grid-cols-3 gap-4">
          {['HIGH', 'MID', 'LOW'].map((band) => (
            <div key={band} className="space-y-2">
              <div className="text-[10px] text-center text-muted-foreground">{band}</div>
              <div className="flex justify-center">
                <div className={cn(
                  "control-knob w-12 h-12 rounded-full cursor-pointer relative",
                  "hover:border-primary transition-colors"
                )}>
                  {/* Knob indicator line */}
                  <div className="absolute inset-2 rounded-full border border-muted-foreground/20">
                    <div className="absolute top-1/2 left-1/2 w-0.5 h-1/2 -translate-x-1/2 origin-top bg-primary/50 -rotate-45" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};