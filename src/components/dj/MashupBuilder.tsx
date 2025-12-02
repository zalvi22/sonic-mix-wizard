import { useState } from 'react';
import { Layers, Trash2, Volume2, Music2, Drum, Guitar, Mic } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MashupElement, Track } from '@/types/dj';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { ScrollArea } from '@/components/ui/scroll-area';

interface MashupBuilderProps {
  elements: MashupElement[];
  onRemoveElement: (id: string) => void;
  onUpdateElement: (id: string, updates: Partial<MashupElement>) => void;
}

const ELEMENT_ICONS = {
  vocals: Mic,
  drums: Drum,
  bass: Guitar,
  melody: Music2,
  full: Layers,
};

const ELEMENT_COLORS = {
  vocals: 'text-neon-cyan bg-neon-cyan/20 border-neon-cyan/50',
  drums: 'text-neon-magenta bg-neon-magenta/20 border-neon-magenta/50',
  bass: 'text-neon-purple bg-neon-purple/20 border-neon-purple/50',
  melody: 'text-neon-green bg-neon-green/20 border-neon-green/50',
  full: 'text-neon-orange bg-neon-orange/20 border-neon-orange/50',
};

export const MashupBuilder = ({ elements, onRemoveElement, onUpdateElement }: MashupBuilderProps) => {
  return (
    <div className="deck-panel rounded-xl p-4 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display text-lg font-bold neon-text-purple">
          <Layers className="w-5 h-5 inline-block mr-2" />
          MASHUP BUILDER
        </h3>
        <span className="text-xs text-muted-foreground">
          {elements.length} elements
        </span>
      </div>

      {/* Elements */}
      <ScrollArea className="flex-1">
        {elements.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Layers className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No elements yet</p>
            <p className="text-xs">Add tracks from the library to build your mashup</p>
          </div>
        ) : (
          <div className="space-y-3">
            {elements.map((element) => {
              const Icon = ELEMENT_ICONS[element.type];
              return (
                <div
                  key={element.id}
                  className={cn(
                    "p-3 rounded-lg border",
                    ELEMENT_COLORS[element.type]
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-background/50">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{element.trackTitle}</div>
                      <div className="text-xs opacity-70 uppercase">{element.type}</div>
                      
                      {/* Volume Control */}
                      <div className="flex items-center gap-2 mt-2">
                        <Volume2 className="w-3 h-3 opacity-70" />
                        <Slider
                          value={[element.volume * 100]}
                          min={0}
                          max={100}
                          step={1}
                          onValueChange={([value]) => onUpdateElement(element.id, { volume: value / 100 })}
                          className="flex-1 [&_[role=slider]]:h-3 [&_[role=slider]]:w-3"
                        />
                        <span className="text-[10px] w-8">{Math.round(element.volume * 100)}%</span>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/20"
                      onClick={() => onRemoveElement(element.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </ScrollArea>

      {/* Element Type Legend */}
      <div className="mt-4 pt-4 border-t border-border">
        <div className="text-xs text-muted-foreground mb-2">Element Types</div>
        <div className="flex flex-wrap gap-2">
          {Object.entries(ELEMENT_ICONS).map(([type, Icon]) => (
            <div
              key={type}
              className={cn(
                "flex items-center gap-1 px-2 py-1 rounded text-[10px] border",
                ELEMENT_COLORS[type as keyof typeof ELEMENT_COLORS]
              )}
            >
              <Icon className="w-3 h-3" />
              {type}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
