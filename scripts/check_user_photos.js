
const fetch = require('node-fetch');
global.fetch = fetch;
global.Headers = fetch.Headers;
global.Request = fetch.Request;
global.Response = fetch.Response;

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://kvjmgtigzilketuaigwi.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt2am1ndGlnemlsa2V0dWFpZ3dpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODEwMjIzNiwiZXhwIjoyMDgzNjc4MjM2fQ.fjHjilgHH8n9j84EFNoKXFeIU-vn1cQFl8NdXxJ7_aI';

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function checkUserPhotos(targetUsername) {
  console.log(`Searching for user: ${targetUsername}...`);

  // 1. Find User ID by Username (Case insensitive)
  const { data: profile, error: profileError } = await supabaseAdmin
    .from('profiles')
    .select('id, username')
    .ilike('username', targetUsername) // Case insensitive match
    .maybeSingle();

  if (profileError) {
    console.error('Error finding profile:', profileError);
    return;
  }

  if (!profile) {
    console.log(`❌ User '${targetUsername}' not found.`);
    return;
  }

  console.log(`✅ User found: ${profile.username} (ID: ${profile.id})`);

  // 2. Check Exhibitions
  const { data: exhibitions, error: exError } = await supabaseAdmin
    .from('exhibitions')
    .select('id, title, status, created_at')
    .eq('user_id', profile.id)
    .order('created_at', { ascending: false });

  if (exError) {
    console.error('Error fetching exhibitions:', exError);
    return;
  }

  console.log(`\n📂 Found ${exhibitions.length} exhibitions:`);
  
  if (exhibitions.length === 0) {
      console.log('   (No exhibitions created yet)');
  }

  for (const ex of exhibitions) {
    // 3. Count Photos in each exhibition
    const { count, error: photoError } = await supabaseAdmin
      .from('photos')
      .select('*', { count: 'exact', head: true })
      .eq('exhibition_id', ex.id);

    if (photoError) {
        console.log(`   - [${ex.status}] "${ex.title}" (Error counting photos)`);
    } else {
        console.log(`   - [${ex.status}] "${ex.title}" (${count} photos) - Created: ${new Date(ex.created_at).toLocaleString()}`);
    }
  }

  // 4. Check for Orphaned Photos (just in case)
  // This is harder to check directly without an exhibition ID usually, but we can query by user_id if photos table has it (it usually doesn't, it links to exhibition).
  // Assuming photos link to exhibitions which link to users.
}

checkUserPhotos('LANPKOUGDE');
