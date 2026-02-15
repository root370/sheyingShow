const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  "https://kvjmgtigzilketuaigwi.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt2am1ndGlnemlsa2V0dWFpZ3dpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgxMDIyMzYsImV4cCI6MjA4MzY3ODIzNn0.53GjpHrxLSpz6DWCAJuAhB-oMem4zeWwS_AFa6DBmaQ"
);

async function checkPhotoUrls() {
  const { data, error } = await supabase
    .from('photos')
    .select('id, url')
    .limit(5);

  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Sample Photos:', JSON.stringify(data, null, 2));
    
    // Check if any URL is NOT using CDN
    const nonCdnPhotos = data.filter(p => !p.url.includes('static.latentspace.top') && !p.url.includes('myqcloud.com'));
    
    if (nonCdnPhotos.length > 0) {
        console.log('\n⚠️ WARNING: Found photos NOT using CDN:');
        console.log(nonCdnPhotos);
    } else {
        console.log('\n✅ All sample photos are using CDN (or myqcloud.com).');
    }
  }
}

checkPhotoUrls();