import React, { useState, useEffect } from 'react';
import { useSpotify } from '@/hooks/useSpotify';
import { useTrackDownloader } from '@/hooks/useTrackDownloader';
import { Track } from '@/types/dj';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Search, 
  Music, 
  ListMusic, 
  Heart, 
  Sparkles,
  LogIn,
  LogOut,
  Loader2,
  Play,
  Plus,
  ExternalLink,
  Download,
  Check
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SpotifyBrowserProps {
  onTrackSelect?: (track: Track) => void;
  onAddToMashup?: (track: Track) => void;
}

interface SpotifyTrack {
  id: string;
  name: string;
  artists: { name: string }[];
  album: { name: string; images: { url: string }[] };
  duration_ms: number;
  external_urls: { spotify: string };
  preview_url: string | null;
}

interface SpotifyPlaylist {
  id: string;
  name: string;
  images: { url: string }[];
  tracks: { total: number };
  owner: { display_name: string };
}

export function SpotifyBrowser({ onTrackSelect, onAddToMashup }: SpotifyBrowserProps) {
  const { 
    isConnected, 
    isLoading, 
    user, 
    connect, 
    disconnect,
    search,
    getPlaylists,
    getPlaylistTracks,
    getSavedTracks,
    getNewReleases,
    getFeaturedPlaylists,
  } = useSpotify();

  const { downloadProgress, downloadAndAddTrack, isDownloading } = useTrackDownloader();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SpotifyTrack[]>([]);
  const [playlists, setPlaylists] = useState<SpotifyPlaylist[]>([]);
  const [savedTracks, setSavedTracks] = useState<SpotifyTrack[]>([]);
  const [newReleases, setNewReleases] = useState<any[]>([]);
  const [featuredPlaylists, setFeaturedPlaylists] = useState<SpotifyPlaylist[]>([]);
  const [selectedPlaylist, setSelectedPlaylist] = useState<string | null>(null);
  const [playlistTracks, setPlaylistTracks] = useState<SpotifyTrack[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [activeTab, setActiveTab] = useState('search');

  useEffect(() => {
    if (isConnected) {
      loadInitialData();
    }
  }, [isConnected]);

  const loadInitialData = async () => {
    try {
      const [playlistsData, savedData, releasesData, featuredData] = await Promise.all([
        getPlaylists(50),
        getSavedTracks(50),
        getNewReleases(20),
        getFeaturedPlaylists(20),
      ]);

      setPlaylists(playlistsData.items || []);
      setSavedTracks(savedData.items?.map((item: any) => item.track) || []);
      setNewReleases(releasesData.albums?.items || []);
      setFeaturedPlaylists(featuredData.playlists?.items || []);
    } catch (err) {
      console.error('Failed to load Spotify data:', err);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    try {
      const results = await search(searchQuery, 50);
      setSearchResults(results.tracks?.items || []);
    } catch (err) {
      console.error('Search failed:', err);
    } finally {
      setIsSearching(false);
    }
  };

  const handlePlaylistClick = async (playlistId: string) => {
    setSelectedPlaylist(playlistId);
    try {
      const tracks = await getPlaylistTracks(playlistId, 100);
      setPlaylistTracks(tracks.items?.map((item: any) => item.track).filter(Boolean) || []);
    } catch (err) {
      console.error('Failed to load playlist tracks:', err);
    }
  };

  const handleAddToDeck = (track: SpotifyTrack) => {
    if (!onTrackSelect) return;
    downloadAndAddTrack(track, onTrackSelect, 'deck');
  };

  const handleAddToMashup = (track: SpotifyTrack) => {
    if (!onAddToMashup) return;
    downloadAndAddTrack(track, onAddToMashup, 'mashup');
  };

  const formatDuration = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const getTrackStatus = (trackId: string) => downloadProgress[trackId];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-foreground mb-2">Connect to Spotify</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Link your Spotify account to browse and import tracks
          </p>
        </div>
        <Button onClick={connect} className="gap-2">
          <LogIn className="w-4 h-4" />
          Connect Spotify
        </Button>
      </div>
    );
  }

  const TrackItem = ({ track }: { track: SpotifyTrack }) => {
    const status = getTrackStatus(track.id);
    
    return (
      <div className="flex items-center gap-2 p-2 rounded-lg hover:bg-accent/50 transition-colors group">
        <img 
          src={track.album.images[2]?.url || track.album.images[0]?.url} 
          alt={track.album.name}
          className="w-12 h-12 rounded object-cover flex-shrink-0"
        />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground line-clamp-1" title={track.name}>
            {track.name}
          </p>
          <p className="text-xs text-muted-foreground line-clamp-1" title={track.artists.map(a => a.name).join(', ')}>
            {track.artists.map(a => a.name).join(', ')}
          </p>
          <p className="text-xs text-muted-foreground/70">
            {formatDuration(track.duration_ms)}
          </p>
        </div>
        <div className="flex flex-col gap-1 flex-shrink-0">
          {status === 'downloading' ? (
            <Button size="sm" variant="outline" className="h-7 px-2 text-xs" disabled>
              <Loader2 className="w-3 h-3 animate-spin mr-1" />
              Loading
            </Button>
          ) : status === 'complete' ? (
            <Button size="sm" variant="outline" className="h-7 px-2 text-xs text-green-500 border-green-500" disabled>
              <Check className="w-3 h-3 mr-1" />
              Added
            </Button>
          ) : (
            <>
              <Button 
                size="sm" 
                variant="default"
                className="h-7 px-2 text-xs"
                onClick={() => handleAddToDeck(track)}
                disabled={isDownloading}
              >
                <Play className="w-3 h-3 mr-1" />
                To Deck
              </Button>
              <Button 
                size="sm" 
                variant="outline"
                className="h-7 px-2 text-xs"
                onClick={() => handleAddToMashup(track)}
                disabled={isDownloading}
              >
                <Plus className="w-3 h-3 mr-1" />
                Mashup
              </Button>
            </>
          )}
        </div>
      </div>
    );
  };

  const PlaylistItem = ({ playlist }: { playlist: SpotifyPlaylist }) => (
    <div 
      className={cn(
        "flex items-center gap-3 p-2.5 rounded-lg hover:bg-accent/50 transition-colors cursor-pointer min-h-[56px]",
        selectedPlaylist === playlist.id && "bg-accent"
      )}
      onClick={() => handlePlaylistClick(playlist.id)}
    >
      <img 
        src={playlist.images[0]?.url || '/placeholder.svg'} 
        alt={playlist.name}
        className="w-11 h-11 rounded object-cover flex-shrink-0"
      />
      <div className="flex-1 min-w-0 overflow-hidden">
        <p className="text-sm font-medium text-foreground truncate">{playlist.name}</p>
        <p className="text-xs text-muted-foreground truncate">
          {playlist.tracks.total} tracks • {playlist.owner.display_name}
        </p>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-[#1DB954] flex items-center justify-center flex-shrink-0">
            <Music className="w-4 h-4 text-black" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-foreground truncate">{user?.display_name}</p>
            <p className="text-xs text-muted-foreground">Spotify Connected</p>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={disconnect} className="flex-shrink-0">
          <LogOut className="w-4 h-4" />
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
        <TabsList className="grid grid-cols-4 mx-4 mt-4 flex-shrink-0">
          <TabsTrigger value="search" className="gap-1 text-xs px-2">
            <Search className="w-3 h-3" />
            <span className="hidden sm:inline">Search</span>
          </TabsTrigger>
          <TabsTrigger value="playlists" className="gap-1 text-xs px-2">
            <ListMusic className="w-3 h-3" />
            <span className="hidden sm:inline">Playlists</span>
          </TabsTrigger>
          <TabsTrigger value="saved" className="gap-1 text-xs px-2">
            <Heart className="w-3 h-3" />
            <span className="hidden sm:inline">Liked</span>
          </TabsTrigger>
          <TabsTrigger value="browse" className="gap-1 text-xs px-2">
            <Sparkles className="w-3 h-3" />
            <span className="hidden sm:inline">Browse</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="search" className="flex-1 flex flex-col p-4 pt-3 min-h-0 mt-0">
          <div className="flex gap-2 mb-3 flex-shrink-0">
            <Input
              placeholder="Search tracks, artists, albums..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="flex-1"
            />
            <Button onClick={handleSearch} disabled={isSearching} className="flex-shrink-0">
              {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            </Button>
          </div>
          <ScrollArea className="flex-1">
            <div className="space-y-1 pr-3">
              {searchResults.map((track) => (
                <TrackItem key={track.id} track={track} />
              ))}
              {searchResults.length === 0 && !isSearching && (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Search for tracks to get started
                </p>
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="playlists" className="flex-1 flex p-4 pt-3 gap-3 min-h-0 mt-0">
          <ScrollArea className="w-[45%] flex-shrink-0">
            <div className="space-y-1 pr-2">
              {playlists.map((playlist) => (
                <PlaylistItem key={playlist.id} playlist={playlist} />
              ))}
              {playlists.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No playlists found
                </p>
              )}
            </div>
          </ScrollArea>
          <div className="w-px bg-border flex-shrink-0" />
          <ScrollArea className="flex-1">
            <div className="space-y-1 pr-2">
              {selectedPlaylist ? (
                playlistTracks.length > 0 ? (
                  playlistTracks.map((track) => (
                    <TrackItem key={track.id} track={track} />
                  ))
                ) : (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                  </div>
                )
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Select a playlist to view tracks
                </p>
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="saved" className="flex-1 p-4 pt-3 min-h-0 mt-0">
          <ScrollArea className="h-full">
            <div className="space-y-1 pr-3">
              {savedTracks.map((track) => (
                <TrackItem key={track.id} track={track} />
              ))}
              {savedTracks.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No liked songs found
                </p>
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="browse" className="flex-1 p-4 pt-3 min-h-0 mt-0">
          <ScrollArea className="h-full">
            <div className="space-y-6 pr-3">
              {featuredPlaylists.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-3">Featured Playlists</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {featuredPlaylists.slice(0, 6).map((playlist) => (
                      <div 
                        key={playlist.id}
                        className="flex items-center gap-2 p-2 rounded-lg hover:bg-accent/50 transition-colors cursor-pointer"
                        onClick={() => {
                          setActiveTab('playlists');
                          handlePlaylistClick(playlist.id);
                        }}
                      >
                        <img 
                          src={playlist.images[0]?.url || '/placeholder.svg'} 
                          alt={playlist.name}
                          className="w-10 h-10 rounded object-cover flex-shrink-0"
                        />
                        <p className="text-xs font-medium text-foreground truncate">{playlist.name}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {newReleases.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-3">New Releases</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {newReleases.slice(0, 6).map((album: any) => (
                      <div 
                        key={album.id}
                        className="flex items-center gap-2 p-2 rounded-lg hover:bg-accent/50 transition-colors cursor-pointer"
                        onClick={() => {
                          setSearchQuery(album.name);
                          setActiveTab('search');
                          setTimeout(handleSearch, 100);
                        }}
                      >
                        <img 
                          src={album.images[2]?.url || album.images[0]?.url} 
                          alt={album.name}
                          className="w-10 h-10 rounded object-cover flex-shrink-0"
                        />
                        <div className="min-w-0 overflow-hidden">
                          <p className="text-xs font-medium text-foreground truncate">{album.name}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {album.artists.map((a: any) => a.name).join(', ')}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {featuredPlaylists.length === 0 && newReleases.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Browse content unavailable
                </p>
              )}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
}
