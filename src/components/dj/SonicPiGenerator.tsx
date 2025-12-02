import { useState } from 'react';
import { Code, Copy, Download, Play, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MashupElement, DeckState } from '@/types/dj';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';

interface SonicPiGeneratorProps {
  deckA: DeckState;
  deckB: DeckState;
  mashupElements: MashupElement[];
}

export const SonicPiGenerator = ({ deckA, deckB, mashupElements }: SonicPiGeneratorProps) => {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);

  const generateSonicPiCode = () => {
    setIsGenerating(true);
    
    // Simulate generation delay
    setTimeout(() => {
      setIsGenerating(false);
    }, 500);

    const lines: string[] = [
      '# 🎧 Auto-Generated Sonic Pi Mashup',
      `# Generated: ${new Date().toLocaleString()}`,
      '#',
      '# This code creates a mashup based on your deck settings',
      '# Copy this into Sonic Pi and press Run!',
      '',
      '# === CONFIGURATION ===',
      'use_bpm 120',
      '',
    ];

    // Add deck configurations
    if (deckA.track) {
      lines.push(`# Deck A: ${deckA.track.title} by ${deckA.track.artist}`);
      lines.push(`deck_a_bpm = ${deckA.track.bpm}`);
      lines.push(`deck_a_key = :${deckA.track.key.toLowerCase().replace('#', 's')}`);
      lines.push(`deck_a_volume = ${deckA.volume.toFixed(2)}`);
      lines.push(`deck_a_speed = ${deckA.speed.toFixed(2)}`);
      lines.push('');
    }

    if (deckB.track) {
      lines.push(`# Deck B: ${deckB.track.title} by ${deckB.track.artist}`);
      lines.push(`deck_b_bpm = ${deckB.track.bpm}`);
      lines.push(`deck_b_key = :${deckB.track.key.toLowerCase().replace('#', 's')}`);
      lines.push(`deck_b_volume = ${deckB.volume.toFixed(2)}`);
      lines.push(`deck_b_speed = ${deckB.speed.toFixed(2)}`);
      lines.push('');
    }

    // Add mashup elements
    if (mashupElements.length > 0) {
      lines.push('# === MASHUP ELEMENTS ===');
      mashupElements.forEach((element, index) => {
        lines.push(`# Element ${index + 1}: ${element.trackTitle} (${element.type})`);
        lines.push(`element_${index + 1}_volume = ${element.volume.toFixed(2)}`);
      });
      lines.push('');
    }

    // Generate live loops
    lines.push('# === LIVE LOOPS ===');
    lines.push('');

    // Drums loop
    lines.push('live_loop :drums do');
    lines.push('  sample :bd_haus, amp: 0.8');
    lines.push('  sleep 1');
    lines.push('  sample :sn_dub, amp: 0.6');
    lines.push('  sleep 1');
    lines.push('end');
    lines.push('');

    // Hi-hats
    lines.push('live_loop :hats do');
    lines.push('  sample :drum_cymbal_closed, amp: 0.3');
    lines.push('  sleep 0.5');
    lines.push('end');
    lines.push('');

    // Bass
    lines.push('live_loop :bass do');
    lines.push('  use_synth :tb303');
    lines.push('  use_synth_defaults cutoff: 80, release: 0.2');
    lines.push('  notes = (scale :e2, :minor_pentatonic).shuffle');
    lines.push('  play notes.tick, amp: 0.5');
    lines.push('  sleep 0.25');
    lines.push('end');
    lines.push('');

    // Melody based on deck settings
    if (deckA.track || deckB.track) {
      lines.push('live_loop :melody do');
      lines.push('  use_synth :prophet');
      lines.push('  use_synth_defaults cutoff: 90, release: 0.5');
      const key = deckA.track?.key || deckB.track?.key || 'Am';
      lines.push(`  notes = (scale :${key.toLowerCase().replace('#', 's').replace('m', '')}3, :minor)`);
      lines.push('  play notes.choose, amp: 0.4');
      lines.push('  sleep [0.5, 1, 0.25].choose');
      lines.push('end');
      lines.push('');
    }

    // Add effects
    lines.push('# === EFFECTS ===');
    lines.push('with_fx :reverb, room: 0.6 do');
    lines.push('  with_fx :echo, phase: 0.375, decay: 4 do');
    lines.push('    # Your live loops above will have these effects');
    lines.push('  end');
    lines.push('end');

    return lines.join('\n');
  };

  const code = generateSonicPiCode();

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(code);
    toast({
      title: "Copied to clipboard!",
      description: "Paste this code into Sonic Pi and hit Run",
    });
  };

  const downloadCode = () => {
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mashup_${Date.now()}.rb`;
    a.click();
    URL.revokeObjectURL(url);
    toast({
      title: "Downloaded!",
      description: "Open the file in Sonic Pi to play your mashup",
    });
  };

  return (
    <div className="deck-panel rounded-xl p-4 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display text-lg font-bold neon-text-green">
          <Code className="w-5 h-5 inline-block mr-2" />
          SONIC PI CODE
        </h3>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setIsGenerating(true)}
            title="Regenerate"
          >
            <RefreshCw className={cn("w-4 h-4", isGenerating && "animate-spin")} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={copyToClipboard}
            title="Copy to clipboard"
          >
            <Copy className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={downloadCode}
            title="Download"
          >
            <Download className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Code Display */}
      <ScrollArea className="flex-1 code-block rounded-lg p-4">
        <pre className="text-xs text-neon-green/90 whitespace-pre-wrap font-mono">
          {code}
        </pre>
      </ScrollArea>

      {/* Instructions */}
      <div className="mt-4 p-3 rounded-lg bg-muted/50 border border-border">
        <div className="text-xs text-muted-foreground">
          <strong className="text-foreground">How to use:</strong>
          <ol className="mt-2 space-y-1 list-decimal list-inside">
            <li>Copy the code above</li>
            <li>Open Sonic Pi on your computer</li>
            <li>Paste the code into a buffer</li>
            <li>Press Run to play your mashup!</li>
          </ol>
        </div>
      </div>
    </div>
  );
};
