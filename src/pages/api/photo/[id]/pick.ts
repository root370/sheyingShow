import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabase-admin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.query; // Photo ID
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized: No token provided' });
  }

  // Verify user token
  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

  if (authError || !user) {
    return res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }

  const photoId = id as string;
  const userId = user.id;

  try {
    // Check if already picked
    const { data: existing, error: fetchError } = await supabaseAdmin
        .from('photo_picks')
        .select('id')
        .eq('user_id', userId)
        .eq('photo_id', photoId)
        .single();

    if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 is "No rows found"
        throw fetchError;
    }

    let isPicked = false;

    if (existing) {
        // Unpick
        const { error: deleteError } = await supabaseAdmin
            .from('photo_picks')
            .delete()
            .eq('id', existing.id);
        
        if (deleteError) throw deleteError;

        // Decrement count
        await supabaseAdmin.rpc('decrement_picks_count', { row_id: photoId });
        isPicked = false;
    } else {
        // Pick
        const { error: insertError } = await supabaseAdmin
            .from('photo_picks')
            .insert({ user_id: userId, photo_id: photoId });
            
        if (insertError) throw insertError;

        // Increment count
        await supabaseAdmin.rpc('increment_picks_count', { row_id: photoId });
        isPicked = true;
    }
    
    // Get updated count
    const { data: photo } = await supabaseAdmin
        .from('photos')
        .select('picks_count')
        .eq('id', photoId)
        .single();
    
    return res.status(200).json({ 
        picked: isPicked, 
        count: photo?.picks_count || 0 
    });

  } catch (err: any) {
     console.error('Pick API Error:', err);
     return res.status(500).json({ error: err.message || 'Internal Server Error' });
  }
}
