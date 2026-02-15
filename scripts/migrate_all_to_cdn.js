require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// 硬编码环境变量以确保脚本能跑
const SUPABASE_URL = "https://kvjmgtigzilketuaigwi.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt2am1ndGlnemlsa2V0dWFpZ3dpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODEwMjIzNiwiZXhwIjoyMDgzNjc4MjM2fQ.fjHjilgHH8n9j84EFNoKXFeIU-vn1cQFl8NdXxJ7_aI"; // SERVICE ROLE KEY

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const OLD_DOMAIN = 'kvjmgtigzilketuaigwi.supabase.co/storage/v1/object/public/exhibitions';
const NEW_DOMAIN = 'static.latentspace.top'; 
// 注意：腾讯云 COS 的结构通常是 https://<domain>/<key>。
// 如果你的 COS 根目录下直接就是 exhibitions 文件夹，那么路径应该是 https://static.latentspace.top/exhibitions/...
// 之前的 supabase 路径包含 /storage/v1/object/public/，这部分在 COS 上通常不需要（除非你把这部分也作为文件夹名上传了）。
// 根据之前的迁移经验，我们假设文件在 COS 上的路径是 /exhibitions/...

async function migrate() {
  console.log('Starting migration...');

  // 1. Migrate Photos
  const { data: photos, error: pError } = await supabase
    .from('photos')
    .select('id, url')
    .ilike('url', '%supabase.co%');

  if (pError) {
    console.error('Error fetching photos:', pError);
  } else {
    console.log(`Found ${photos.length} photos to migrate.`);
    for (const p of photos) {
      // Replace Supabase URL with CDN URL
      // Original: https://kvjmgtigzilketuaigwi.supabase.co/storage/v1/object/public/exhibitions/UUID/FILE.jpg
      // Target:   https://static.latentspace.top/exhibitions/UUID/FILE.jpg
      
      let newUrl = p.url.replace(OLD_DOMAIN, `${NEW_DOMAIN}/exhibitions`);
      // Remove query params if any (optional, but cleaner)
      newUrl = newUrl.split('?')[0];

      const { error: updateError } = await supabase
        .from('photos')
        .update({ url: newUrl })
        .eq('id', p.id);

      if (updateError) console.error(`Failed to update photo ${p.id}:`, updateError);
      else console.log(`Migrated photo ${p.id}`);
    }
  }

  // 2. Migrate Exhibition Covers
  const { data: exhibitions, error: eError } = await supabase
    .from('exhibitions')
    .select('id, cover_url')
    .ilike('cover_url', '%supabase.co%');

  if (eError) {
    console.error('Error fetching exhibitions:', eError);
  } else {
    console.log(`Found ${exhibitions.length} exhibitions to migrate.`);
    for (const ex of exhibitions) {
      if (!ex.cover_url) continue;
      
      let newUrl = ex.cover_url.replace(OLD_DOMAIN, `${NEW_DOMAIN}/exhibitions`);
      newUrl = newUrl.split('?')[0];

      const { error: updateError } = await supabase
        .from('exhibitions')
        .update({ cover_url: newUrl })
        .eq('id', ex.id);

      if (updateError) console.error(`Failed to update exhibition ${ex.id}:`, updateError);
      else console.log(`Migrated exhibition ${ex.id}`);
    }
  }
  
  console.log('Migration complete.');
}

migrate();