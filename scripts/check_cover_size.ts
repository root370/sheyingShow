
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

async function checkCoverSizes() {
  const { data: exhibitions, error } = await supabase
    .from('exhibitions')
    .select('id, title, cover_url')
    .limit(5);

  if (error) {
    console.error(error);
    return;
  }

  exhibitions.forEach(ex => {
    const cover = ex.cover_url || '';
    console.log(`Exhibition: ${ex.title}`);
    console.log(`Cover ID: ${ex.id}`);
    console.log(`Cover Length: ${cover.length} characters`);
    console.log(`Is Base64? ${cover.startsWith('data:')}`);
    console.log('---');
  });
}

checkCoverSizes();
