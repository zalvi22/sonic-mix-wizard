import { useState, useCallback, useEffect, useRef } from 'react';
import { detectPlatform, tauriInvoke } from '@/lib/platform';
import { useToast } from '@/hooks/use-toast';

interface SonicPiState {
  isConnected: boolean;
  isPlaying: boolean;
  lastCode: string | null;
  error: string | null;
}

export function useSonicPi() {
  const platform = detectPlatform();
  const { toast } = useToast();
  const checkIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  const [state, setState] = useState<SonicPiState>({
    isConnected: false,
    isPlaying: false,
    lastCode: null,
    error: null,
  });

  // Check connection status
  const checkConnection = useCallback(async () => {
    if (platform !== 'desktop') {
      setState(prev => ({ ...prev, isConnected: false }));
      return false;
    }
    
    try {
      const connected = await tauriInvoke<boolean>('sonic_pi_check');
      setState(prev => ({ ...prev, isConnected: connected, error: null }));
      return connected;
    } catch (err) {
      setState(prev => ({ ...prev, isConnected: false }));
      return false;
    }
  }, [platform]);

  // Run code in Sonic Pi
  const runCode = useCallback(async (code: string): Promise<boolean> => {
    if (platform !== 'desktop') {
      toast({
        title: 'Desktop Required',
        description: 'Sonic Pi integration requires the desktop app.',
        variant: 'destructive',
      });
      return false;
    }
    
    try {
      await tauriInvoke<boolean>('sonic_pi_run', { code });
      setState(prev => ({ 
        ...prev, 
        isPlaying: true, 
        lastCode: code, 
        error: null,
        isConnected: true,
      }));
      toast({
        title: 'Playing in Sonic Pi',
        description: 'Code is now running',
      });
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to send code';
      setState(prev => ({ ...prev, error: message, isConnected: false }));
      toast({
        title: 'Sonic Pi Error',
        description: message,
        variant: 'destructive',
      });
      return false;
    }
  }, [platform, toast]);

  // Stop all sounds
  const stop = useCallback(async (): Promise<boolean> => {
    if (platform !== 'desktop') return false;
    
    try {
      await tauriInvoke<boolean>('sonic_pi_stop');
      setState(prev => ({ ...prev, isPlaying: false, error: null }));
      toast({
        title: 'Stopped',
        description: 'All sounds stopped',
      });
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to stop';
      setState(prev => ({ ...prev, error: message }));
      return false;
    }
  }, [platform, toast]);

  // Copy code to clipboard (fallback for web)
  const copyCode = useCallback(async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      toast({
        title: 'Copied to Clipboard',
        description: 'Paste this code into Sonic Pi and press Run',
      });
      return true;
    } catch {
      return false;
    }
  }, [toast]);

  // Start connection check interval
  useEffect(() => {
    if (platform === 'desktop') {
      checkConnection();
      checkIntervalRef.current = setInterval(checkConnection, 10000);
    }
    
    return () => {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
    };
  }, [platform, checkConnection]);

  return {
    ...state,
    isDesktop: platform === 'desktop',
    runCode,
    stop,
    copyCode,
    checkConnection,
  };
}
