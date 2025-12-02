import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function spotifyFetch(endpoint: string, accessToken: string) {
  const response = await fetch(`https://api.spotify.com/v1${endpoint}`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    console.error(`Spotify API error (${endpoint}):`, error);
    throw new Error(`Spotify API error: ${response.status}`);
  }

  return response.json();
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, accessToken, query, playlistId, limit = 20, offset = 0 } = await req.json();

    if (!accessToken) {
      throw new Error('Access token required');
    }

    let data;

    switch (action) {
      case 'getProfile':
        data = await spotifyFetch('/me', accessToken);
        break;

      case 'search':
        if (!query) throw new Error('Search query required');
        const searchParams = new URLSearchParams({
          q: query,
          type: 'track,album,artist,playlist',
          limit: limit.toString(),
          offset: offset.toString(),
        });
        data = await spotifyFetch(`/search?${searchParams}`, accessToken);
        break;

      case 'getPlaylists':
        data = await spotifyFetch(`/me/playlists?limit=${limit}&offset=${offset}`, accessToken);
        break;

      case 'getPlaylistTracks':
        if (!playlistId) throw new Error('Playlist ID required');
        data = await spotifyFetch(`/playlists/${playlistId}/tracks?limit=${limit}&offset=${offset}`, accessToken);
        break;

      case 'getSavedTracks':
        data = await spotifyFetch(`/me/tracks?limit=${limit}&offset=${offset}`, accessToken);
        break;

      case 'getTrack':
        const { trackId } = await req.json();
        if (!trackId) throw new Error('Track ID required');
        data = await spotifyFetch(`/tracks/${trackId}`, accessToken);
        break;

      case 'getAudioFeatures':
        const { trackIds } = await req.json();
        if (!trackIds || !trackIds.length) throw new Error('Track IDs required');
        data = await spotifyFetch(`/audio-features?ids=${trackIds.join(',')}`, accessToken);
        break;

      case 'getNewReleases':
        data = await spotifyFetch(`/browse/new-releases?limit=${limit}&offset=${offset}`, accessToken);
        break;

      case 'getFeaturedPlaylists':
        data = await spotifyFetch(`/browse/featured-playlists?limit=${limit}&offset=${offset}`, accessToken);
        break;

      case 'getCategories':
        data = await spotifyFetch(`/browse/categories?limit=${limit}&offset=${offset}`, accessToken);
        break;

      case 'getRecommendations':
        const { seedTracks, seedArtists, seedGenres } = await req.json();
        const recParams = new URLSearchParams({ limit: limit.toString() });
        if (seedTracks?.length) recParams.set('seed_tracks', seedTracks.join(','));
        if (seedArtists?.length) recParams.set('seed_artists', seedArtists.join(','));
        if (seedGenres?.length) recParams.set('seed_genres', seedGenres.join(','));
        data = await spotifyFetch(`/recommendations?${recParams}`, accessToken);
        break;

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
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
