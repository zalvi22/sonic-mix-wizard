import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { trackId, audioUrl } = await req.json();
    const LALAL_API_KEY = Deno.env.get("LALAL_API_KEY");
    
    if (!LALAL_API_KEY) {
      throw new Error("LALAL_API_KEY is not configured");
    }

    if (!trackId || !audioUrl) {
      throw new Error("trackId and audioUrl are required");
    }

    console.log("Starting stem separation for track:", trackId);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Update track status to processing
    await supabase
      .from("tracks")
      .update({ analysis_status: "processing" })
      .eq("id", trackId);

    // Step 1: Upload file to LALAL.AI
    console.log("Uploading to LALAL.AI...");
    const uploadResponse = await fetch("https://www.lalal.ai/api/upload/", {
      method: "POST",
      headers: {
        "Authorization": `license ${LALAL_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url: audioUrl,
        filter: 1, // Vocals/Instrumental separation
        stem: "vocals", // Extract vocals
      }),
    });

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.error("LALAL.AI upload error:", errorText);
      throw new Error(`LALAL.AI upload failed: ${uploadResponse.status}`);
    }

    const uploadData = await uploadResponse.json();
    console.log("LALAL.AI upload response:", uploadData);

    if (uploadData.status !== "success") {
      throw new Error(`LALAL.AI error: ${uploadData.error || "Unknown error"}`);
    }

    const fileId = uploadData.id;

    // Step 2: Check processing status
    let processingComplete = false;
    let attempts = 0;
    const maxAttempts = 60; // 5 minutes max (5 second intervals)
    let resultData: any = null;

    while (!processingComplete && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
      
      const checkResponse = await fetch(`https://www.lalal.ai/api/check/?id=${fileId}`, {
        headers: {
          "Authorization": `license ${LALAL_API_KEY}`,
        },
      });

      if (!checkResponse.ok) {
        console.error("Check status failed:", await checkResponse.text());
        attempts++;
        continue;
      }

      resultData = await checkResponse.json();
      console.log("Processing status:", resultData.status, "Progress:", resultData.progress);

      if (resultData.status === "success" && resultData.progress === 100) {
        processingComplete = true;
      } else if (resultData.status === "error") {
        throw new Error(`LALAL.AI processing error: ${resultData.error}`);
      }

      attempts++;
    }

    if (!processingComplete) {
      throw new Error("Processing timeout - took too long");
    }

    // Step 3: Get the stem URLs
    const stems = {
      vocals: resultData.split?.stem_track || null,
      instrumental: resultData.split?.back_track || null,
    };

    console.log("Stems extracted:", stems);

    // Update track with stem URLs
    await supabase
      .from("tracks")
      .update({ 
        stems: stems,
        analysis_status: "complete"
      })
      .eq("id", trackId);

    return new Response(JSON.stringify({ 
      success: true, 
      trackId,
      stems 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error in separate-stems:", error);
    
    // Try to update track status to failed
    try {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const supabase = createClient(supabaseUrl, supabaseKey);
      const { trackId } = await req.json().catch(() => ({}));
      if (trackId) {
        await supabase
          .from("tracks")
          .update({ analysis_status: "failed" })
          .eq("id", trackId);
      }
    } catch (e) {
      console.error("Failed to update track status:", e);
    }

    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Unknown error" 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
