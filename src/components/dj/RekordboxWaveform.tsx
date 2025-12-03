import React, { useRef, useEffect, useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { WaveformData, WaveformPoint } from '@/lib/waveformGenerator';

interface RekordboxWaveformProps {
  waveformData?: WaveformData | null;
  duration: number;
  position: number;
  isPlaying?: boolean;
  onSeek?: (position: number) => void;
  height?: number;
  className?: string;
  showTimeline?: boolean;
  colorMode?: 'frequency' | 'solid' | 'gradient';
}

// Rekordbox-style color scheme
const COLORS = {
  low: { r: 255, g: 80, b: 50 },    // Red/Orange for bass
  mid: { r: 50, g: 255, b: 100 },   // Green for mids
  high: { r: 50, g: 200, b: 255 },  // Cyan/Blue for highs
  background: '#0a0a0f',
  grid: 'rgba(255, 255, 255, 0.08)',
  playhead: '#ffffff',
  playheadGlow: 'rgba(255, 255, 255, 0.6)',
};

export function RekordboxWaveform({
  waveformData,
  duration,
  position,
  isPlaying = false,
  onSeek,
  height = 80,
  className,
  showTimeline = true,
  colorMode = 'frequency',
}: RekordboxWaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const animationRef = useRef<number>();
  const [hovering, setHovering] = useState(false);
  const [hoverPosition, setHoverPosition] = useState(0);

  // Handle resize
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setDimensions({
          width: entry.contentRect.width,
          height: height,
        });
      }
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, [height]);

  // Render waveform
  const renderWaveform = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || dimensions.width === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height } = dimensions;
    const dpr = window.devicePixelRatio || 1;

    // Set canvas size with DPR
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    // Clear canvas
    ctx.fillStyle = COLORS.background;
    ctx.fillRect(0, 0, width, height);

    // Draw grid
    if (showTimeline) {
      drawGrid(ctx, width, height, duration);
    }

    // Draw waveform
    if (waveformData && waveformData.points.length > 0) {
      drawWaveformBars(ctx, waveformData.points, width, height, colorMode);
    } else {
      // Draw placeholder
      drawPlaceholderWaveform(ctx, width, height);
    }

    // Draw playhead
    if (duration > 0) {
      const playheadX = (position / duration) * width;
      drawPlayhead(ctx, playheadX, height);
    }

    // Draw hover indicator
    if (hovering && onSeek) {
      const hoverX = hoverPosition * width;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(hoverX, 0);
      ctx.lineTo(hoverX, height);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }, [waveformData, dimensions, position, duration, showTimeline, colorMode, hovering, hoverPosition, onSeek]);

  // Animation loop
  useEffect(() => {
    const animate = () => {
      renderWaveform();
      animationRef.current = requestAnimationFrame(animate);
    };

    if (isPlaying) {
      animate();
    } else {
      renderWaveform();
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [renderWaveform, isPlaying]);

  // Handle click to seek
  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!onSeek || duration === 0) return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const seekPosition = (x / rect.width) * duration;
    onSeek(Math.max(0, Math.min(duration, seekPosition)));
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!onSeek) return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    setHoverPosition(x / rect.width);
  };

  return (
    <div 
      ref={containerRef} 
      className={cn("relative w-full overflow-hidden rounded", className)}
      style={{ height }}
    >
      <canvas
        ref={canvasRef}
        className={cn(
          "w-full h-full",
          onSeek && "cursor-pointer"
        )}
        style={{ width: dimensions.width, height: dimensions.height }}
        onClick={handleClick}
        onMouseEnter={() => setHovering(true)}
        onMouseLeave={() => setHovering(false)}
        onMouseMove={handleMouseMove}
      />
      
      {/* Time display overlay */}
      {showTimeline && duration > 0 && (
        <div className="absolute bottom-1 left-1 text-[10px] font-mono text-white/60 bg-black/40 px-1 rounded">
          {formatTime(position)} / {formatTime(duration)}
        </div>
      )}
    </div>
  );
}

function drawGrid(ctx: CanvasRenderingContext2D, width: number, height: number, duration: number) {
  ctx.strokeStyle = COLORS.grid;
  ctx.lineWidth = 1;

  // Vertical grid lines (time markers)
  const interval = getTimeInterval(duration, width);
  const numLines = Math.ceil(duration / interval);

  for (let i = 0; i <= numLines; i++) {
    const x = (i * interval / duration) * width;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }

  // Center line
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.beginPath();
  ctx.moveTo(0, height / 2);
  ctx.lineTo(width, height / 2);
  ctx.stroke();
}

function drawWaveformBars(
  ctx: CanvasRenderingContext2D,
  points: WaveformPoint[],
  width: number,
  height: number,
  colorMode: 'frequency' | 'solid' | 'gradient'
) {
  const barWidth = Math.max(1, width / points.length);
  const centerY = height / 2;
  const maxBarHeight = height * 0.45;

  for (let i = 0; i < points.length; i++) {
    const point = points[i];
    const x = (i / points.length) * width;
    const barHeight = point.peak * maxBarHeight;

    if (colorMode === 'frequency') {
      // Draw stacked frequency bands (Rekordbox style)
      const lowHeight = point.low * barHeight;
      const midHeight = point.mid * barHeight * 0.8;
      const highHeight = point.high * barHeight * 0.6;

      // Draw low (bass) - bottom
      ctx.fillStyle = `rgba(${COLORS.low.r}, ${COLORS.low.g}, ${COLORS.low.b}, 0.9)`;
      ctx.fillRect(x, centerY - lowHeight, barWidth, lowHeight * 2);

      // Draw mid - middle layer
      ctx.fillStyle = `rgba(${COLORS.mid.r}, ${COLORS.mid.g}, ${COLORS.mid.b}, 0.7)`;
      ctx.fillRect(x, centerY - midHeight, barWidth, midHeight * 2);

      // Draw high - top layer (brightest)
      ctx.fillStyle = `rgba(${COLORS.high.r}, ${COLORS.high.g}, ${COLORS.high.b}, 0.8)`;
      ctx.fillRect(x, centerY - highHeight, barWidth, highHeight * 2);
    } else if (colorMode === 'gradient') {
      // Gradient from bottom to top
      const gradient = ctx.createLinearGradient(x, centerY + barHeight, x, centerY - barHeight);
      gradient.addColorStop(0, `rgba(${COLORS.low.r}, ${COLORS.low.g}, ${COLORS.low.b}, 0.8)`);
      gradient.addColorStop(0.5, `rgba(${COLORS.mid.r}, ${COLORS.mid.g}, ${COLORS.mid.b}, 0.8)`);
      gradient.addColorStop(1, `rgba(${COLORS.high.r}, ${COLORS.high.g}, ${COLORS.high.b}, 0.8)`);
      ctx.fillStyle = gradient;
      ctx.fillRect(x, centerY - barHeight, barWidth, barHeight * 2);
    } else {
      // Solid color (cyan)
      ctx.fillStyle = `rgba(${COLORS.high.r}, ${COLORS.high.g}, ${COLORS.high.b}, 0.8)`;
      ctx.fillRect(x, centerY - barHeight, barWidth, barHeight * 2);
    }
  }
}

function drawPlaceholderWaveform(ctx: CanvasRenderingContext2D, width: number, height: number) {
  const centerY = height / 2;
  const numBars = 100;
  const barWidth = width / numBars;

  ctx.fillStyle = 'rgba(100, 100, 100, 0.3)';

  for (let i = 0; i < numBars; i++) {
    const x = i * barWidth;
    // Generate a pseudo-random but consistent pattern
    const h = (Math.sin(i * 0.3) * 0.3 + Math.sin(i * 0.7) * 0.2 + 0.5) * (height * 0.3);
    ctx.fillRect(x, centerY - h, barWidth - 1, h * 2);
  }
}

function drawPlayhead(ctx: CanvasRenderingContext2D, x: number, height: number) {
  // Glow effect
  ctx.shadowColor = COLORS.playheadGlow;
  ctx.shadowBlur = 8;
  
  ctx.strokeStyle = COLORS.playhead;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x, 0);
  ctx.lineTo(x, height);
  ctx.stroke();

  // Triangle marker at top
  ctx.fillStyle = COLORS.playhead;
  ctx.beginPath();
  ctx.moveTo(x - 5, 0);
  ctx.lineTo(x + 5, 0);
  ctx.lineTo(x, 8);
  ctx.closePath();
  ctx.fill();

  ctx.shadowBlur = 0;
}

function getTimeInterval(duration: number, width: number): number {
  // Determine appropriate time interval based on duration
  const targetIntervals = width / 80; // Roughly one marker every 80px
  const intervalSeconds = duration / targetIntervals;

  if (intervalSeconds <= 1) return 1;
  if (intervalSeconds <= 5) return 5;
  if (intervalSeconds <= 10) return 10;
  if (intervalSeconds <= 30) return 30;
  if (intervalSeconds <= 60) return 60;
  return 120;
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
