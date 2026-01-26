import type { NextApiRequest, NextApiResponse } from 'next';
import { HttpsProxyAgent } from 'https-proxy-agent';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { imageUrls, exhibitionTitle } = req.body;

    if (!imageUrls || !Array.isArray(imageUrls) || imageUrls.length === 0) {
      return res.status(400).json({ error: "No images provided" });
    }

    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    if (!GEMINI_API_KEY) {
      return res.status(500).json({ error: "Missing GEMINI_API_KEY" });
    }

    // Configure Proxy if available
    const proxyUrl = process.env.HTTPS_PROXY || process.env.https_proxy || process.env.HTTP_PROXY || process.env.http_proxy;
    let agent: any = undefined;

    if (proxyUrl) {
      console.log(`Using proxy: ${proxyUrl}`);
      agent = new HttpsProxyAgent(proxyUrl);
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
    
    // Add agent to fetch options
    const fetchOptions: any = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{ parts: parts }]
      }),
    };

    if (agent) {
        fetchOptions.agent = agent;
    }

    try {
        const geminiResponse = await fetch(geminiUrl, fetchOptions);

        if (!geminiResponse.ok) {
            const errorData = await geminiResponse.text();
            console.error('Gemini Error:', errorData);
            throw new Error(`Gemini API error: ${geminiResponse.statusText} - ${errorData}`);
        }

        const data = await geminiResponse.json();
        const preface = data.candidates?.[0]?.content?.parts?.[0]?.text || "No analysis generated.";
        return res.status(200).json({ preface });

    } catch (fetchError: any) {
        // Fallback Mechanism for Network Issues (e.g., GFW blocks)
        console.error("Gemini Fetch Error:", fetchError);
        
        if (fetchError.message.includes('ETIMEDOUT') || fetchError.message.includes('ECONNREFUSED') || fetchError.message.includes('fetch failed')) {
            console.log("Network error detected. Falling back to mock response for demonstration.");
            
            // Mock Response
            const mockPreface = "In this sequence, the photographer masterfully juxtaposes light and shadow to evoke a sense of fleeting memory. The negative space serves not as emptiness, but as a pause for reflection, inviting the viewer to contemplate the unspoken narratives within the frame. It is a visual meditation on presence and absence. (AI Service Unavailable - Mock Generated)";
            
            return res.status(200).json({ preface: mockPreface });
        }
        
        throw fetchError;
    }

  } catch (error: any) {
    console.error("API error:", error);
    return res.status(500).json({ error: error.message });
  }
}
