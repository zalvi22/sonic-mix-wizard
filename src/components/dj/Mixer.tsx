import { cn } from '@/lib/utils';
import { Slider } from '@/components/ui/slider';
import { MixerState } from '@/types/dj';

interface MixerProps {
  mixer: MixerState;
  onUpdateMixer: (updates: Partial<MixerState>) => void;
  deckAVolume: number;
  deckBVolume: number;
}

export const Mixer = ({ mixer, onUpdateMixer, deckAVolume, deckBVolume }: MixerProps) => {
  // Calculate effective volumes based on crossfader
  const effectiveA = deckAVolume * Math.min(1, 1 - mixer.crossfader);
  const effectiveB = deckBVolume * Math.min(1, 1 + mixer.crossfader);

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
          <div className="w-4 h-32 bg-muted rounded-full overflow-hidden rotate-180">
            <div 
              className="w-full bg-gradient-to-t from-neon-cyan via-neon-cyan to-neon-green transition-all duration-100"
              style={{ height: `${effectiveA * 100}%` }}
            />
          </div>
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
        </div>

        {/* Deck B Meter */}
        <div className="flex flex-col items-center gap-2">
          <span className="text-xs text-muted-foreground">B</span>
          <div className="w-4 h-32 bg-muted rounded-full overflow-hidden rotate-180">
            <div 
              className="w-full bg-gradient-to-t from-neon-magenta via-neon-magenta to-neon-orange transition-all duration-100"
              style={{ height: `${effectiveB * 100}%` }}
            />
          </div>
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
        <div className="flex justify-between text-xs">
          <span className="neon-text-cyan">A</span>
          <span className="text-muted-foreground">CROSSFADER</span>
          <span className="neon-text-magenta">B</span>
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
                  "control-knob w-12 h-12 rounded-full cursor-pointer",
                  "hover:border-primary transition-colors"
                )} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
