import { useEffect, useRef, useMemo } from 'react';
import { cn } from '@/lib/utils';

interface WaveformProps {
  data?: number[];
  position: number;
  isPlaying: boolean;
  color: 'cyan' | 'magenta';
  className?: string;
}

export const Waveform = ({ data, position, isPlaying, color, className }: WaveformProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Generate mock waveform data if none provided
  const waveformData = useMemo(() => {
    if (data && data.length > 0) return data;
    return Array.from({ length: 200 }, () => Math.random() * 0.8 + 0.2);
  }, [data]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const barWidth = width / waveformData.length;
    const positionX = position * width;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Draw waveform bars
    waveformData.forEach((value, index) => {
      const x = index * barWidth;
      const barHeight = value * height * 0.8;
      const y = (height - barHeight) / 2;

      // Color based on position
      const isPast = x < positionX;
      const primaryColor = color === 'cyan' ? 'hsl(185, 100%, 50%)' : 'hsl(320, 100%, 60%)';
      const dimColor = color === 'cyan' ? 'hsl(185, 100%, 25%)' : 'hsl(320, 100%, 30%)';

      ctx.fillStyle = isPast ? dimColor : primaryColor;
      ctx.fillRect(x, y, barWidth - 1, barHeight);
    });

    // Draw position indicator
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(positionX - 1, 0, 2, height);

    // Draw glow effect at position
    const gradient = ctx.createLinearGradient(positionX - 20, 0, positionX + 20, 0);
    gradient.addColorStop(0, 'transparent');
    gradient.addColorStop(0.5, color === 'cyan' ? 'rgba(0, 255, 255, 0.3)' : 'rgba(255, 0, 128, 0.3)');
    gradient.addColorStop(1, 'transparent');
    ctx.fillStyle = gradient;
    ctx.fillRect(positionX - 20, 0, 40, height);

  }, [waveformData, position, color]);

  return (
    <div className={cn("waveform-container rounded-lg overflow-hidden", className)}>
      <canvas 
        ref={canvasRef} 
        width={800} 
        height={100}
        className="w-full h-full"
      />
    </div>
  );
};
