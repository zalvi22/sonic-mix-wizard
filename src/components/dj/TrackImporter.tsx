import { useState, useRef } from 'react';
import { Upload, Link, Loader2, Music, X, Scissors } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Progress } from '@/components/ui/progress';

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

      // Extract title from filename (remove extension and cleanup)
      const title = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');

      // Create track entry in database
      const { data: track, error: insertError } = await supabase
        .from('tracks')
        .insert({
          title: title,
          artist: 'Unknown Artist',
          platform: 'local',
          audio_file_path: filePath,
          analysis_status: 'uploaded',
        })
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
        description: "Paste a YouTube or SoundCloud link",
        variant: "destructive",
      });
      return;
    }

    setIsDownloading(true);

    try {
      const { data, error } = await supabase.functions.invoke('download-audio', {
        body: { url: url.trim() },
      });

      if (error) throw error;

      if (data?.error) {
        throw new Error(data.error);
      }

      toast({
        title: "Track registered!",
        description: data.message || "Track has been added",
      });

      if (data.track) {
        onTrackImported(data.track);
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
              <div className="flex gap-2">
                <Input
                  placeholder="https://youtube.com/watch?v=... or soundcloud.com/..."
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
              
              <Button
                className="w-full"
                onClick={handleUrlImport}
                disabled={isDownloading || !url.trim()}
              >
                {isDownloading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    <Link className="w-4 h-4 mr-2" />
                    Import from URL
                  </>
                )}
              </Button>

              <p className="text-xs text-muted-foreground text-center">
                Note: For best results, upload audio files directly.
                URL import registers the track for manual audio upload.
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
