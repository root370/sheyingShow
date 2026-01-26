import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { imageUrls, exhibitionTitle } = await req.json()

    if (!imageUrls || !Array.isArray(imageUrls) || imageUrls.length === 0) {
      throw new Error("No images provided")
    }

    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')
    if (!GEMINI_API_KEY) {
        throw new Error("Missing GEMINI_API_KEY")
    }

    // Prepare content parts for Gemini
    const parts: any[] = [
      {
        text: `You are a world-class photography curator and philosopher, inspired by the likes of Viktor Frankl and Roland Barthes. You are analyzing a sequence of photos titled '${exhibitionTitle || "Untitled"}'.

Do NOT just describe the objects (e.g., 'I see a cat'). Instead, analyze the lighting, the mood, the use of negative space, and the emotional arc.

Synthesize a profound, poetic, yet grounded preface (max 100 words) that reveals the hidden meaning behind these images.`
      }
    ];

    // Add images to parts
    for (const url of imageUrls) {
        // Assume all images are passed as base64 strings from frontend now
        // Format: "data:image/jpeg;base64,/9j/4AAQSw..."
        if (typeof url === 'string' && url.startsWith('data:')) {
            const base64Data = url.split(',')[1];
            const mimeType = url.split(';')[0].split(':')[1];
            
            parts.push({
                inline_data: {
                    mime_type: mimeType,
                    data: base64Data
                }
            });
        }
    }

    // Call Gemini API (v1beta)
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;
    
    // Add logging to debug
    console.log("Calling Gemini API with key length:", GEMINI_API_KEY.length);
    console.log("Number of images:", imageUrls.length);
    console.log("Parts structure (without data):", parts.map(p => p.text ? "text" : "image"));

    const geminiResponse = await fetch(geminiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{ parts: parts }]
      }),
    })

    if (!geminiResponse.ok) {
        const errorData = await geminiResponse.text();
        console.error('Gemini Error:', errorData);
        throw new Error(`Gemini API error: ${geminiResponse.statusText} - ${errorData}`);
    }

    const data = await geminiResponse.json()
    const preface = data.candidates?.[0]?.content?.parts?.[0]?.text || "No analysis generated.";

    return new Response(
      JSON.stringify({ preface }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error("Function error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})
