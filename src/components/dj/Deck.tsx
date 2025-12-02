import { useState, useEffect } from 'react';
import { Play, Pause, SkipBack, SkipForward, Repeat, Volume2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DeckState, Track } from '@/types/dj';
import { Waveform } from './Waveform';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';

interface DeckProps {
  deckId: 'A' | 'B';
  deck: DeckState;
  onUpdateDeck: (updates: Partial<DeckState>) => void;
  onLoadTrack: (track: Track) => void;
}

export const Deck = ({ deckId, deck, onUpdateDeck }: DeckProps) => {
  const color = deckId === 'A' ? 'cyan' : 'magenta';
  const colorClass = deckId === 'A' ? 'neon-text-cyan' : 'neon-text-magenta';
  const borderClass = deckId === 'A' ? 'neon-border-cyan' : 'neon-border-magenta';

  // Simulate playback position
  useEffect(() => {
    if (!deck.isPlaying || !deck.track) return;
    
    const interval = setInterval(() => {
      onUpdateDeck({
        position: (deck.position + 0.001 * deck.speed) % 1
      });
    }, 50);

    return () => clearInterval(interval);
  }, [deck.isPlaying, deck.track, deck.speed]);

  const formatTime = (position: number, duration: number) => {
    const seconds = Math.floor(position * duration);
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className={cn("deck-panel rounded-xl p-4 space-y-4")}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className={cn("font-display text-2xl font-bold", colorClass)}>
          DECK {deckId}
        </div>
        {deck.track && (
          <span className={cn("platform-badge", `platform-badge-${deck.track.platform}`)}>
            {deck.track.platform}
          </span>
        )}
      </div>

      {/* Track Info */}
      <div className="min-h-[60px]">
        {deck.track ? (
          <div className="space-y-1">
            <div className="text-lg font-semibold truncate">{deck.track.title}</div>
            <div className="text-sm text-muted-foreground truncate">{deck.track.artist}</div>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className={colorClass}>{deck.track.bpm} BPM</span>
              <span className={colorClass}>Key: {deck.track.key}</span>
            </div>
          </div>
        ) : (
          <div className="text-muted-foreground text-center py-4">
            Drop a track here
          </div>
        )}
      </div>

      {/* Waveform */}
      <Waveform 
        data={deck.track?.waveform}
        position={deck.position}
        isPlaying={deck.isPlaying}
        color={color}
        className="h-24"
      />

      {/* Time Display */}
      <div className="flex justify-between text-sm font-mono">
        <span className={colorClass}>
          {deck.track ? formatTime(deck.position, deck.track.duration) : '0:00'}
        </span>
        <span className="text-muted-foreground">
          {deck.track ? formatTime(1, deck.track.duration) : '0:00'}
        </span>
      </div>

      {/* Transport Controls */}
      <div className="flex items-center justify-center gap-2">
        <Button 
          variant="ghost" 
          size="icon"
          className="hover:bg-muted"
          onClick={() => onUpdateDeck({ position: 0 })}
        >
          <SkipBack className="w-5 h-5" />
        </Button>
        <Button 
          variant="ghost" 
          size="icon"
          className={cn(
            "w-14 h-14 rounded-full border-2 transition-all",
            deck.isPlaying ? borderClass : "border-muted"
          )}
          onClick={() => onUpdateDeck({ isPlaying: !deck.isPlaying })}
        >
          {deck.isPlaying ? (
            <Pause className="w-6 h-6" />
          ) : (
            <Play className="w-6 h-6 ml-1" />
          )}
        </Button>
        <Button 
          variant="ghost" 
          size="icon"
          className="hover:bg-muted"
        >
          <Repeat className="w-5 h-5" />
        </Button>
      </div>

      {/* Speed/Pitch Controls */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">SPEED</span>
            <span className={colorClass}>{(deck.speed * 100).toFixed(0)}%</span>
          </div>
          <Slider
            value={[deck.speed * 100]}
            min={50}
            max={150}
            step={1}
            onValueChange={([value]) => onUpdateDeck({ speed: value / 100 })}
            className={cn(deckId === 'A' ? '[&_[role=slider]]:bg-neon-cyan' : '[&_[role=slider]]:bg-neon-magenta')}
          />
        </div>
        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">PITCH</span>
            <span className={colorClass}>{deck.pitch > 0 ? '+' : ''}{deck.pitch}</span>
          </div>
          <Slider
            value={[deck.pitch + 12]}
            min={0}
            max={24}
            step={1}
            onValueChange={([value]) => onUpdateDeck({ pitch: value - 12 })}
            className={cn(deckId === 'A' ? '[&_[role=slider]]:bg-neon-cyan' : '[&_[role=slider]]:bg-neon-magenta')}
          />
        </div>
      </div>

      {/* Volume */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-xs">
          <Volume2 className="w-4 h-4 text-muted-foreground" />
          <span className="text-muted-foreground">VOLUME</span>
          <span className={cn("ml-auto", colorClass)}>{Math.round(deck.volume * 100)}%</span>
        </div>
        <Slider
          value={[deck.volume * 100]}
          min={0}
          max={100}
          step={1}
          onValueChange={([value]) => onUpdateDeck({ volume: value / 100 })}
          className={cn(deckId === 'A' ? '[&_[role=slider]]:bg-neon-cyan' : '[&_[role=slider]]:bg-neon-magenta')}
        />
      </div>

      {/* Effects */}
      <div className="grid grid-cols-4 gap-2">
        {['Filter', 'Reverb', 'Delay', 'Echo'].map((effect) => (
          <div key={effect} className="space-y-1">
            <div className="text-[10px] text-center text-muted-foreground uppercase">{effect}</div>
            <div className={cn(
              "control-knob w-10 h-10 mx-auto rounded-full cursor-pointer",
              "hover:border-primary transition-colors"
            )} />
          </div>
        ))}
      </div>
    </div>
  );
};
