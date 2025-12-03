import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface SpotifyTokens {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
}

interface SpotifyUser {
  id: string;
  display_name: string;
  email: string;
  images: { url: string }[];
}

const STORAGE_KEY = 'spotify_tokens';
const EXPIRY_KEY = 'spotify_token_expiry';

export function useSpotify() {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<SpotifyUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const { toast } = useToast();

  const getRedirectUri = () => {
    const origin = window.location.origin;
    // Spotify requires 127.0.0.1 instead of localhost (as of April 2025)
    if (origin.includes('localhost')) {
      return origin.replace('localhost', '127.0.0.1') + '/';
    }
    return origin + '/';
  };

  const saveTokens = (tokens: SpotifyTokens) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tokens));
    const expiryTime = Date.now() + tokens.expires_in * 1000;
    localStorage.setItem(EXPIRY_KEY, expiryTime.toString());
    setAccessToken(tokens.access_token);
  };

  const clearTokens = () => {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(EXPIRY_KEY);
    setAccessToken(null);
    setUser(null);
    setIsConnected(false);
  };

  const refreshAccessToken = async (refreshToken: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase.functions.invoke('spotify-auth', {
        body: {
          action: 'refreshToken',
          refreshToken,
          redirectUri: getRedirectUri(),
        },
      });

      if (error || data.error) {
        console.error('Token refresh failed:', error || data.error);
        return false;
      }

      const newTokens = {
        ...data,
        refresh_token: refreshToken, // Keep the original refresh token if not returned
      };
      saveTokens(newTokens);
      return true;
    } catch (err) {
      console.error('Token refresh error:', err);
      return false;
    }
  };

  const fetchUserProfile = async (token: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('spotify-api', {
        body: { action: 'getProfile', accessToken: token },
      });

      if (error || data.error) {
        throw new Error(data?.error || 'Failed to fetch profile');
      }

      setUser(data);
      setIsConnected(true);
    } catch (err) {
      console.error('Failed to fetch Spotify profile:', err);
      clearTokens();
    }
  };

  const checkAndRefreshToken = useCallback(async () => {
    const storedTokens = localStorage.getItem(STORAGE_KEY);
    const expiry = localStorage.getItem(EXPIRY_KEY);

    if (!storedTokens) {
      setIsLoading(false);
      return;
    }

    const tokens: SpotifyTokens = JSON.parse(storedTokens);
    const expiryTime = expiry ? parseInt(expiry) : 0;

    // Refresh if token expires in less than 5 minutes
    if (Date.now() > expiryTime - 5 * 60 * 1000) {
      const refreshed = await refreshAccessToken(tokens.refresh_token);
      if (!refreshed) {
        clearTokens();
        setIsLoading(false);
        return;
      }
    } else {
      setAccessToken(tokens.access_token);
    }

    await fetchUserProfile(tokens.access_token);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    checkAndRefreshToken();
  }, [checkAndRefreshToken]);

  // Handle OAuth callback
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const state = urlParams.get('state');

    if (code && !state) {
      // This is a Spotify callback (no state means it's not Supabase auth)
      handleCallback(code);
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const handleCallback = async (code: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('spotify-auth', {
        body: {
          action: 'exchangeCode',
          code,
          redirectUri: getRedirectUri(),
        },
      });

      if (error || data.error) {
        throw new Error(data?.error || 'Failed to exchange code');
      }

      saveTokens(data);
      await fetchUserProfile(data.access_token);
      toast({
        title: 'Connected to Spotify',
        description: 'Your Spotify account is now linked.',
      });
    } catch (err) {
      console.error('Spotify callback error:', err);
      toast({
        title: 'Connection failed',
        description: 'Failed to connect to Spotify. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const connect = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('spotify-auth', {
        body: {
          action: 'getAuthUrl',
          redirectUri: getRedirectUri(),
        },
      });

      if (error || data.error) {
        throw new Error(data?.error || 'Failed to get auth URL');
      }

      window.location.href = data.url;
    } catch (err) {
      console.error('Spotify connect error:', err);
      toast({
        title: 'Connection failed',
        description: 'Failed to initiate Spotify connection.',
        variant: 'destructive',
      });
    }
  };

  const disconnect = () => {
    clearTokens();
    toast({
      title: 'Disconnected',
      description: 'Your Spotify account has been disconnected.',
    });
  };

  const apiCall = async (action: string, params: Record<string, any> = {}) => {
    if (!accessToken) {
      throw new Error('Not connected to Spotify');
    }

    const { data, error } = await supabase.functions.invoke('spotify-api', {
      body: { action, accessToken, ...params },
    });

    if (error || data.error) {
      // Try to refresh token and retry
      const storedTokens = localStorage.getItem(STORAGE_KEY);
      if (storedTokens) {
        const tokens: SpotifyTokens = JSON.parse(storedTokens);
        const refreshed = await refreshAccessToken(tokens.refresh_token);
        if (refreshed) {
          const retryData = await supabase.functions.invoke('spotify-api', {
            body: { action, accessToken: localStorage.getItem(STORAGE_KEY) ? JSON.parse(localStorage.getItem(STORAGE_KEY)!).access_token : null, ...params },
          });
          if (!retryData.error && !retryData.data.error) {
            return retryData.data;
          }
        }
      }
      throw new Error(data?.error || 'API call failed');
    }

    return data;
  };

  return {
    isConnected,
    isLoading,
    user,
    connect,
    disconnect,
    search: (query: string, limit?: number, offset?: number) => 
      apiCall('search', { query, limit, offset }),
    getPlaylists: (limit?: number, offset?: number) => 
      apiCall('getPlaylists', { limit, offset }),
    getPlaylistTracks: (playlistId: string, limit?: number, offset?: number) => 
      apiCall('getPlaylistTracks', { playlistId, limit, offset }),
    getSavedTracks: (limit?: number, offset?: number) => 
      apiCall('getSavedTracks', { limit, offset }),
    getNewReleases: (limit?: number, offset?: number) => 
      apiCall('getNewReleases', { limit, offset }),
    getFeaturedPlaylists: (limit?: number, offset?: number) => 
      apiCall('getFeaturedPlaylists', { limit, offset }),
    getRecommendations: (params: { seedTracks?: string[]; seedArtists?: string[]; seedGenres?: string[] }) => 
      apiCall('getRecommendations', params),
  };
}
