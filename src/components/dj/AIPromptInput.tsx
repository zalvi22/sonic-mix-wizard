import { useState } from 'react';
import { Sparkles, Wand2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { DeckState, MashupElement } from '@/types/dj';

interface AIPromptInputProps {
  deckA: DeckState;
  deckB: DeckState;
  mashupElements: MashupElement[];
  onCodeGenerated: (code: string) => void;
}

const EXAMPLE_PROMPTS = [
  "Create a chill lo-fi beat with soft piano and vinyl crackle",
  "Make an energetic house track with 4-on-the-floor kick and acid bass",
  "Generate a dubstep drop with heavy wobble bass and snare rolls",
  "Create a dreamy ambient soundscape with pads and choir",
  "Build a drum and bass pattern with amen break and reese bass",
];

export const AIPromptInput = ({ deckA, deckB, mashupElements, onCodeGenerated }: AIPromptInputProps) => {
  const { toast } = useToast();
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const generateCode = async (inputPrompt: string) => {
    if (!inputPrompt.trim()) {
      toast({
        title: "Enter a description",
        description: "Describe the music you want to create",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);

    try {
      const { data, error } = await supabase.functions.invoke('generate-sonic-pi', {
        body: { 
          prompt: inputPrompt,
          deckA,
          deckB,
          mashupElements,
        },
      });

      if (error) throw error;

      if (data?.error) {
        throw new Error(data.error);
      }

      if (data?.code) {
        onCodeGenerated(data.code);
        toast({
          title: "Code generated!",
          description: "Your Sonic Pi code is ready. Copy it to Sonic Pi and hit Run!",
        });
      }
    } catch (error) {
      console.error('Generation error:', error);
      toast({
        title: "Generation failed",
        description: error instanceof Error ? error.message : "Failed to generate code",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    generateCode(prompt);
  };

  return (
    <div className="deck-panel rounded-xl p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Sparkles className="w-5 h-5 text-neon-magenta" />
        <h3 className="font-display text-lg font-bold neon-text-magenta">
          AI COMPOSER
        </h3>
      </div>

      {/* Description */}
      <p className="text-sm text-muted-foreground">
        Describe your music in plain English and AI will generate Sonic Pi code for you.
      </p>

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="space-y-3">
        <Textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="e.g., Create a funky house beat with a groovy bassline and crispy hi-hats at 124 BPM"
          className="min-h-[100px] bg-background/50 border-border/50 focus:border-neon-magenta/50 resize-none"
          disabled={isGenerating}
        />
        
        <Button
          type="submit"
          disabled={isGenerating || !prompt.trim()}
          className="w-full bg-gradient-to-r from-neon-magenta to-neon-purple hover:opacity-90"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Wand2 className="w-4 h-4 mr-2" />
              Generate Sonic Pi Code
            </>
          )}
        </Button>
      </form>

      {/* Quick Prompts */}
      <div className="space-y-2">
        <p className="text-xs text-muted-foreground font-medium">Quick ideas:</p>
        <div className="flex flex-wrap gap-2">
          {EXAMPLE_PROMPTS.map((examplePrompt, index) => (
            <button
              key={index}
              onClick={() => {
                setPrompt(examplePrompt);
                generateCode(examplePrompt);
              }}
              disabled={isGenerating}
              className="text-xs px-2 py-1 rounded-full bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors border border-border/30 hover:border-neon-magenta/30 disabled:opacity-50"
            >
              {examplePrompt.length > 40 ? examplePrompt.slice(0, 40) + '...' : examplePrompt}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
