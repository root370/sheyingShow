require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// SERVICE ROLE KEY to bypass RLS
const SUPABASE_URL = "https://kvjmgtigzilketuaigwi.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt2am1ndGlnemlsa2V0dWFpZ3dpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODEwMjIzNiwiZXhwIjoyMDgzNjc4MjM2fQ.fjHjilgHH8n9j84EFNoKXFeIU-vn1cQFl8NdXxJ7_aI";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const CDN_DOMAIN = 'static.latentspace.top/exhibitions';
const SUPABASE_DOMAIN = 'kvjmgtigzilketuaigwi.supabase.co/storage/v1/object/public/exhibitions';

async function rollback() {
  console.log('Starting rollback...');

  // 1. Rollback Photos
  const { data: photos, error: pError } = await supabase
    .from('photos')
    .select('id, url')
    .ilike('url', '%static.latentspace.top%');

  if (pError) {
    console.error('Error fetching photos:', pError);
  } else {
    console.log(`Found ${photos.length} photos to rollback.`);
    for (const p of photos) {
      let newUrl = p.url.replace(CDN_DOMAIN, SUPABASE_DOMAIN);
      // Remove query params to be safe (Supabase adds them dynamically or we can keep them?)
      // Actually, let's keep the original base path clean.
      newUrl = newUrl.split('?')[0];

      const { error: updateError } = await supabase
        .from('photos')
        .update({ url: newUrl })
        .eq('id', p.id);

      if (updateError) console.error(`Failed to rollback photo ${p.id}:`, updateError);
      else console.log(`Rolled back photo ${p.id}`);
    }
  }

  // 2. Rollback Exhibition Covers
  const { data: exhibitions, error: eError } = await supabase
    .from('exhibitions')
    .select('id, cover_url')
    .ilike('cover_url', '%static.latentspace.top%');

  if (eError) {
    console.error('Error fetching exhibitions:', eError);
  } else {
    console.log(`Found ${exhibitions.length} exhibitions to rollback.`);
    for (const ex of exhibitions) {
      if (!ex.cover_url) continue;
      
      let newUrl = ex.cover_url.replace(CDN_DOMAIN, SUPABASE_DOMAIN);
      newUrl = newUrl.split('?')[0];

      const { error: updateError } = await supabase
        .from('exhibitions')
        .update({ cover_url: newUrl })
        .eq('id', ex.id);

      if (updateError) console.error(`Failed to rollback exhibition ${ex.id}:`, updateError);
      else console.log(`Rolled back exhibition ${ex.id}`);
    }
  }
  
  console.log('Rollback complete.');
}

rollback();