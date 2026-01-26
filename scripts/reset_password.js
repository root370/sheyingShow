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

async function resetPassword() {
  const email = '1213156182@qq.com';
  const newPassword = 'password123';
  
  console.log(`Resetting password for user: ${email} to '${newPassword}'`);

  // 1. Get User ID
  const { data: { users }, error } = await supabase.auth.admin.listUsers();
  
  if (error) {
    console.error('Error listing users:', error);
    return;
  }

  const user = users.find(u => u.email === email);

  if (!user) {
    console.log('❌ User NOT found.');
    return;
  }

  // 2. Update Password
  const { data, error: updateError } = await supabase.auth.admin.updateUserById(
    user.id,
    { password: newPassword }
  );

  if (updateError) {
    console.error('Error updating password:', updateError);
  } else {
    console.log('✅ Password updated successfully!');
    console.log(`New password: ${newPassword}`);
  }
}

resetPassword();
