
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

async function checkUser(email) {
  console.log(`Checking user with email: ${email}`);
  
  // 1. Check Auth Users (Supabase Auth)
  const { data: { users }, error } = await supabaseAdmin.auth.admin.listUsers();
  
  if (error) {
    console.error('Error listing users:', error);
    return;
  }
  
  const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
  
  if (user) {
    console.log('✅ User found in Auth system!');
    console.log(`User ID: ${user.id}`);
    console.log(`Created at: ${user.created_at}`);
    
    // 2. Check Profile (Public Table)
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
      
    if (profile) {
      console.log('✅ User Profile found in database!');
      console.log(`Username: ${profile.username}`);
    } else {
      console.log('❌ User Profile NOT found! (This is the "Database error" cause)');
      console.log('Profile error:', profileError?.message);
    }
  } else {
    console.log('❌ User NOT found in Auth system.');
  }
}

checkUser('FFlora_Ma@163.com');
