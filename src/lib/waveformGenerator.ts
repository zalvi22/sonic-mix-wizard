/**
 * Waveform Generator - Creates Rekordbox-style waveform data from audio
 * Uses Web Audio API to analyze frequency content and generate colored waveforms
 */

export interface WaveformPoint {
  low: number;    // Low frequency amplitude (bass - red/orange)
  mid: number;    // Mid frequency amplitude (green)
  high: number;   // High frequency amplitude (cyan/blue)
  peak: number;   // Overall peak value
}

export interface WaveformData {
  version: number;
  sampleRate: number;
  samplesPerPoint: number;
  length: number;
  duration: number;
  points: WaveformPoint[];
}

const DEFAULT_POINTS_PER_SECOND = 150; // High resolution like Rekordbox

/**
 * Analyze audio buffer and extract frequency-separated waveform data
 */
export async function generateWaveformFromAudioBuffer(
  audioBuffer: AudioBuffer,
  pointsPerSecond: number = DEFAULT_POINTS_PER_SECOND
): Promise<WaveformData> {
  const sampleRate = audioBuffer.sampleRate;
  const duration = audioBuffer.duration;
  const totalPoints = Math.ceil(duration * pointsPerSecond);
  const samplesPerPoint = Math.floor(audioBuffer.length / totalPoints);
  
  // Get mono channel data (mix down if stereo)
  const channelData = getMixedChannelData(audioBuffer);
  
  // Create offline context for frequency analysis
  const offlineContext = new OfflineAudioContext(1, audioBuffer.length, sampleRate);
  
  // Create filters for frequency separation
  const points: WaveformPoint[] = [];
  
  // Process in chunks to get frequency-separated data
  for (let i = 0; i < totalPoints; i++) {
    const startSample = i * samplesPerPoint;
    const endSample = Math.min(startSample + samplesPerPoint, channelData.length);
    const chunk = channelData.slice(startSample, endSample);
    
    const point = analyzeChunk(chunk, sampleRate);
    points.push(point);
  }
  
  // Normalize the data
  normalizeWaveformData(points);
  
  return {
    version: 2,
    sampleRate,
    samplesPerPoint,
    length: totalPoints,
    duration,
    points,
  };
}

/**
 * Generate waveform from audio URL
 */
export async function generateWaveformFromUrl(
  url: string,
  pointsPerSecond: number = DEFAULT_POINTS_PER_SECOND
): Promise<WaveformData> {
  const audioContext = new AudioContext();
  
  try {
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    
    return generateWaveformFromAudioBuffer(audioBuffer, pointsPerSecond);
  } finally {
    await audioContext.close();
  }
}

/**
 * Generate waveform from File object
 */
export async function generateWaveformFromFile(
  file: File,
  pointsPerSecond: number = DEFAULT_POINTS_PER_SECOND
): Promise<WaveformData> {
  const audioContext = new AudioContext();
  
  try {
    const arrayBuffer = await file.arrayBuffer();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    
    return generateWaveformFromAudioBuffer(audioBuffer, pointsPerSecond);
  } finally {
    await audioContext.close();
  }
}

/**
 * Mix stereo channels to mono
 */
function getMixedChannelData(audioBuffer: AudioBuffer): Float32Array {
  const numChannels = audioBuffer.numberOfChannels;
  const length = audioBuffer.length;
  const mixed = new Float32Array(length);
  
  for (let ch = 0; ch < numChannels; ch++) {
    const channelData = audioBuffer.getChannelData(ch);
    for (let i = 0; i < length; i++) {
      mixed[i] += channelData[i] / numChannels;
    }
  }
  
  return mixed;
}

/**
 * Analyze a chunk of audio samples and separate by frequency bands
 * Using a simple but effective approach with rolling averages and peak detection
 */
function analyzeChunk(samples: Float32Array, sampleRate: number): WaveformPoint {
  if (samples.length === 0) {
    return { low: 0, mid: 0, high: 0, peak: 0 };
  }
  
  // Calculate overall peak
  let peak = 0;
  for (let i = 0; i < samples.length; i++) {
    const abs = Math.abs(samples[i]);
    if (abs > peak) peak = abs;
  }
  
  // Simple frequency band estimation using zero-crossing rate and energy
  // Higher zero-crossing rate = more high frequency content
  let zeroCrossings = 0;
  let energy = 0;
  let lowEnergy = 0;
  let highEnergy = 0;
  
  // Simple low-pass and high-pass estimation
  let prevSample = 0;
  let lowPassPrev = 0;
  const lowPassAlpha = 0.1; // Low-pass filter coefficient (for bass)
  const highPassAlpha = 0.9; // High-pass filter coefficient (for highs)
  
  for (let i = 0; i < samples.length; i++) {
    const sample = samples[i];
    const absSample = Math.abs(sample);
    
    energy += absSample;
    
    // Count zero crossings
    if ((prevSample >= 0 && sample < 0) || (prevSample < 0 && sample >= 0)) {
      zeroCrossings++;
    }
    
    // Simple low-pass filter for bass
    const lowPassed = lowPassPrev + lowPassAlpha * (sample - lowPassPrev);
    lowEnergy += Math.abs(lowPassed);
    lowPassPrev = lowPassed;
    
    // High-pass is the difference
    const highPassed = sample - lowPassed;
    highEnergy += Math.abs(highPassed);
    
    prevSample = sample;
  }
  
  const avgEnergy = energy / samples.length;
  const zeroCrossingRate = zeroCrossings / samples.length;
  
  // Normalize energies
  const normalizedLow = lowEnergy / samples.length;
  const normalizedHigh = highEnergy / samples.length;
  
  // Estimate mid as the remainder
  const normalizedMid = Math.max(0, avgEnergy - (normalizedLow + normalizedHigh) * 0.5);
  
  // Apply zero-crossing rate to shift energy distribution
  // More zero crossings = more high frequency content
  const highBoost = Math.min(zeroCrossingRate * 10, 2);
  const lowBoost = Math.max(2 - zeroCrossingRate * 10, 0.5);
  
  return {
    low: normalizedLow * lowBoost,
    mid: normalizedMid,
    high: normalizedHigh * highBoost,
    peak,
  };
}

/**
 * Normalize waveform data to 0-1 range
 */
function normalizeWaveformData(points: WaveformPoint[]): void {
  let maxLow = 0, maxMid = 0, maxHigh = 0, maxPeak = 0;
  
  for (const p of points) {
    if (p.low > maxLow) maxLow = p.low;
    if (p.mid > maxMid) maxMid = p.mid;
    if (p.high > maxHigh) maxHigh = p.high;
    if (p.peak > maxPeak) maxPeak = p.peak;
  }
  
  // Normalize each band independently for better visual separation
  for (const p of points) {
    p.low = maxLow > 0 ? p.low / maxLow : 0;
    p.mid = maxMid > 0 ? p.mid / maxMid : 0;
    p.high = maxHigh > 0 ? p.high / maxHigh : 0;
    p.peak = maxPeak > 0 ? p.peak / maxPeak : 0;
  }
}

/**
 * Convert WaveformData to simple number array for backward compatibility
 */
export function waveformDataToArray(data: WaveformData): number[] {
  return data.points.map(p => p.peak);
}

/**
 * Create a simplified waveform for quick preview (lower resolution)
 */
export function createPreviewWaveform(data: WaveformData, targetPoints: number = 200): WaveformPoint[] {
  const ratio = Math.ceil(data.points.length / targetPoints);
  const preview: WaveformPoint[] = [];
  
  for (let i = 0; i < data.points.length; i += ratio) {
    const chunk = data.points.slice(i, Math.min(i + ratio, data.points.length));
    const avgPoint: WaveformPoint = {
      low: chunk.reduce((sum, p) => sum + p.low, 0) / chunk.length,
      mid: chunk.reduce((sum, p) => sum + p.mid, 0) / chunk.length,
      high: chunk.reduce((sum, p) => sum + p.high, 0) / chunk.length,
      peak: Math.max(...chunk.map(p => p.peak)),
    };
    preview.push(avgPoint);
  }
  
  return preview;
}
