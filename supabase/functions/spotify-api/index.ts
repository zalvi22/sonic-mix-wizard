import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Spotify IDs are base62 strings of 22 characters
const SPOTIFY_ID_REGEX = /^[a-zA-Z0-9]{22}$/;
const MAX_QUERY_LENGTH = 500;
const MAX_LIMIT = 50;

// Validate Spotify ID format
function isValidSpotifyId(id: unknown): id is string {
  return typeof id === "string" && SPOTIFY_ID_REGEX.test(id);
}

// Validate and sanitize search query
function sanitizeQuery(query: unknown): string | null {
  if (typeof query !== "string") return null;
  const sanitized = query.slice(0, MAX_QUERY_LENGTH).trim();
  return sanitized.length > 0 ? sanitized : null;
}

// Validate numeric parameters
function validateLimit(limit: unknown): number {
  const num = typeof limit === "number" ? limit : parseInt(String(limit), 10);
  if (isNaN(num) || num < 1) return 20;
  return Math.min(num, MAX_LIMIT);
}

function validateOffset(offset: unknown): number {
  const num = typeof offset === "number" ? offset : parseInt(String(offset), 10);
  if (isNaN(num) || num < 0) return 0;
  return Math.min(num, 10000); // Spotify max offset
}

async function spotifyFetch(endpoint: string, accessToken: string) {
  const response = await fetch(`https://api.spotify.com/v1${endpoint}`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`Spotify API error (${endpoint}):`, response.status);
    throw new Error(`Spotify API error: ${response.status}`);
  }

  return response.json();
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { action, accessToken } = body;

    if (!accessToken || typeof accessToken !== "string") {
      throw new Error('Access token required');
    }

    if (!action || typeof action !== "string") {
      throw new Error('Action required');
    }

    const limit = validateLimit(body.limit);
    const offset = validateOffset(body.offset);

    let data;

    switch (action) {
      case 'getProfile':
        data = await spotifyFetch('/me', accessToken);
        break;

      case 'search': {
        const query = sanitizeQuery(body.query);
        if (!query) throw new Error('Search query required');
        const searchParams = new URLSearchParams({
          q: query,
          type: 'track,album,artist,playlist',
          limit: limit.toString(),
          offset: offset.toString(),
        });
        data = await spotifyFetch(`/search?${searchParams}`, accessToken);
        break;
      }

      case 'getPlaylists':
        data = await spotifyFetch(`/me/playlists?limit=${limit}&offset=${offset}`, accessToken);
        break;

      case 'getPlaylistTracks': {
        const playlistId = body.playlistId;
        if (!isValidSpotifyId(playlistId)) {
          throw new Error('Valid playlist ID required');
        }
        data = await spotifyFetch(`/playlists/${playlistId}/tracks?limit=${limit}&offset=${offset}`, accessToken);
        break;
      }

      case 'getSavedTracks':
        data = await spotifyFetch(`/me/tracks?limit=${limit}&offset=${offset}`, accessToken);
        break;

      case 'getTrack': {
        const trackId = body.trackId;
        if (!isValidSpotifyId(trackId)) {
          throw new Error('Valid track ID required');
        }
        data = await spotifyFetch(`/tracks/${trackId}`, accessToken);
        break;
      }

      case 'getAudioFeatures': {
        const trackIds = body.trackIds;
        if (!Array.isArray(trackIds) || trackIds.length === 0) {
          throw new Error('Track IDs required');
        }
        // Validate each ID and limit to 100 (Spotify max)
        const validIds = trackIds
          .filter(isValidSpotifyId)
          .slice(0, 100);
        if (validIds.length === 0) {
          throw new Error('No valid track IDs provided');
        }
        data = await spotifyFetch(`/audio-features?ids=${validIds.join(',')}`, accessToken);
        break;
      }

      case 'getNewReleases':
        data = await spotifyFetch(`/browse/new-releases?limit=${limit}&offset=${offset}`, accessToken);
        break;

      case 'getFeaturedPlaylists':
        // Featured playlists endpoint deprecated - use categories/playlists as fallback
        try {
          data = await spotifyFetch(`/browse/featured-playlists?limit=${limit}&offset=${offset}`, accessToken);
        } catch {
          // Fallback: return empty playlists structure
          data = { playlists: { items: [], total: 0 } };
        }
        break;

      case 'getCategories':
        data = await spotifyFetch(`/browse/categories?limit=${limit}&offset=${offset}`, accessToken);
        break;

      case 'getRecommendations': {
        const { seedTracks, seedArtists, seedGenres } = body;
        const recParams = new URLSearchParams({ limit: limit.toString() });
        
        // Validate seed parameters (Spotify requires at least one seed)
        const validSeedTracks = Array.isArray(seedTracks) 
          ? seedTracks.filter(isValidSpotifyId).slice(0, 5) 
          : [];
        const validSeedArtists = Array.isArray(seedArtists)
          ? seedArtists.filter(isValidSpotifyId).slice(0, 5)
          : [];
        const validSeedGenres = Array.isArray(seedGenres)
          ? seedGenres.filter((g): g is string => typeof g === "string").slice(0, 5)
          : [];

        if (validSeedTracks.length + validSeedArtists.length + validSeedGenres.length === 0) {
          throw new Error('At least one valid seed required');
        }

        if (validSeedTracks.length) recParams.set('seed_tracks', validSeedTracks.join(','));
        if (validSeedArtists.length) recParams.set('seed_artists', validSeedArtists.join(','));
        if (validSeedGenres.length) recParams.set('seed_genres', validSeedGenres.join(','));
        
        data = await spotifyFetch(`/recommendations?${recParams}`, accessToken);
        break;
      }

      default:
        throw new Error('Invalid action');
    }

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Spotify API error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
