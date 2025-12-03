import { useRef, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';

interface AudioVisualizerProps {
  analyserNode: AnalyserNode | null;
  isPlaying: boolean;
  color: 'cyan' | 'magenta';
  className?: string;
  height?: number;
}

const COLORS = {
  cyan: {
    primary: 'hsl(185, 100%, 50%)',
    secondary: 'hsl(185, 100%, 70%)',
    glow: 'rgba(0, 255, 255, 0.3)',
  },
  magenta: {
    primary: 'hsl(320, 100%, 60%)',
    secondary: 'hsl(320, 100%, 75%)',
    glow: 'rgba(255, 0, 128, 0.3)',
  },
};

export function AudioVisualizer({ 
  analyserNode, 
  isPlaying, 
  color, 
  className,
  height = 60 
}: AudioVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>();
  const dataArrayRef = useRef<Uint8Array | null>(null);

  // Initialize data array when analyser changes
  useEffect(() => {
    if (analyserNode) {
      dataArrayRef.current = new Uint8Array(analyserNode.frequencyBinCount);
    } else {
      dataArrayRef.current = null;
    }
  }, [analyserNode]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = container.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    
    // Set canvas size
    canvas.width = rect.width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const colorScheme = COLORS[color];

    // Clear canvas
    ctx.fillStyle = 'rgba(10, 10, 15, 0.9)';
    ctx.fillRect(0, 0, width, height);

    // Get frequency data or create idle animation
    const barCount = 64;
    const values: number[] = new Array(barCount).fill(0);
    
    if (analyserNode && dataArrayRef.current) {
      analyserNode.getByteFrequencyData(dataArrayRef.current as Uint8Array<ArrayBuffer>);
      for (let i = 0; i < Math.min(barCount, dataArrayRef.current.length); i++) {
        values[i] = dataArrayRef.current[i];
      }
    } else {
      // Idle animation when not playing
      const time = Date.now() / 1000;
      for (let i = 0; i < barCount; i++) {
        values[i] = isPlaying ? 0 : Math.sin(time * 2 + i * 0.3) * 15 + 20;
      }
    }

    // Draw frequency bars
    const barWidth = (width / barCount) - 1;
    const maxBarHeight = height - 10;

    for (let i = 0; i < barCount; i++) {
      const value = values[i] / 255;
      const barHeight = value * maxBarHeight;
      const x = i * (barWidth + 1);
      const y = height - barHeight - 5;

      // Create gradient for each bar
      const gradient = ctx.createLinearGradient(x, y + barHeight, x, y);
      gradient.addColorStop(0, colorScheme.primary);
      gradient.addColorStop(0.5, colorScheme.secondary);
      gradient.addColorStop(1, 'white');

      // Draw bar with glow
      ctx.shadowColor = colorScheme.glow;
      ctx.shadowBlur = value * 10;
      ctx.fillStyle = gradient;
      ctx.fillRect(x, y, barWidth, barHeight);

      // Draw peak indicator
      if (value > 0.7) {
        ctx.fillStyle = 'white';
        ctx.fillRect(x, y - 2, barWidth, 2);
      }
    }

    // Reset shadow
    ctx.shadowBlur = 0;

    // Draw center line
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, height / 2);
    ctx.lineTo(width, height / 2);
    ctx.stroke();

    // Continue animation
    animationRef.current = requestAnimationFrame(draw);
  }, [analyserNode, isPlaying, color, height]);

  // Start/stop animation
  useEffect(() => {
    draw();
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [draw]);

  return (
    <div 
      ref={containerRef}
      className={cn("relative w-full overflow-hidden rounded", className)}
      style={{ height }}
    >
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        style={{ width: '100%', height }}
      />
      {/* Label */}
      <div className="absolute bottom-1 right-1 text-[9px] font-mono text-white/40 uppercase">
        Spectrum
      </div>
    </div>
  );
}
