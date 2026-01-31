
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// Manual env parsing
const envPath = path.resolve(process.cwd(), '.env.local');
let envConfig: any = {};

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0) {
      envConfig[key.trim()] = valueParts.join('=').trim().replace(/^["']|["']$/g, '');
    }
  });
}

const supabaseUrl = envConfig.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = envConfig.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || envConfig.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function listUsers() {
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('username')
    .ilike('username', '%dao%'); // Search for DAO case-insensitive

  if (profiles) {
    console.log('Users matching "dao":', profiles.map(p => p.username));
  }
}

listUsers();
