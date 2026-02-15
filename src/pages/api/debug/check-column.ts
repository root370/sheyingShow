import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Try to select the column directly
    const { data, error } = await supabase
      .from('photos')
      .select('id, picks_count')
      .limit(1);

    if (error) {
      return res.status(500).json({ error });
    }
    return res.status(200).json({ data });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}
