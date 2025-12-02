import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt, deckA, deckB, mashupElements } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `You are an expert Sonic Pi live coder and DJ. Generate Sonic Pi code based on user descriptions.

SONIC PI BASICS:
- use_bpm sets tempo (e.g., use_bpm 120)
- live_loop creates named loops that run continuously
- sync synchronizes loops together
- sample plays built-in samples (e.g., sample :bd_haus)
- play plays notes (e.g., play :c4)
- sleep pauses execution (e.g., sleep 1 for one beat)
- use_synth selects synthesizer (e.g., use_synth :prophet)
- with_fx wraps code in effects (e.g., with_fx :reverb do...end)

AVAILABLE SYNTHS: :beep, :blade, :bnoise, :cnoise, :dark_ambience, :dpulse, :dsaw, :dtri, :dull_bell, :fm, :gnoise, :growl, :hollow, :hoover, :mod_beep, :mod_dsaw, :mod_fm, :mod_pulse, :mod_saw, :mod_sine, :mod_tri, :noise, :piano, :pluck, :pnoise, :pretty_bell, :prophet, :pulse, :saw, :sine, :square, :subpulse, :supersaw, :tb303, :tech_saws, :tri, :zawa

AVAILABLE SAMPLES (common ones):
- Drums: :bd_haus, :bd_tek, :bd_boom, :sn_dub, :sn_dolf, :drum_cymbal_closed, :drum_cymbal_open, :drum_tom_lo_hard
- Loops: :loop_amen, :loop_breakbeat, :loop_compus, :loop_garzul, :loop_industrial
- Ambient: :ambi_choir, :ambi_dark_woosh, :ambi_drone, :ambi_glass_hum, :ambi_lunar_land
- Bass: :bass_dnb_f, :bass_drop_c, :bass_hard_c, :bass_hit_c, :bass_trance_c

EFFECTS: :reverb, :echo, :distortion, :slicer, :wobble, :flanger, :lpf, :hpf, :bitcrusher, :compressor

SCALES: :major, :minor, :minor_pentatonic, :major_pentatonic, :blues_major, :blues_minor, :dorian, :phrygian

CODE STRUCTURE:
\`\`\`
use_bpm 120

live_loop :drums do
  sample :bd_haus
  sleep 1
end

live_loop :melody do
  sync :drums
  use_synth :prophet
  play (scale :c4, :minor_pentatonic).choose
  sleep 0.5
end
\`\`\`

RULES:
1. Always start with use_bpm
2. Use live_loop for all repeating patterns
3. Sync secondary loops to primary loop
4. Add comments explaining each section
5. Use rrand() for randomization
6. Use one_in(n) for probabilistic events
7. Include performance tips as comments

Current context:
${deckA?.track ? `Deck A: "${deckA.track.title}" by ${deckA.track.artist}, BPM: ${deckA.track.bpm}, Key: ${deckA.track.key}` : 'Deck A: Empty'}
${deckB?.track ? `Deck B: "${deckB.track.title}" by ${deckB.track.artist}, BPM: ${deckB.track.bpm}, Key: ${deckB.track.key}` : 'Deck B: Empty'}
${mashupElements?.length > 0 ? `Mashup elements: ${mashupElements.map((e: any) => `${e.trackTitle} (${e.type})`).join(', ')}` : 'No mashup elements'}

Generate ONLY the Sonic Pi code, no explanations outside code comments. Make it musical and interesting!`;

    console.log("Generating Sonic Pi code for prompt:", prompt);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt },
        ],
        stream: false,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const generatedCode = data.choices?.[0]?.message?.content || "";
    
    // Clean up the code - remove markdown code blocks if present
    const cleanCode = generatedCode
      .replace(/```ruby\n?/g, '')
      .replace(/```sonic-pi\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();

    console.log("Generated code length:", cleanCode.length);

    return new Response(JSON.stringify({ code: cleanCode }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in generate-sonic-pi:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
