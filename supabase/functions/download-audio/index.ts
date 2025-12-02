import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Simple URL validation
function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

// Extract video/audio info from URL
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

  return { platform: "unknown", id: null };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url, title, artist } = await req.json();

    if (!url || !isValidUrl(url)) {
      throw new Error("Valid URL is required");
    }

    const { platform, id } = extractPlatformInfo(url);
    console.log(`Processing ${platform} URL:`, url);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // For now, we'll create a track entry with the source URL
    // Actual audio download would require yt-dlp or similar service
    // which isn't available in edge functions
    
    // Create track entry in database
    const { data: track, error: insertError } = await supabase
      .from("tracks")
      .insert({
        title: title || `Track from ${platform}`,
        artist: artist || "Unknown Artist",
        platform: platform,
        source_url: url,
        analysis_status: "pending",
      })
      .select()
      .single();

    if (insertError) {
      console.error("Insert error:", insertError);
      throw new Error(`Failed to create track: ${insertError.message}`);
    }

    console.log("Track created:", track.id);

    // Note: For actual audio download from YouTube/SoundCloud,
    // you would need:
    // 1. A separate backend service with yt-dlp
    // 2. Or use a third-party API service
    // 3. Or require users to provide direct audio URLs

    return new Response(JSON.stringify({ 
      success: true,
      track: {
        id: track.id,
        title: track.title,
        artist: track.artist,
        platform: track.platform,
        source_url: track.source_url,
        analysis_status: track.analysis_status,
      },
      message: "Track registered. Note: Direct audio download from streaming platforms requires additional backend infrastructure. For now, please upload the audio file directly."
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error in download-audio:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Unknown error" 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
