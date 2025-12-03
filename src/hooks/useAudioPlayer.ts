import { useRef, useCallback, useEffect, useState } from 'react';

interface AudioPlayerState {
  isLoaded: boolean;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  playbackRate: number;
}

interface UseAudioPlayerReturn {
  state: AudioPlayerState;
  load: (url: string) => Promise<void>;
  play: () => void;
  pause: () => void;
  stop: () => void;
  seek: (time: number) => void;
  setVolume: (volume: number) => void;
  setPlaybackRate: (rate: number) => void;
  getAnalyserNode: () => AnalyserNode | null;
}

export function useAudioPlayer(): UseAudioPlayerReturn {
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioBufferRef = useRef<AudioBuffer | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const analyserNodeRef = useRef<AnalyserNode | null>(null);
  const startTimeRef = useRef<number>(0);
  const pausedAtRef = useRef<number>(0);
  const isPlayingRef = useRef<boolean>(false);
  const playbackRateRef = useRef<number>(1);
  
  const [state, setState] = useState<AudioPlayerState>({
    isLoaded: false,
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    volume: 1,
    playbackRate: 1,
  });

  // Initialize audio context
  const getAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext();
      gainNodeRef.current = audioContextRef.current.createGain();
      analyserNodeRef.current = audioContextRef.current.createAnalyser();
      analyserNodeRef.current.fftSize = 256;
      
      gainNodeRef.current.connect(analyserNodeRef.current);
      analyserNodeRef.current.connect(audioContextRef.current.destination);
    }
    return audioContextRef.current;
  }, []);

  // Update current time while playing
  useEffect(() => {
    let animationId: number;
    
    const updateTime = () => {
      if (isPlayingRef.current && audioContextRef.current) {
        const elapsed = (audioContextRef.current.currentTime - startTimeRef.current) * playbackRateRef.current;
        const currentTime = pausedAtRef.current + elapsed;
        
        setState(prev => ({
          ...prev,
          currentTime: Math.min(currentTime, prev.duration),
        }));
        
        // Check if reached end
        if (currentTime >= (audioBufferRef.current?.duration || 0)) {
          stop();
        }
      }
      animationId = requestAnimationFrame(updateTime);
    };
    
    animationId = requestAnimationFrame(updateTime);
    return () => cancelAnimationFrame(animationId);
  }, []);

  // Load audio from URL
  const load = useCallback(async (url: string) => {
    const context = getAudioContext();
    
    try {
      console.log('Loading audio from:', url);
      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await context.decodeAudioData(arrayBuffer);
      
      audioBufferRef.current = audioBuffer;
      pausedAtRef.current = 0;
      
      setState(prev => ({
        ...prev,
        isLoaded: true,
        duration: audioBuffer.duration,
        currentTime: 0,
      }));
      
      console.log('Audio loaded, duration:', audioBuffer.duration);
    } catch (err) {
      console.error('Failed to load audio:', err);
      throw err;
    }
  }, [getAudioContext]);

  // Create and start a new source node
  const createSourceNode = useCallback(() => {
    const context = audioContextRef.current;
    const buffer = audioBufferRef.current;
    const gainNode = gainNodeRef.current;
    
    if (!context || !buffer || !gainNode) return null;
    
    // Stop existing source if any
    if (sourceNodeRef.current) {
      try {
        sourceNodeRef.current.stop();
        sourceNodeRef.current.disconnect();
      } catch (e) {
        // Ignore errors from already stopped sources
      }
    }
    
    const source = context.createBufferSource();
    source.buffer = buffer;
    source.playbackRate.value = playbackRateRef.current;
    source.connect(gainNode);
    
    source.onended = () => {
      if (isPlayingRef.current) {
        // Natural end of playback
        isPlayingRef.current = false;
        pausedAtRef.current = 0;
        setState(prev => ({ ...prev, isPlaying: false, currentTime: 0 }));
      }
    };
    
    sourceNodeRef.current = source;
    return source;
  }, []);

  const play = useCallback(() => {
    const context = audioContextRef.current;
    if (!context || !audioBufferRef.current) return;
    
    // Resume context if suspended
    if (context.state === 'suspended') {
      context.resume();
    }
    
    const source = createSourceNode();
    if (!source) return;
    
    startTimeRef.current = context.currentTime;
    source.start(0, pausedAtRef.current);
    isPlayingRef.current = true;
    
    setState(prev => ({ ...prev, isPlaying: true }));
    console.log('Playing from:', pausedAtRef.current);
  }, [createSourceNode]);

  const pause = useCallback(() => {
    if (!isPlayingRef.current || !audioContextRef.current) return;
    
    const elapsed = (audioContextRef.current.currentTime - startTimeRef.current) * playbackRateRef.current;
    pausedAtRef.current += elapsed;
    
    if (sourceNodeRef.current) {
      try {
        sourceNodeRef.current.stop();
        sourceNodeRef.current.disconnect();
      } catch (e) {
        // Ignore
      }
      sourceNodeRef.current = null;
    }
    
    isPlayingRef.current = false;
    setState(prev => ({ ...prev, isPlaying: false }));
    console.log('Paused at:', pausedAtRef.current);
  }, []);

  const stop = useCallback(() => {
    pause();
    pausedAtRef.current = 0;
    setState(prev => ({ ...prev, currentTime: 0 }));
  }, [pause]);

  const seek = useCallback((time: number) => {
    const wasPlaying = isPlayingRef.current;
    
    if (wasPlaying) {
      pause();
    }
    
    pausedAtRef.current = Math.max(0, Math.min(time, audioBufferRef.current?.duration || 0));
    setState(prev => ({ ...prev, currentTime: pausedAtRef.current }));
    
    if (wasPlaying) {
      // Small delay to ensure clean transition
      setTimeout(() => play(), 10);
    }
  }, [pause, play]);

  const setVolume = useCallback((volume: number) => {
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = volume;
    }
    setState(prev => ({ ...prev, volume }));
  }, []);

  const setPlaybackRate = useCallback((rate: number) => {
    playbackRateRef.current = rate;
    if (sourceNodeRef.current) {
      sourceNodeRef.current.playbackRate.value = rate;
    }
    setState(prev => ({ ...prev, playbackRate: rate }));
  }, []);

  const getAnalyserNode = useCallback(() => analyserNodeRef.current, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (sourceNodeRef.current) {
        try {
          sourceNodeRef.current.stop();
          sourceNodeRef.current.disconnect();
        } catch (e) {
          // Ignore
        }
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  return {
    state,
    load,
    play,
    pause,
    stop,
    seek,
    setVolume,
    setPlaybackRate,
    getAnalyserNode,
  };
}
