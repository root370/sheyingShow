
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
  console.error('Missing Supabase credentials');
  console.log('Url:', supabaseUrl ? 'Found' : 'Missing');
  console.log('Key:', supabaseServiceKey ? 'Found' : 'Missing');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function deleteSpam() {
  const usernames = ['牛逼哄哄', 'dao', 'DAO'];
  
  console.log(`Searching for users: ${usernames.join(', ')}`);

  // 1. Find User IDs
  const { data: profiles, error: profileError } = await supabase
    .from('profiles')
    .select('id, username')
    .in('username', usernames);

  if (profileError) {
    console.error('Error finding profiles:', profileError);
    return;
  }

  if (!profiles || profiles.length === 0) {
    console.log('No profiles found.');
    return;
  }

  console.log('Found profiles:', profiles);
  const userIds = profiles.map((p: any) => p.id);

  // 2. Find Exhibitions
  const { data: exhibitions, error: exError } = await supabase
    .from('exhibitions')
    .select('id, title, user_id')
    .in('user_id', userIds);

  if (exError) {
    console.error('Error finding exhibitions:', exError);
    return;
  }

  if (!exhibitions || exhibitions.length === 0) {
    console.log('No exhibitions found for these users.');
    return;
  }

  console.log(`Found ${exhibitions.length} exhibitions to delete.`);

  const exhibitionIds = exhibitions.map((e: any) => e.id);
  
  // Delete Photos first just in case
  const { error: photoDeleteError } = await supabase
      .from('photos')
      .delete()
      .in('exhibition_id', exhibitionIds);
      
  if (photoDeleteError) {
      console.log("Error deleting photos:", photoDeleteError.message);
  } else {
      console.log("Photos deleted.");
  }

  const { error: deleteError } = await supabase
    .from('exhibitions')
    .delete()
    .in('id', exhibitionIds);

  if (deleteError) {
    console.error('Error deleting exhibitions:', deleteError);
  } else {
    console.log('Successfully deleted exhibitions.');
  }
}

deleteSpam();
