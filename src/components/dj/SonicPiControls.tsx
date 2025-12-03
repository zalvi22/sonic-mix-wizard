import { Play, Square, Copy, Terminal, Check, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useSonicPi } from '@/hooks/useSonicPi';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';

interface SonicPiControlsProps {
  code: string;
}

export function SonicPiControls({ code }: SonicPiControlsProps) {
  const {
    isConnected,
    isPlaying,
    isDesktop,
    runCode,
    stop,
    copyCode,
    checkConnection,
  } = useSonicPi();

  const handleRun = () => {
    if (isDesktop && isConnected) {
      runCode(code);
    } else {
      copyCode(code);
    }
  };

  return (
    <div className="flex items-center gap-2">
      {/* Connection Status */}
      {isDesktop ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge 
              variant="outline" 
              className={cn(
                'cursor-pointer',
                isConnected 
                  ? 'border-neon-green/50 text-neon-green bg-neon-green/10' 
                  : 'border-border text-muted-foreground'
              )}
              onClick={checkConnection}
            >
              <div className={cn(
                'w-1.5 h-1.5 rounded-full mr-1.5',
                isConnected ? 'bg-neon-green animate-pulse' : 'bg-muted-foreground'
              )} />
              {isConnected ? 'Sonic Pi' : 'Disconnected'}
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            {isConnected 
              ? 'Connected to Sonic Pi - Click Run to play'
              : 'Open Sonic Pi to connect'}
          </TooltipContent>
        </Tooltip>
      ) : (
        <Badge variant="outline" className="border-border text-muted-foreground">
          <Terminal className="w-3 h-3 mr-1.5" />
          Manual Mode
        </Badge>
      )}

      {/* Run/Copy Button */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            size="sm"
            variant={isDesktop && isConnected ? 'default' : 'secondary'}
            onClick={handleRun}
            disabled={!code}
            className={cn(
              'gap-2',
              isDesktop && isConnected && 'bg-neon-green text-black hover:bg-neon-green/90'
            )}
          >
            {isDesktop && isConnected ? (
              <>
                <Play className="w-4 h-4" />
                Run
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                Copy
              </>
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          {isDesktop && isConnected 
            ? 'Send code to Sonic Pi and play'
            : 'Copy code to clipboard for Sonic Pi'}
        </TooltipContent>
      </Tooltip>

      {/* Stop Button (only in desktop mode when playing) */}
      {isDesktop && isConnected && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="sm"
              variant="destructive"
              onClick={stop}
              className="gap-2"
            >
              <Square className="w-4 h-4" />
              Stop
            </Button>
          </TooltipTrigger>
          <TooltipContent>Stop all sounds in Sonic Pi</TooltipContent>
        </Tooltip>
      )}
    </div>
  );
}
