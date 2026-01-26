const { createClient } = require('@supabase/supabase-js');
const fetch = require('node-fetch');
if (!global.Headers) {
    global.Headers = fetch.Headers;
    global.Request = fetch.Request;
    global.Response = fetch.Response;
    global.fetch = fetch;
}

const supabaseUrl = 'https://kvjmgtigzilketuaigwi.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt2am1ndGlnemlsa2V0dWFpZ3dpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODEwMjIzNiwiZXhwIjoyMDgzNjc4MjM2fQ.fjHjilgHH8n9j84EFNoKXFeIU-vn1cQFl8NdXxJ7_aI';

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function checkUser() {
  const email = '1213156182@qq.com';
  console.log(`Checking for user: ${email}`);

  // 1. Check Auth User
  const { data: { users }, error } = await supabase.auth.admin.listUsers();
  
  if (error) {
    console.error('Error listing users:', error);
    return;
  }

  const user = users.find(u => u.email === email);

  if (user) {
    console.log('✅ User found in Auth system:');
    console.log(`   ID: ${user.id}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Confirmed At: ${user.email_confirmed_at}`);
    console.log(`   Created At: ${user.created_at}`);
    console.log(`   Metadata:`, user.user_metadata);

    // 2. Check Profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.log('❌ Profile NOT found (Trigger might have failed):', profileError.message);
    } else {
      console.log('✅ Profile found:');
      console.log(profile);
    }

  } else {
    console.log('❌ User NOT found in Auth system.');
  }
}

checkUser();
