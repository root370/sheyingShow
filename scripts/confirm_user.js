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

async function confirmUser() {
  const email = '1213156182@qq.com';
  console.log(`Finding user: ${email}`);

  // Get user ID
  const { data: { users }, error } = await supabase.auth.admin.listUsers();
  if (error) {
    console.error('Error listing users:', error);
    return;
  }

  const user = users.find(u => u.email === email);

  if (!user) {
    console.log('User not found.');
    return;
  }

  console.log(`Found user ${user.id}. Confirming email...`);

  // Manually confirm the email
  const { data, error: updateError } = await supabase.auth.admin.updateUserById(
    user.id,
    { email_confirm: true }
  );

  if (updateError) {
    console.error('Error confirming user:', updateError);
  } else {
    console.log('✅ User email confirmed successfully!');
  }
}

confirmUser();
