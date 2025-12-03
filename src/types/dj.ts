import { WaveformData } from '@/lib/waveformGenerator';

export type Platform = 'spotify' | 'soundcloud' | 'youtube' | 'local';

export interface Track {
  id: string;
  title: string;
  artist: string;
  duration: number;
  bpm: number;
  key: string;
  platform: Platform;
  coverUrl?: string;
  audioUrl?: string;
  waveform?: number[] | WaveformData;
}

export interface DeckState {
  track: Track | null;
  isPlaying: boolean;
  position: number;
  volume: number;
  speed: number;
  pitch: number;
  loopStart: number | null;
  loopEnd: number | null;
  effects: {
    filter: number;
    reverb: number;
    delay: number;
    echo: number;
  };
}

export interface MixerState {
  crossfader: number;
  masterVolume: number;
}

export interface MashupElement {
  id: string;
  trackId: string;
  trackTitle: string;
  type: 'vocals' | 'drums' | 'bass' | 'melody' | 'full';
  startTime: number;
  endTime: number;
  volume: number;
}

export interface SonicPiCode {
  code: string;
  generatedAt: Date;
}
