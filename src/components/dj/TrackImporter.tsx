import { useState, useRef } from 'react';
import { Upload, Link, Loader2, Music, X, Scissors, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Progress } from '@/components/ui/progress';
import { useLocalDownloader } from './DownloaderSetupBanner';
import { generateWaveformFromFile, WaveformData } from '@/lib/waveformGenerator';

interface TrackImporterProps {
  onTrackImported: (track: any) => void;
}

export const TrackImporter = ({ onTrackImported }: TrackImporterProps) => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [url, setUrl] = useState('');
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadStatus, setDownloadStatus] = useState<string>('');
  
  const { isConfigured: hasLocalServer, downloadTrack, checkStatus } = useLocalDownloader();

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['audio/mpeg', 'audio/wav', 'audio/mp3', 'audio/x-wav', 'audio/webm', 'audio/ogg', 'audio/flac'];
    if (!validTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please upload an MP3, WAV, OGG, FLAC, or WebM audio file",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (50MB max)
    if (file.size > 52428800) {
      toast({
        title: "File too large",
        description: "Maximum file size is 50MB",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    setUploadProgress(10);

    try {
      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `uploads/${fileName}`;

      setUploadProgress(30);

      // Upload to Supabase storage
      const { error: uploadError } = await supabase.storage
        .from('audio-files')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        throw uploadError;
      }

      setUploadProgress(60);

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('audio-files')
        .getPublicUrl(filePath);

      // Generate waveform data (Rekordbox-style)
      setUploadProgress(70);
      let waveformData: WaveformData | null = null;
      try {
        waveformData = await generateWaveformFromFile(file, 150);
        console.log('Generated waveform with', waveformData.points.length, 'points');
      } catch (err) {
        console.warn('Could not generate waveform:', err);
      }

      setUploadProgress(85);

      // Extract title from filename (remove extension and cleanup)
      const title = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');

      // Create track entry in database
      const trackData = {
        title: title,
        artist: 'Unknown Artist',
        platform: 'local',
        audio_file_path: filePath,
        analysis_status: 'uploaded',
        waveform: waveformData ? JSON.parse(JSON.stringify(waveformData)) : null,
        duration: waveformData?.duration ? Math.floor(waveformData.duration) : null,
      };
      
      const { data: track, error: insertError } = await supabase
        .from('tracks')
        .insert(trackData)
        .select()
        .single();

      if (insertError) {
        throw insertError;
      }

      setUploadProgress(100);

      toast({
        title: "Track uploaded!",
        description: `"${title}" is ready. Click Analyze to separate stems.`,
      });

      onTrackImported({
        ...track,
        audioUrl: urlData.publicUrl,
      });

      setIsOpen(false);
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload file",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleUrlImport = async () => {
    if (!url.trim()) {
      toast({
        title: "Enter a URL",
        description: "Paste a YouTube, SoundCloud, or Spotify link",
        variant: "destructive",
      });
      return;
    }

    setIsDownloading(true);
    setDownloadStatus('Processing...');

    try {
      // Determine platform
      let platform = 'unknown';
      if (url.includes('youtube.com') || url.includes('youtu.be')) {
        platform = 'youtube';
      } else if (url.includes('soundcloud.com')) {
        platform = 'soundcloud';
      } else if (url.includes('spotify.com')) {
        platform = 'spotify';
      }

      // Use local server for lossless WAV downloads
      if (hasLocalServer) {
        setDownloadStatus('Downloading in lossless WAV...');
        
        const urlObj = new URL(url.trim());
        const defaultTitle = urlObj.pathname.split('/').pop() || 'Downloaded Track';
        
        const result = await downloadTrack({
          url: url.trim(),
          title: defaultTitle,
          artist: 'Unknown Artist',
          platform,
        });
        
        if (result.job_id) {
          let complete = false;
          let attempts = 0;
          
          while (!complete && attempts < 120) {
            await new Promise(r => setTimeout(r, 5000));
            const status = await checkStatus(result.job_id);
            
            setDownloadStatus(status.status || 'Processing...');
            
            if (status.status === 'complete') {
              complete = true;
              toast({
                title: "Download complete!",
                description: `Lossless WAV uploaded to your library`,
              });
              
              if (status.cloud_url || status.track_id) {
                onTrackImported({
                  id: status.track_id || result.job_id,
                  title: status.filename?.replace('.wav', '') || defaultTitle,
                  artist: 'Unknown Artist',
                  platform,
                  audioUrl: status.cloud_url,
                });
              }
            } else if (status.status === 'error') {
              throw new Error(status.error || 'Download failed');
            }
            
            attempts++;
          }
          
          if (!complete) {
            throw new Error('Download timeout');
          }
        }
      } else {
        // Fallback to cloud (MP3)
        setDownloadStatus('Downloading...');
        
        const { data, error } = await supabase.functions.invoke('download-audio', {
          body: { url: url.trim() },
        });

        if (error) throw error;

        if (data?.error) {
          throw new Error(data.error);
        }

        if (data?.requiresManualDownload) {
          toast({
            title: "Track registered",
            description: data.message || "Upload the audio file directly",
          });
        } else {
          toast({
            title: "Track imported!",
            description: `"${data.track?.title || 'Track'}" added to your library`,
          });
        }

        if (data.track) {
          onTrackImported({
            ...data.track,
            audioUrl: data.audioUrl || data.track.audioUrl,
          });
        }
      }

      setUrl('');
      setIsOpen(false);
    } catch (error) {
      console.error('Download error:', error);
      toast({
        title: "Import failed",
        description: error instanceof Error ? error.message : "Failed to import from URL",
        variant: "destructive",
      });
    } finally {
      setIsDownloading(false);
      setDownloadStatus('');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 border-neon-cyan/30 hover:border-neon-cyan">
          <Upload className="w-4 h-4" />
          Import Track
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Music className="w-5 h-5 text-neon-cyan" />
            Import Track
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="upload" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="upload">Upload File</TabsTrigger>
            <TabsTrigger value="url">From URL</TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="space-y-4 mt-4">
            <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-neon-cyan/50 transition-colors">
              <input
                ref={fileInputRef}
                type="file"
                accept="audio/*"
                onChange={handleFileSelect}
                className="hidden"
                disabled={isUploading}
              />
              
              {isUploading ? (
                <div className="space-y-4">
                  <Loader2 className="w-10 h-10 mx-auto animate-spin text-neon-cyan" />
                  <p className="text-sm text-muted-foreground">Uploading...</p>
                  <Progress value={uploadProgress} className="h-2" />
                </div>
              ) : (
                <>
                  <Upload className="w-10 h-10 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground mb-2">
                    Drag & drop or click to upload
                  </p>
                  <p className="text-xs text-muted-foreground">
                    MP3, WAV, OGG, FLAC (max 50MB)
                  </p>
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Select File
                  </Button>
                </>
              )}
            </div>
          </TabsContent>

          <TabsContent value="url" className="space-y-4 mt-4">
            <div className="space-y-4">
              {/* Mode indicator */}
              <div className={`flex items-center gap-2 p-2 rounded-lg text-xs ${
                hasLocalServer 
                  ? 'bg-neon-green/10 text-neon-green border border-neon-green/30' 
                  : 'bg-muted/50 text-muted-foreground'
              }`}>
                <Zap className="w-4 h-4" />
                {hasLocalServer 
                  ? 'Lossless Mode: Downloads in WAV from Spotify, YouTube & SoundCloud' 
                  : 'Basic Mode: MP3 downloads from YouTube & SoundCloud'}
              </div>

              <div className="flex gap-2">
                <Input
                  placeholder={hasLocalServer 
                    ? "Paste Spotify, YouTube or SoundCloud link..." 
                    : "Paste YouTube or SoundCloud link..."}
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  disabled={isDownloading}
                />
                {url && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setUrl('')}
                    disabled={isDownloading}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
              
              {/* Download status */}
              {isDownloading && downloadStatus && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {downloadStatus}
                </div>
              )}
              
              <Button
                className="w-full"
                onClick={handleUrlImport}
                disabled={isDownloading || !url.trim()}
              >
                {isDownloading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {downloadStatus || 'Importing...'}
                  </>
                ) : (
                  <>
                    <Link className="w-4 h-4 mr-2" />
                    {hasLocalServer ? 'Download Lossless' : 'Import Track'}
                  </>
                )}
              </Button>

              <p className="text-xs text-muted-foreground text-center">
                {hasLocalServer 
                  ? 'Audio will be downloaded in lossless WAV format'
                  : 'Connect local server for Spotify support & lossless WAV'}
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

interface StemAnalyzerProps {
  trackId: string;
  audioUrl: string;
  onComplete: (stems: any) => void;
}

export const StemAnalyzer = ({ trackId, audioUrl, onComplete }: StemAnalyzerProps) => {
  const { toast } = useToast();
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const analyzeStem = async () => {
    setIsAnalyzing(true);

    try {
      const { data, error } = await supabase.functions.invoke('separate-stems', {
        body: { trackId, audioUrl },
      });

      if (error) throw error;

      if (data?.error) {
        throw new Error(data.error);
      }

      toast({
        title: "Stems separated!",
        description: "Vocals and instrumental tracks are now available",
      });

      if (data.stems) {
        onComplete(data.stems);
      }
    } catch (error) {
      console.error('Stem analysis error:', error);
      toast({
        title: "Analysis failed",
        description: error instanceof Error ? error.message : "Failed to separate stems",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={analyzeStem}
      disabled={isAnalyzing}
      className="gap-1 text-xs"
    >
      {isAnalyzing ? (
        <>
          <Loader2 className="w-3 h-3 animate-spin" />
          Analyzing...
        </>
      ) : (
        <>
          <Scissors className="w-3 h-3" />
          Analyze
        </>
      )}
    </Button>
  );
};
