import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Allowlisted domains for security - prevents SSRF attacks
const ALLOWED_DOMAINS = [
  "youtube.com",
  "www.youtube.com",
  "youtu.be",
  "soundcloud.com",
  "www.soundcloud.com",
  "spotify.com",
  "open.spotify.com",
  "music.youtube.com",
];

function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

function isAllowedDomain(url: string): boolean {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.toLowerCase();
    return ALLOWED_DOMAINS.some(domain => 
      hostname === domain || hostname.endsWith(`.${domain}`)
    );
  } catch {
    return false;
  }
}

function extractPlatformInfo(url: string): { platform: string; id: string | null } {
  const urlObj = new URL(url);
  const hostname = urlObj.hostname.toLowerCase();

  if (hostname.includes("youtube.com") || hostname.includes("youtu.be")) {
    const videoId = hostname.includes("youtu.be") 
      ? urlObj.pathname.slice(1) 
      : urlObj.searchParams.get("v");
    return { platform: "youtube", id: videoId };
  }
  
  if (hostname.includes("soundcloud.com")) {
    return { platform: "soundcloud", id: urlObj.pathname };
  }

  if (hostname.includes("spotify.com")) {
    return { platform: "spotify", id: urlObj.pathname };
  }

  return { platform: "unknown", id: null };
}

// Input validation
function validateInput(data: unknown): { url: string; title?: string; artist?: string } {
  if (!data || typeof data !== "object") {
    throw new Error("Invalid request body");
  }

  const { url, title, artist } = data as Record<string, unknown>;

  if (!url || typeof url !== "string") {
    throw new Error("URL is required and must be a string");
  }

  if (url.length > 2048) {
    throw new Error("URL is too long (max 2048 characters)");
  }

  if (!isValidUrl(url)) {
    throw new Error("Invalid URL format");
  }

  if (!isAllowedDomain(url)) {
    throw new Error("URL domain not allowed. Supported: YouTube, SoundCloud, Spotify");
  }

  // Validate optional fields
  const validatedTitle = title && typeof title === "string" 
    ? title.slice(0, 255) // Limit title length
    : undefined;

  const validatedArtist = artist && typeof artist === "string"
    ? artist.slice(0, 255) // Limit artist length
    : undefined;

  return { url, title: validatedTitle, artist: validatedArtist };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const rawData = await req.json();
    const { url, title, artist } = validateInput(rawData);

    const { platform, id } = extractPlatformInfo(url);
    console.log(`Processing ${platform} URL for track`);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Try Cobalt API for downloading (free, open source)
    let downloadUrl: string | null = null;
    let extractedTitle = title || `Track from ${platform}`;

    try {
      console.log("Trying Cobalt API...");
      const cobaltResponse = await fetch("https://api.cobalt.tools/", {
        method: "POST",
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url: url,
          audioFormat: "mp3",
          isAudioOnly: true,
          downloadMode: "audio",
        }),
      });

      if (cobaltResponse.ok) {
        const cobaltData = await cobaltResponse.json();
        console.log("Cobalt API responded successfully");
        
        if (cobaltData.url) {
          downloadUrl = cobaltData.url;
          extractedTitle = cobaltData.filename?.replace(/\.[^/.]+$/, "") || extractedTitle;
        } else if (cobaltData.audio) {
          downloadUrl = cobaltData.audio;
        }
      }
    } catch (cobaltError) {
      console.log("Cobalt API unavailable");
    }

    // If no download URL, just register the track
    if (!downloadUrl) {
      const { data: track, error: insertError } = await supabase
        .from("tracks")
        .insert({
          title: extractedTitle,
          artist: artist || "Unknown Artist",
          platform: platform,
          source_url: url,
          analysis_status: "pending_download",
        })
        .select()
        .single();

      if (insertError) {
        throw new Error(`Failed to create track: ${insertError.message}`);
      }

      return new Response(JSON.stringify({ 
        success: true,
        track: track,
        message: "Track registered. Download service temporarily unavailable - try uploading the file directly.",
        requiresManualDownload: true,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Download the audio file
    console.log("Downloading audio file...");
    const audioResponse = await fetch(downloadUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
      },
    });

    if (!audioResponse.ok) {
      throw new Error("Failed to download audio file");
    }

    const audioBuffer = await audioResponse.arrayBuffer();
    
    // Limit file size to 100MB
    if (audioBuffer.byteLength > 100 * 1024 * 1024) {
      throw new Error("File too large (max 100MB)");
    }

    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.mp3`;
    const filePath = `downloads/${fileName}`;

    console.log(`Uploading ${Math.round(audioBuffer.byteLength / 1024)}KB to storage...`);

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from("audio-files")
      .upload(filePath, audioBuffer, {
        contentType: "audio/mpeg",
        upsert: false,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      throw new Error(`Failed to upload: ${uploadError.message}`);
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from("audio-files")
      .getPublicUrl(filePath);

    // Create track entry
    const { data: track, error: insertError } = await supabase
      .from("tracks")
      .insert({
        title: extractedTitle,
        artist: artist || "Unknown Artist",
        platform: platform,
        source_url: url,
        audio_file_path: filePath,
        analysis_status: "uploaded",
      })
      .select()
      .single();

    if (insertError) {
      throw new Error(`Failed to create track: ${insertError.message}`);
    }

    console.log("Track created successfully");

    return new Response(JSON.stringify({ 
      success: true,
      track: {
        ...track,
        audioUrl: urlData.publicUrl,
      },
      audioUrl: urlData.publicUrl,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error in download-audio:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Unknown error",
      suggestion: "Try a different URL or upload the audio file directly"
    }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
