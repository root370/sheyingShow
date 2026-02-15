import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabase-admin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Fetch top 5 photos by picks_count
    // We filter out photos with 0 picks to ensure quality, unless requested otherwise.
    // But for "Top 5", 0 picks might be included if there are no picks yet.
    // Let's just order by picks_count desc.
    const { data: photos, error } = await supabaseAdmin
        .from('photos')
        .select(`
            *,
            exhibition:exhibitions (
                id,
                title
            )
        `)
        .order('picks_count', { ascending: false })
        .limit(5);

    if (error) throw error;

    return res.status(200).json(photos || []);
  } catch (err: any) {
     console.error('Top Picks Error:', err);
     return res.status(500).json({ error: err.message });
  }
}
