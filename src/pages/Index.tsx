import { useState, useCallback } from 'react';
import { DeckState, MixerState, Track, MashupElement } from '@/types/dj';
import { Header } from '@/components/dj/Header';
import { Deck } from '@/components/dj/Deck';
import { Mixer } from '@/components/dj/Mixer';
import { TrackBrowser } from '@/components/dj/TrackBrowser';
import { MashupBuilder } from '@/components/dj/MashupBuilder';
import { SonicPiGenerator } from '@/components/dj/SonicPiGenerator';
import { PlatformConnector } from '@/components/dj/PlatformConnector';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const DEFAULT_DECK_STATE: DeckState = {
  track: null,
  isPlaying: false,
  position: 0,
  volume: 0.8,
  speed: 1,
  pitch: 0,
  loopStart: null,
  loopEnd: null,
  effects: {
    filter: 0,
    reverb: 0,
    delay: 0,
    echo: 0,
  },
};

const DEFAULT_MIXER_STATE: MixerState = {
  crossfader: 0,
  masterVolume: 0.8,
};

const Index = () => {
  const [deckA, setDeckA] = useState<DeckState>(DEFAULT_DECK_STATE);
  const [deckB, setDeckB] = useState<DeckState>(DEFAULT_DECK_STATE);
  const [mixer, setMixer] = useState<MixerState>(DEFAULT_MIXER_STATE);
  const [mashupElements, setMashupElements] = useState<MashupElement[]>([]);

  const updateDeckA = useCallback((updates: Partial<DeckState>) => {
    setDeckA(prev => ({ ...prev, ...updates }));
  }, []);

  const updateDeckB = useCallback((updates: Partial<DeckState>) => {
    setDeckB(prev => ({ ...prev, ...updates }));
  }, []);

  const updateMixer = useCallback((updates: Partial<MixerState>) => {
    setMixer(prev => ({ ...prev, ...updates }));
  }, []);

  const loadToDeck = useCallback((track: Track, deck: 'A' | 'B') => {
    const newState: Partial<DeckState> = {
      track,
      position: 0,
      isPlaying: false,
    };
    
    if (deck === 'A') {
      updateDeckA(newState);
    } else {
      updateDeckB(newState);
    }
  }, [updateDeckA, updateDeckB]);

  const addToMashup = useCallback((track: Track) => {
    const types: MashupElement['type'][] = ['vocals', 'drums', 'bass', 'melody', 'full'];
    const randomType = types[Math.floor(Math.random() * types.length)];
    
    const newElement: MashupElement = {
      id: `${track.id}-${Date.now()}`,
      trackId: track.id,
      trackTitle: track.title,
      type: randomType,
      startTime: 0,
      endTime: track.duration,
      volume: 0.8,
    };
    
    setMashupElements(prev => [...prev, newElement]);
  }, []);

  const removeFromMashup = useCallback((id: string) => {
    setMashupElements(prev => prev.filter(e => e.id !== id));
  }, []);

  const updateMashupElement = useCallback((id: string, updates: Partial<MashupElement>) => {
    setMashupElements(prev => 
      prev.map(e => e.id === id ? { ...e, ...updates } : e)
    );
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      
      <main className="flex-1 p-4 lg:p-6">
        {/* Platform Connector */}
        <div className="flex justify-end mb-4">
          <PlatformConnector />
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 lg:gap-6">
          {/* Track Browser */}
          <div className="xl:col-span-3 h-[600px]">
            <TrackBrowser 
              onLoadToDeck={loadToDeck}
              onAddToMashup={addToMashup}
            />
          </div>

          {/* Decks & Mixer */}
          <div className="xl:col-span-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Deck 
                deckId="A"
                deck={deckA}
                onUpdateDeck={updateDeckA}
                onLoadTrack={(track) => loadToDeck(track, 'A')}
              />
              <Mixer 
                mixer={mixer}
                onUpdateMixer={updateMixer}
                deckAVolume={deckA.volume}
                deckBVolume={deckB.volume}
              />
              <Deck 
                deckId="B"
                deck={deckB}
                onUpdateDeck={updateDeckB}
                onLoadTrack={(track) => loadToDeck(track, 'B')}
              />
            </div>
          </div>

          {/* Mashup & Code Generator */}
          <div className="xl:col-span-3">
            <Tabs defaultValue="mashup" className="h-[600px] flex flex-col">
              <TabsList className="grid grid-cols-2 mb-4">
                <TabsTrigger value="mashup">Mashup</TabsTrigger>
                <TabsTrigger value="code">Sonic Pi</TabsTrigger>
              </TabsList>
              <TabsContent value="mashup" className="flex-1 mt-0">
                <MashupBuilder 
                  elements={mashupElements}
                  onRemoveElement={removeFromMashup}
                  onUpdateElement={updateMashupElement}
                />
              </TabsContent>
              <TabsContent value="code" className="flex-1 mt-0">
                <SonicPiGenerator 
                  deckA={deckA}
                  deckB={deckB}
                  mashupElements={mashupElements}
                />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="px-6 py-3 border-t border-border text-center text-xs text-muted-foreground">
        <p>SonicMix • Powered by Sonic Pi • Connect platforms to unlock full functionality</p>
      </footer>
    </div>
  );
};

export default Index;
