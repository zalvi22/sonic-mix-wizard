import { useState, useCallback, useRef, useEffect } from 'react';
import { DeckState, MixerState, Track } from '@/types/dj';
import { useToast } from '@/hooks/use-toast';

interface AutoMixOptions {
  transitionDuration: number; // seconds
  transitionStyle: 'crossfade' | 'cut' | 'echo-out';
  cuePoint: number; // percentage of track where transition starts
  beatMatch: boolean;
}

interface AutoMixState {
  isEnabled: boolean;
  currentTransition: 'none' | 'a-to-b' | 'b-to-a';
  transitionProgress: number;
  options: AutoMixOptions;
}

const DEFAULT_OPTIONS: AutoMixOptions = {
  transitionDuration: 16, // 16 beats
  transitionStyle: 'crossfade',
  cuePoint: 0.75, // Start transition at 75% of track
  beatMatch: true,
};

export function useAutoMix(
  deckA: DeckState,
  deckB: DeckState,
  mixer: MixerState,
  trackQueue: Track[],
  onUpdateDeckA: (updates: Partial<DeckState>) => void,
  onUpdateDeckB: (updates: Partial<DeckState>) => void,
  onUpdateMixer: (updates: Partial<MixerState>) => void,
  onLoadToDeck: (track: Track, deck: 'A' | 'B') => void,
  onRemoveFromQueue: (trackId: string) => void
) {
  const { toast } = useToast();
  const transitionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const transitionIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  const [state, setState] = useState<AutoMixState>({
    isEnabled: false,
    currentTransition: 'none',
    transitionProgress: 0,
    options: DEFAULT_OPTIONS,
  });

  // Enable/disable auto mix
  const toggle = useCallback(() => {
    setState(prev => {
      const newEnabled = !prev.isEnabled;
      if (newEnabled) {
        toast({
          title: 'Auto Mix Enabled',
          description: 'Tracks will automatically transition',
        });
      }
      return { ...prev, isEnabled: newEnabled };
    });
  }, [toast]);

  // Update options
  const setOptions = useCallback((options: Partial<AutoMixOptions>) => {
    setState(prev => ({
      ...prev,
      options: { ...prev.options, ...options },
    }));
  }, []);

  // Start a transition
  const startTransition = useCallback((from: 'A' | 'B') => {
    const to = from === 'A' ? 'B' : 'A';
    const toDeck = from === 'A' ? deckB : deckA;
    
    // Check if target deck has a track
    if (!toDeck.track) {
      // Try to load next track from queue
      if (trackQueue.length > 0) {
        const nextTrack = trackQueue[0];
        onLoadToDeck(nextTrack, to);
        onRemoveFromQueue(nextTrack.id);
      } else {
        return; // No track to transition to
      }
    }

    setState(prev => ({
      ...prev,
      currentTransition: from === 'A' ? 'a-to-b' : 'b-to-a',
      transitionProgress: 0,
    }));

    const { transitionDuration } = state.options;
    const bpm = (from === 'A' ? deckA.track?.bpm : deckB.track?.bpm) || 120;
    const durationMs = (transitionDuration * 60 * 1000) / bpm; // Convert beats to ms
    const steps = 60; // Update 60 times during transition
    const stepMs = durationMs / steps;
    let currentStep = 0;

    // Start the incoming track
    if (to === 'A') {
      onUpdateDeckA({ isPlaying: true, position: 0 });
    } else {
      onUpdateDeckB({ isPlaying: true, position: 0 });
    }

    // Animate crossfader
    transitionIntervalRef.current = setInterval(() => {
      currentStep++;
      const progress = currentStep / steps;
      
      // Calculate crossfader position (-1 to 1)
      const crossfader = from === 'A' 
        ? -1 + (progress * 2) // -1 to 1
        : 1 - (progress * 2); // 1 to -1
      
      onUpdateMixer({ crossfader });
      setState(prev => ({ ...prev, transitionProgress: progress }));
      
      if (currentStep >= steps) {
        // Transition complete
        clearInterval(transitionIntervalRef.current!);
        
        // Stop the outgoing deck
        if (from === 'A') {
          onUpdateDeckA({ isPlaying: false, position: 0 });
        } else {
          onUpdateDeckB({ isPlaying: false, position: 0 });
        }
        
        setState(prev => ({
          ...prev,
          currentTransition: 'none',
          transitionProgress: 0,
        }));
        
        toast({
          title: 'Transition Complete',
          description: `Now playing from Deck ${to}`,
        });
      }
    }, stepMs);
  }, [deckA, deckB, state.options, trackQueue, onUpdateDeckA, onUpdateDeckB, onUpdateMixer, onLoadToDeck, onRemoveFromQueue, toast]);

  // Monitor deck positions for auto-transition trigger
  useEffect(() => {
    if (!state.isEnabled || state.currentTransition !== 'none') return;
    
    const { cuePoint } = state.options;
    
    // Check Deck A
    if (deckA.isPlaying && deckA.track) {
      const positionPercent = deckA.position / deckA.track.duration;
      if (positionPercent >= cuePoint) {
        startTransition('A');
      }
    }
    
    // Check Deck B
    if (deckB.isPlaying && deckB.track) {
      const positionPercent = deckB.position / deckB.track.duration;
      if (positionPercent >= cuePoint) {
        startTransition('B');
      }
    }
  }, [state.isEnabled, state.currentTransition, state.options, deckA, deckB, startTransition]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (transitionTimeoutRef.current) {
        clearTimeout(transitionTimeoutRef.current);
      }
      if (transitionIntervalRef.current) {
        clearInterval(transitionIntervalRef.current);
      }
    };
  }, []);

  return {
    ...state,
    toggle,
    setOptions,
    startTransition,
  };
}
