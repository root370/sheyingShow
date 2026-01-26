
// Follow this setup guide to integrate the Deno Edge Function with Supabase:
// https://supabase.com/docs/guides/functions

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// You would need to add your OpenAI API Key to Supabase Secrets:
// supabase secrets set OPENAI_API_KEY=sk-xxxx

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { title, imageDescriptions } = await req.json()

    // 1. Construct prompt for LLM
    const prompt = `
      You are an art curator and philosopher. 
      Write a short, poetic, and slightly abstract preface (max 2 sentences) for a photography exhibition titled "${title}".
      The exhibition features photos described as: ${imageDescriptions}.
      The tone should be introspective, high-end, and minimalist.
    `

    // 2. Call OpenAI (Commented out for skeleton)
    /*
    const openAiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: 'You are a poetic art curator.' },
          { role: 'user', content: prompt }
        ],
      }),
    })
    const data = await openAiResponse.json()
    const generatedText = data.choices[0].message.content
    */

    // 3. Mock Response for now
    const generatedText = `A silent exploration of ${title}, capturing the fleeting moments where light intersects with memory.`

    return new Response(
      JSON.stringify({ text: generatedText }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})
