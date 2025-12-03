import { useCallback, useRef, useEffect } from 'react';
import { DeckState, MixerState } from '@/types/dj';

interface UseMixerProps {
  deckA: DeckState;
  deckB: DeckState;
  mixer: MixerState;
  audioPlayerA?: ReturnType<typeof import('./useAudioPlayer').useAudioPlayer>;
  audioPlayerB?: ReturnType<typeof import('./useAudioPlayer').useAudioPlayer>;
}

export function useMixer({ deckA, deckB, mixer, audioPlayerA, audioPlayerB }: UseMixerProps) {
  const masterGainRef = useRef<GainNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Calculate effective volume based on crossfader position
  const calculateCrossfadeVolume = useCallback((crossfader: number, deckVolume: number, isDeckA: boolean) => {
    // Crossfader: -1 = full A, 0 = center, 1 = full B
    let crossfadeMultiplier: number;
    
    if (isDeckA) {
      // Deck A: Full volume at -1 and 0, fades to 0 at +1
      if (crossfader <= 0) {
        crossfadeMultiplier = 1;
      } else {
        crossfadeMultiplier = 1 - crossfader;
      }
    } else {
      // Deck B: Full volume at 0 and +1, fades to 0 at -1
      if (crossfader >= 0) {
        crossfadeMultiplier = 1;
      } else {
        crossfadeMultiplier = 1 + crossfader;
      }
    }
    
    return deckVolume * crossfadeMultiplier * mixer.masterVolume;
  }, [mixer.masterVolume]);

  // Apply volumes to audio players
  useEffect(() => {
    if (audioPlayerA) {
      const volumeA = calculateCrossfadeVolume(mixer.crossfader, deckA.volume, true);
      audioPlayerA.setVolume(volumeA);
    }
    
    if (audioPlayerB) {
      const volumeB = calculateCrossfadeVolume(mixer.crossfader, deckB.volume, false);
      audioPlayerB.setVolume(volumeB);
    }
  }, [mixer.crossfader, mixer.masterVolume, deckA.volume, deckB.volume, audioPlayerA, audioPlayerB, calculateCrossfadeVolume]);

  // Get current effective volumes
  const getEffectiveVolumes = useCallback(() => ({
    deckA: calculateCrossfadeVolume(mixer.crossfader, deckA.volume, true),
    deckB: calculateCrossfadeVolume(mixer.crossfader, deckB.volume, false),
    master: mixer.masterVolume,
  }), [mixer.crossfader, mixer.masterVolume, deckA.volume, deckB.volume, calculateCrossfadeVolume]);

  // Auto-crossfade from A to B or B to A
  const autoCrossfade = useCallback((
    targetPosition: number,
    durationMs: number,
    onUpdate: (crossfader: number) => void
  ) => {
    const startPosition = mixer.crossfader;
    const startTime = performance.now();
    
    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / durationMs, 1);
      
      // Ease-in-out curve
      const eased = progress < 0.5
        ? 2 * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 2) / 2;
      
      const newPosition = startPosition + (targetPosition - startPosition) * eased;
      onUpdate(newPosition);
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    
    requestAnimationFrame(animate);
  }, [mixer.crossfader]);

  return {
    getEffectiveVolumes,
    autoCrossfade,
    calculateCrossfadeVolume,
  };
}
