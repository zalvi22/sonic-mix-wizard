-- Create storage bucket for audio files
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'audio-files',
  'audio-files',
  true,
  52428800, -- 50MB limit
  ARRAY['audio/mpeg', 'audio/wav', 'audio/mp3', 'audio/x-wav', 'audio/webm', 'audio/ogg', 'audio/flac']
);

-- Create storage bucket for separated stems
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'stems',
  'stems',
  true,
  104857600, -- 100MB limit for stems
  ARRAY['audio/mpeg', 'audio/wav', 'audio/mp3', 'audio/x-wav', 'audio/webm', 'audio/ogg', 'audio/flac']
);

-- Allow public read access to audio files
CREATE POLICY "Public read access for audio files"
ON storage.objects FOR SELECT
USING (bucket_id = 'audio-files');

-- Allow public upload to audio files (for simplicity, can be restricted later)
CREATE POLICY "Public upload access for audio files"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'audio-files');

-- Allow public read access to stems
CREATE POLICY "Public read access for stems"
ON storage.objects FOR SELECT
USING (bucket_id = 'stems');

-- Allow public upload to stems
CREATE POLICY "Public upload access for stems"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'stems');

-- Create tracks table to store track metadata
CREATE TABLE public.tracks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  artist TEXT NOT NULL DEFAULT 'Unknown Artist',
  duration INTEGER DEFAULT 0,
  bpm INTEGER,
  key TEXT,
  platform TEXT NOT NULL DEFAULT 'local',
  source_url TEXT,
  audio_file_path TEXT,
  cover_url TEXT,
  waveform JSONB,
  stems JSONB DEFAULT '{}',
  analysis_status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on tracks
ALTER TABLE public.tracks ENABLE ROW LEVEL SECURITY;

-- Allow public access to tracks (can be restricted to authenticated users later)
CREATE POLICY "Public read access for tracks"
ON public.tracks FOR SELECT
USING (true);

CREATE POLICY "Public insert access for tracks"
ON public.tracks FOR INSERT
WITH CHECK (true);

CREATE POLICY "Public update access for tracks"
ON public.tracks FOR UPDATE
USING (true);

CREATE POLICY "Public delete access for tracks"
ON public.tracks FOR DELETE
USING (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_tracks_updated_at
BEFORE UPDATE ON public.tracks
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();