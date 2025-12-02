import React, { useState } from 'react';
import { Code, Copy, Download, RefreshCw, Sparkles, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MashupElement, DeckState } from '@/types/dj';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';

interface SonicPiGeneratorProps {
  deckA: DeckState;
  deckB: DeckState;
  mashupElements: MashupElement[];
  aiGeneratedCode?: string;
}

// Convert musical key to Sonic Pi format
const keyToSonicPi = (key: string): string => {
  return key
    .toLowerCase()
    .replace('#', 's')
    .replace('m', '')
    .trim();
};

// Get scale type based on key (minor if 'm' present)
const getScaleType = (key: string): string => {
  return key.toLowerCase().includes('m') ? ':minor' : ':major';
};

export const SonicPiGenerator = ({ deckA, deckB, mashupElements, aiGeneratedCode }: SonicPiGeneratorProps) => {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [useAICode, setUseAICode] = useState(false);

  // Auto-switch to AI code when it's received
  React.useEffect(() => {
    if (aiGeneratedCode) {
      setUseAICode(true);
    }
  }, [aiGeneratedCode]);

  const generateSonicPiCode = React.useMemo(() => {
    // Determine master BPM from deck settings
    const masterBpm = deckA.track?.bpm || deckB.track?.bpm || 120;
    const masterKey = deckA.track?.key || deckB.track?.key || 'Am';
    const rootNote = keyToSonicPi(masterKey);
    const scaleType = getScaleType(masterKey);

    const lines: string[] = [
      '# ═══════════════════════════════════════════════════════════',
      '# 🎧 SONICMIX - Auto-Generated Mashup',
      `# Generated: ${new Date().toLocaleString()}`,
      '# ═══════════════════════════════════════════════════════════',
      '#',
      '# Copy this code into Sonic Pi and press Run!',
      '# Modify values in real-time for live performance',
      '',
      '# === GLOBAL SETTINGS ===',
      `use_bpm ${masterBpm}`,
      '',
      '# Master controls - tweak these live!',
      `master_vol = ${((deckA.volume + deckB.volume) / 2).toFixed(2)}`,
      `root = :${rootNote}2`,
      `scale_type = ${scaleType}`,
      '',
    ];

    // Add deck A configuration
    if (deckA.track) {
      lines.push('# --- DECK A ---');
      lines.push(`# Track: "${deckA.track.title}" by ${deckA.track.artist}`);
      lines.push(`deck_a_vol = ${deckA.volume.toFixed(2)}`);
      lines.push(`deck_a_rate = ${deckA.speed.toFixed(2)}`);
      lines.push(`deck_a_pitch = ${deckA.pitch}`);
      lines.push('');
    }

    // Add deck B configuration  
    if (deckB.track) {
      lines.push('# --- DECK B ---');
      lines.push(`# Track: "${deckB.track.title}" by ${deckB.track.artist}`);
      lines.push(`deck_b_vol = ${deckB.volume.toFixed(2)}`);
      lines.push(`deck_b_rate = ${deckB.speed.toFixed(2)}`);
      lines.push(`deck_b_pitch = ${deckB.pitch}`);
      lines.push('');
    }

    // Add mashup elements as comments
    if (mashupElements.length > 0) {
      lines.push('# === MASHUP ELEMENTS ===');
      mashupElements.forEach((element, index) => {
        lines.push(`# ${index + 1}. ${element.trackTitle} (${element.type}) - vol: ${element.volume.toFixed(2)}`);
      });
      lines.push('');
    }

    // Generate the main beat/drums loop
    lines.push('# ═══════════════════════════════════════════════════════════');
    lines.push('# LIVE LOOPS - These run concurrently and sync together');
    lines.push('# ═══════════════════════════════════════════════════════════');
    lines.push('');

    // Kick drum pattern
    lines.push('live_loop :kick do');
    lines.push('  sample :bd_haus, amp: master_vol * 1.2, cutoff: 100');
    lines.push('  sleep 1');
    lines.push('end');
    lines.push('');

    // Snare with variation
    lines.push('live_loop :snare do');
    lines.push('  sync :kick');
    lines.push('  sleep 1');
    lines.push('  sample :sn_dub, amp: master_vol * 0.8');
    lines.push('  sleep 1');
    lines.push('end');
    lines.push('');

    // Hi-hats with shuffle
    lines.push('live_loop :hats do');
    lines.push('  sync :kick');
    lines.push('  8.times do');
    lines.push('    sample :drum_cymbal_closed, amp: master_vol * rrand(0.2, 0.4)');
    lines.push('    sleep 0.5');
    lines.push('  end');
    lines.push('end');
    lines.push('');

    // Bass line using TB-303 emulation
    lines.push('live_loop :bass do');
    lines.push('  sync :kick');
    lines.push('  use_synth :tb303');
    lines.push('  use_synth_defaults cutoff: rrand(60, 100), release: 0.2, env_curve: 3');
    lines.push('  notes = (scale root, scale_type, num_octaves: 1).shuffle');
    lines.push('  16.times do');
    lines.push(`    play notes.tick, amp: master_vol * ${deckA.track ? deckA.volume.toFixed(2) : '0.5'}`);
    lines.push('    sleep 0.25');
    lines.push('  end');
    lines.push('end');
    lines.push('');

    // Melodic element based on deck settings
    if (deckA.track || deckB.track) {
      lines.push('live_loop :melody do');
      lines.push('  sync :kick');
      lines.push('  use_synth :prophet');
      lines.push('  use_synth_defaults cutoff: 90, release: 0.5, amp: master_vol * 0.4');
      lines.push('  notes = (scale root + 12, scale_type, num_octaves: 2)');
      lines.push('  8.times do');
      lines.push('    play notes.choose if one_in(2)');
      lines.push('    sleep [0.5, 0.25, 0.25].choose');
      lines.push('  end');
      lines.push('end');
      lines.push('');
    }

    // Add pad/atmosphere
    lines.push('live_loop :pad do');
    lines.push('  sync :kick');
    lines.push('  use_synth :hollow');
    lines.push('  with_fx :reverb, room: 0.8, mix: 0.7 do');
    lines.push('    play_chord (chord root + 12, :minor7), amp: master_vol * 0.3, attack: 2, release: 4');
    lines.push('  end');
    lines.push('  sleep 8');
    lines.push('end');
    lines.push('');

    // Generate mashup-specific loops based on elements
    const drumElements = mashupElements.filter(e => e.type === 'drums');
    const vocalElements = mashupElements.filter(e => e.type === 'vocals');
    const bassElements = mashupElements.filter(e => e.type === 'bass');
    const melodyElements = mashupElements.filter(e => e.type === 'melody');

    if (drumElements.length > 0) {
      lines.push('# --- MASHUP: Additional Drums ---');
      lines.push('live_loop :mashup_drums do');
      lines.push('  sync :kick');
      lines.push('  with_fx :slicer, phase: [0.125, 0.25].choose, wave: 0 do');
      lines.push(`    sample :loop_amen, beat_stretch: 4, amp: ${drumElements[0].volume.toFixed(2)}`);
      lines.push('  end');
      lines.push('  sleep 4');
      lines.push('end');
      lines.push('');
    }

    if (vocalElements.length > 0) {
      lines.push('# --- MASHUP: Vocal Chops ---');
      lines.push('live_loop :mashup_vocals do');
      lines.push('  sync :kick');
      lines.push('  with_fx :echo, phase: 0.375, decay: 2, mix: 0.4 do');
      lines.push(`    sample :ambi_choir, rate: [0.5, 1, -0.5].choose, amp: ${vocalElements[0].volume.toFixed(2)}`);
      lines.push('  end');
      lines.push('  sleep [4, 8].choose');
      lines.push('end');
      lines.push('');
    }

    if (bassElements.length > 0) {
      lines.push('# --- MASHUP: Sub Bass Layer ---');
      lines.push('live_loop :mashup_sub do');
      lines.push('  sync :kick');
      lines.push('  use_synth :dsaw');
      lines.push('  use_synth_defaults cutoff: 50, release: 0.3');
      lines.push(`    play root - 12, amp: ${bassElements[0].volume.toFixed(2)}`);
      lines.push('  sleep 2');
      lines.push('end');
      lines.push('');
    }

    if (melodyElements.length > 0) {
      lines.push('# --- MASHUP: Arp Layer ---');
      lines.push('live_loop :mashup_arp do');
      lines.push('  sync :kick');
      lines.push('  use_synth :blade');
      lines.push('  use_synth_defaults vibrato_rate: 6, vibrato_depth: 0.1');
      lines.push('  notes = (scale root + 24, scale_type).shuffle.take(8)');
      lines.push('  notes.each do |n|');
      lines.push(`    play n, release: 0.1, amp: ${melodyElements[0].volume.toFixed(2)} * 0.5`);
      lines.push('    sleep 0.125');
      lines.push('  end');
      lines.push('end');
      lines.push('');
    }

    // Effects section based on deck effects
    const hasEffects = deckA.effects.reverb > 0 || deckA.effects.delay > 0 || 
                       deckB.effects.reverb > 0 || deckB.effects.delay > 0;

    if (hasEffects) {
      lines.push('# === GLOBAL EFFECTS ===');
      lines.push('# Wrap any loop above with these for effect processing');
      lines.push('#');
      
      const reverbAmt = Math.max(deckA.effects.reverb, deckB.effects.reverb);
      const delayAmt = Math.max(deckA.effects.delay, deckB.effects.delay);
      
      if (reverbAmt > 0) {
        lines.push(`# with_fx :reverb, room: ${(reverbAmt / 100).toFixed(2)}, mix: 0.5 do`);
        lines.push('#   # your loop here');
        lines.push('# end');
      }
      if (delayAmt > 0) {
        lines.push(`# with_fx :echo, phase: 0.25, decay: ${(delayAmt / 50).toFixed(1)}, mix: 0.4 do`);
        lines.push('#   # your loop here');
        lines.push('# end');
      }
      lines.push('');
    }

    // Add performance tips
    lines.push('# ═══════════════════════════════════════════════════════════');
    lines.push('# PERFORMANCE TIPS');
    lines.push('# ═══════════════════════════════════════════════════════════');
    lines.push('# • Change master_vol to control overall volume (0.0 - 1.0)');
    lines.push('# • Change root to shift key (e.g., :c2, :d2, :e2)');
    lines.push('# • Change scale_type to :major, :minor, :minor_pentatonic');
    lines.push('# • Comment out live_loops with # to mute them');
    lines.push('# • Add "stop" inside a loop to stop just that loop');
    lines.push('# • Press Run again to hot-swap changes live!');

    return lines.join('\n');
  }, [deckA, deckB, mashupElements]);

  // Use AI-generated code if available and enabled, otherwise use default generator
  const code = (useAICode && aiGeneratedCode) ? aiGeneratedCode : generateSonicPiCode;

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
    a.download = `sonicmix_mashup_${Date.now()}.rb`;
    a.click();
    URL.revokeObjectURL(url);
    toast({
      title: "Downloaded!",
      description: "Open the .rb file in Sonic Pi to play your mashup",
    });
  };

  return (
    <div className="deck-panel rounded-xl p-4 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display text-lg font-bold neon-text-green">
          <Code className="w-5 h-5 inline-block mr-2" />
          {useAICode && aiGeneratedCode ? 'AI GENERATED' : 'SONIC PI CODE'}
        </h3>
        <div className="flex items-center gap-2">
          {aiGeneratedCode && (
            <Button
              variant={useAICode ? "default" : "ghost"}
              size="icon"
              className={cn("h-8 w-8", useAICode && "bg-neon-magenta/20 text-neon-magenta")}
              onClick={() => setUseAICode(!useAICode)}
              title={useAICode ? "Show default code" : "Show AI code"}
            >
              <Sparkles className="w-4 h-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => {
              setIsGenerating(true);
              setTimeout(() => setIsGenerating(false), 500);
              if (useAICode) setUseAICode(false);
            }}
            title="Regenerate default"
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
