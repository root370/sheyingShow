import type { NextApiRequest, NextApiResponse } from 'next'
import { supabaseAdmin } from '@/lib/supabase-admin'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { email, password, username, essence } = req.body
    
    console.log('Signup attempt for:', email);
    
    // Check if Service Role Key is available (without logging it)
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
        console.error('CRITICAL: SUPABASE_SERVICE_ROLE_KEY is missing');
        return res.status(500).json({ error: 'Server misconfiguration: Missing Service Key' });
    }

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' })
    }

    // Use Admin Client to create user with email automatically confirmed
    console.log('Creating user via Supabase Admin...');
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Bypass email confirmation
      user_metadata: {
        username,
        essence_of_photography: essence,
      },
    })

    if (error) {
      console.error('Supabase Admin createUser error:', error)
      return res.status(400).json({ error: error.message })
    }
    
    console.log('User created successfully:', data.user?.id);

    return res.status(200).json({ user: data.user })
  } catch (err: any) {
    console.error('Internal error:', err)
    return res.status(500).json({ error: 'Internal Server Error' })
  }
}
