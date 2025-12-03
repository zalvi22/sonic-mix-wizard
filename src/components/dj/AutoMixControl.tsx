import { Wand2, Settings2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface AutoMixControlProps {
  isEnabled: boolean;
  currentTransition: 'none' | 'a-to-b' | 'b-to-a';
  transitionProgress: number;
  options: {
    transitionDuration: number;
    transitionStyle: 'crossfade' | 'cut' | 'echo-out';
    cuePoint: number;
    beatMatch: boolean;
  };
  onToggle: () => void;
  onSetOptions: (options: Partial<AutoMixControlProps['options']>) => void;
}

export function AutoMixControl({
  isEnabled,
  currentTransition,
  transitionProgress,
  options,
  onToggle,
  onSetOptions,
}: AutoMixControlProps) {
  const isTransitioning = currentTransition !== 'none';
  
  return (
    <div className="flex items-center gap-2">
      {/* Main Toggle */}
      <Button
        variant={isEnabled ? 'default' : 'outline'}
        size="sm"
        onClick={onToggle}
        className={cn(
          'gap-2 transition-all',
          isEnabled && 'bg-neon-purple text-white hover:bg-neon-purple/90'
        )}
      >
        <Wand2 className={cn('w-4 h-4', isEnabled && 'animate-pulse')} />
        <span className="hidden sm:inline">Auto Mix</span>
      </Button>
      
      {/* Transition Progress */}
      {isTransitioning && (
        <div className="flex items-center gap-2 px-2 py-1 rounded bg-muted/50">
          <span className="text-[10px] text-muted-foreground uppercase">
            {currentTransition === 'a-to-b' ? 'A → B' : 'B → A'}
          </span>
          <Progress value={transitionProgress * 100} className="w-16 h-1.5" />
        </div>
      )}
      
      {/* Settings Popover */}
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Settings2 className="w-4 h-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-72" align="end">
          <div className="space-y-4">
            <h4 className="font-medium text-sm">Auto Mix Settings</h4>
            
            {/* Transition Duration */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs">Transition Length</Label>
                <span className="text-xs text-muted-foreground">{options.transitionDuration} beats</span>
              </div>
              <Slider
                value={[options.transitionDuration]}
                min={4}
                max={64}
                step={4}
                onValueChange={([value]) => onSetOptions({ transitionDuration: value })}
              />
            </div>
            
            {/* Cue Point */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs">Start Transition At</Label>
                <span className="text-xs text-muted-foreground">{Math.round(options.cuePoint * 100)}%</span>
              </div>
              <Slider
                value={[options.cuePoint * 100]}
                min={50}
                max={95}
                step={5}
                onValueChange={([value]) => onSetOptions({ cuePoint: value / 100 })}
              />
            </div>
            
            {/* Transition Style */}
            <div className="space-y-2">
              <Label className="text-xs">Transition Style</Label>
              <Select
                value={options.transitionStyle}
                onValueChange={(value) => onSetOptions({ transitionStyle: value as 'crossfade' | 'cut' | 'echo-out' })}
              >
                <SelectTrigger className="h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="crossfade">Crossfade</SelectItem>
                  <SelectItem value="cut">Hard Cut</SelectItem>
                  <SelectItem value="echo-out">Echo Out</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
