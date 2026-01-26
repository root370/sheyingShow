import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase Client (Service Role for API)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Use Service Role to bypass RLS or ensure writes
);

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '20mb', // Increase to 20mb to handle larger base64 images
    },
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { image, exif_info, photo_id } = req.body; // Accept photo_id for caching

  if (!image) {
    return res.status(400).json({ error: 'Image data is required' });
  }

  try {
    // ---------------------------------------------------------
    // 1. CACHE CHECK
    // ---------------------------------------------------------
    if (photo_id) {
        const { data: cached } = await supabase
            .from('photo_analysis')
            .select('analysis_result')
            .eq('photo_id', photo_id)
            .eq('model_version', 'v1') // Hardcoded version for now
            .single();
            
        if (cached) {
            console.log(`Cache HIT for photo ${photo_id}`);
            return res.status(200).json(cached.analysis_result);
        }
        console.log(`Cache MISS for photo ${photo_id}`);
    }


    // ---------------------------------------------------------
    // COZE API CONFIGURATION
    // ---------------------------------------------------------
    // Use the specific Workflow/Bot URL provided by the user
    const COZE_API_URL = 'https://683s5ttjjx.coze.site/run'; 
    const COZE_API_KEY = process.env.COZE_API_TOKEN; 
    
    // If no keys are configured, return a mock response for demonstration
    // FORCE MOCK FOR NOW due to network timeout issues
    const FORCE_MOCK = false;

    if (!COZE_API_KEY || FORCE_MOCK) {
      console.warn("Coze API Key not configured OR Mock forced. Returning mock response.");
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      const mockResult = {
        content: `(Mock Analysis) This image demonstrates a compelling use of light and shadow. The composition draws the eye towards the central subject, while the high contrast creates a dramatic atmosphere. ${exif_info ? `The technical settings (${exif_info}) suggest a deliberate choice to capture motion/depth.` : ''} The emotional tone is contemplative and profound.`
      };

      return res.status(200).json(mockResult);
    }

    // Call Coze API
    let payload: any = {
        exif_info: exif_info || ""
    };

    // Strategy: Try sending Base64 if it's a URL, to avoid Coze download timeout
    if (image.startsWith('http')) {
        try {
            console.log(`Downloading image from ${image} to convert to Base64...`);
            const imgRes = await fetch(image);
            if (!imgRes.ok) throw new Error(`Failed to fetch image: ${imgRes.statusText}`);
            const arrayBuffer = await imgRes.arrayBuffer();
            let buffer = Buffer.from(arrayBuffer);

            // Note: Frontend should have already compressed, but if direct URL is passed, we might want to compress here too if we had sharp.
            // For now, assume backend fetch is robust or image is reasonable.
            
            const base64Image = `data:${imgRes.headers.get('content-type') || 'image/jpeg'};base64,${buffer.toString('base64')}`;
            
            // Construct payload with Base64
            payload.image = {
                url: base64Image
            };
            console.log("Successfully converted image to Base64. Payload size:", base64Image.length);
        } catch (downloadErr) {
            console.error("Failed to download/convert image, falling back to URL:", downloadErr);
            payload.image = { url: image };
        }
    } else {
        // Already Base64 or other format
        payload.image = {
            url: image 
        };
    }

    const response = await fetch(COZE_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${COZE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error("Coze API Error:", errorText);
        throw new Error(`Coze API error: ${response.statusText}`);
    }

    const data = await response.json();
    
    // Debug Log: Inspect the full Coze response
    console.log("Coze API Full Response:", JSON.stringify(data, null, 2));

    // Parse Coze response
    // For "Run" endpoints (Workflow/Plugin), the result is usually in `data` or `result`
    // It might be a simple JSON object or a string.
    let analysisData: any = {};
    
    // Standardize result structure
    if (data.critique_result) {
        analysisData.critique = data.critique_result;
        // Also check for improved image
        if (data.improved_image && data.improved_image.url) {
            analysisData.improved_image_url = data.improved_image.url;
        }
        if (data.comparison_result) {
            analysisData.comparison = data.comparison_result;
        }
    } else if (data.data) {
        // If data is a string, use it
        if (typeof data.data === 'string') {
            analysisData.content = data.data;
        } 
        // If data is an object, try to find a meaningful field
        else if (typeof data.data === 'object') {
            analysisData.content = data.data.output || data.data.result || data.data.content || data.data.answer || JSON.stringify(data.data);
        }
    } else if (data.output) {
        analysisData.content = data.output;
    } else if (data.result) {
        analysisData.content = data.result;
    } else {
        // Fallback
        analysisData.content = "Analysis completed, but no structured text returned.";
    }

    // ---------------------------------------------------------
    // 2. CACHE WRITE
    // ---------------------------------------------------------
    if (photo_id && (analysisData.critique || analysisData.content)) {
        const { error: insertError } = await supabase
            .from('photo_analysis')
            .upsert({
                photo_id: photo_id,
                analysis_result: analysisData,
                model_version: 'v1'
            }, { onConflict: 'photo_id, model_version' });
            
        if (insertError) {
            console.error("Failed to cache analysis:", insertError);
        } else {
            console.log(`Analysis cached for photo ${photo_id}`);
        }
    }

    return res.status(200).json(analysisData);

  } catch (error: any) {
    console.error('Analysis Error:', error);
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
}
