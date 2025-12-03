import { useEffect, useRef, useState } from 'react';
import { Play, Pause, SkipBack, Repeat, Volume2, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DeckState, Track } from '@/types/dj';
import { RekordboxWaveform } from './RekordboxWaveform';
import { AudioVisualizer } from './AudioVisualizer';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { WaveformData } from '@/lib/waveformGenerator';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';

interface DeckProps {
  deckId: 'A' | 'B';
  deck: DeckState;
  onUpdateDeck: (updates: Partial<DeckState>) => void;
  onLoadTrack: (track: Track) => void;
}

export const Deck = ({ deckId, deck, onUpdateDeck }: DeckProps) => {
  const colorClass = deckId === 'A' ? 'neon-text-cyan' : 'neon-text-magenta';
  const borderClass = deckId === 'A' ? 'neon-border-cyan' : 'neon-border-magenta';
  
  const audioPlayer = useAudioPlayer();
  const [isLoading, setIsLoading] = useState(false);
  const [audioError, setAudioError] = useState<string | null>(null);
  const lastTrackIdRef = useRef<string | null>(null);
  const isSyncingRef = useRef(false);

  // Load audio when track changes
  useEffect(() => {
    const track = deck.track;
    if (!track) {
      lastTrackIdRef.current = null;
      return;
    }

    if (track.id === lastTrackIdRef.current) return;
    lastTrackIdRef.current = track.id;

    const loadAudio = async () => {
      if (!track.audioUrl) {
        console.log('No audio URL for track:', track.title);
        setAudioError('No audio available');
        return;
      }

      setIsLoading(true);
      setAudioError(null);
      
      try {
        await audioPlayer.load(track.audioUrl);
        console.log('Audio loaded for:', track.title);
      } catch (err) {
        console.error('Failed to load audio:', err);
        setAudioError('Failed to load audio');
      } finally {
        setIsLoading(false);
      }
    };

    loadAudio();
  }, [deck.track?.id, deck.track?.audioUrl]);

  // Sync audio player state with deck state
  useEffect(() => {
    if (isSyncingRef.current) return;
    
    if (deck.isPlaying && audioPlayer.state.isLoaded && !audioPlayer.state.isPlaying) {
      audioPlayer.play();
    } else if (!deck.isPlaying && audioPlayer.state.isPlaying) {
      audioPlayer.pause();
    }
  }, [deck.isPlaying, audioPlayer.state.isLoaded]);

  // Update position from audio player
  useEffect(() => {
    if (audioPlayer.state.isPlaying) {
      isSyncingRef.current = true;
      onUpdateDeck({ position: audioPlayer.state.currentTime });
      isSyncingRef.current = false;
    }
  }, [audioPlayer.state.currentTime]);

  // Sync volume changes
  useEffect(() => {
    audioPlayer.setVolume(deck.volume);
  }, [deck.volume]);

  // Sync speed changes
  useEffect(() => {
    audioPlayer.setPlaybackRate(deck.speed);
  }, [deck.speed]);

  // Handle play/pause from audio player ending
  useEffect(() => {
    if (!audioPlayer.state.isPlaying && deck.isPlaying && audioPlayer.state.isLoaded) {
      // Audio finished or was stopped
      if (audioPlayer.state.currentTime >= audioPlayer.state.duration - 0.1) {
        onUpdateDeck({ isPlaying: false, position: 0 });
      }
    }
  }, [audioPlayer.state.isPlaying, audioPlayer.state.currentTime]);

  const handlePlayPause = () => {
    if (!audioPlayer.state.isLoaded && !deck.track?.audioUrl) {
      // No audio - just toggle visual state for tracks without audio
      onUpdateDeck({ isPlaying: !deck.isPlaying });
      return;
    }
    
    if (deck.isPlaying) {
      audioPlayer.pause();
      onUpdateDeck({ isPlaying: false });
    } else {
      audioPlayer.play();
      onUpdateDeck({ isPlaying: true });
    }
  };

  const handleSeek = (position: number) => {
    if (audioPlayer.state.isLoaded) {
      audioPlayer.seek(position);
    }
    onUpdateDeck({ position });
  };

  const handleRestart = () => {
    if (audioPlayer.state.isLoaded) {
      audioPlayer.seek(0);
    }
    onUpdateDeck({ position: 0 });
  };

  // Fallback simulation for tracks without audio
  const positionRef = useRef(deck.position);
  positionRef.current = deck.position;

  useEffect(() => {
    // Only use simulation if no audio is loaded
    if (audioPlayer.state.isLoaded || !deck.isPlaying || !deck.track) return;
    
    const trackDuration = deck.track.duration;
    const speed = deck.speed;
    
    const interval = setInterval(() => {
      const newPosition = positionRef.current + (0.05 * speed);
      if (newPosition >= trackDuration) {
        onUpdateDeck({ position: 0, isPlaying: false });
      } else {
        onUpdateDeck({ position: newPosition });
      }
    }, 50);

    return () => clearInterval(interval);
  }, [deck.isPlaying, deck.track?.duration, deck.speed, audioPlayer.state.isLoaded]);

  // Convert legacy waveform array to WaveformData if needed
  const getWaveformData = (): WaveformData | null => {
    if (!deck.track) return null;
    
    const waveform = deck.track.waveform;
    if (!waveform) return null;
    
    if (typeof waveform === 'object' && 'points' in waveform) {
      return waveform as WaveformData;
    }
    
    if (Array.isArray(waveform)) {
      const points = waveform.map(peak => ({
        low: peak * 0.8,
        mid: peak * 0.6,
        high: peak * 0.4,
        peak: peak,
      }));
      
      return {
        version: 1,
        sampleRate: 44100,
        samplesPerPoint: 256,
        length: points.length,
        duration: deck.track.duration,
        points,
      };
    }
    
    return null;
  };

  return (
    <div className={cn("deck-panel rounded-xl p-4 space-y-4")}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className={cn("font-display text-2xl font-bold", colorClass)}>
          DECK {deckId}
        </div>
        <div className="flex items-center gap-2">
          {isLoading && (
            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
          )}
          {audioPlayer.state.isLoaded && (
            <span className="text-xs text-green-500">●</span>
          )}
          {audioError && (
            <span className="text-xs text-destructive" title={audioError}>●</span>
          )}
          {deck.track && (
            <span className={cn("platform-badge", `platform-badge-${deck.track.platform}`)}>
              {deck.track.platform}
            </span>
          )}
        </div>
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

      {/* Audio Visualizer */}
      <AudioVisualizer 
        analyserNode={audioPlayer.getAnalyserNode()}
        isPlaying={deck.isPlaying}
        color={deckId === 'A' ? 'cyan' : 'magenta'}
        height={50}
      />

      {/* Rekordbox-style Waveform */}
      <RekordboxWaveform 
        waveformData={getWaveformData()}
        duration={deck.track?.duration || 0}
        position={deck.position}
        isPlaying={deck.isPlaying}
        onSeek={handleSeek}
        height={80}
        colorMode="frequency"
        showTimeline={true}
      />

      {/* Transport Controls */}
      <div className="flex items-center justify-center gap-2">
        <Button 
          variant="ghost" 
          size="icon"
          className="hover:bg-muted"
          onClick={handleRestart}
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
          onClick={handlePlayPause}
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="w-6 h-6 animate-spin" />
          ) : deck.isPlaying ? (
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
