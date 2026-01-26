
const fetch = require('node-fetch');
global.fetch = fetch;
global.Headers = fetch.Headers;
global.Request = fetch.Request;
global.Response = fetch.Response;

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://kvjmgtigzilketuaigwi.supabase.co';
// Using the SERVICE ROLE KEY I got earlier
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt2am1ndGlnemlsa2V0dWFpZ3dpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODEwMjIzNiwiZXhwIjoyMDgzNjc4MjM2fQ.fjHjilgHH8n9j84EFNoKXFeIU-vn1cQFl8NdXxJ7_aI';

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function testSignup() {
  const email = `test_user_${Date.now()}@example.com`;
  const password = 'Password123!';
  const username = `Tester_${Date.now()}`;
  
  console.log(`Attempting to create user: ${email}`);

  try {
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        username,
        essence_of_photography: 'Testing',
      },
    });

    if (error) {
      console.error('Signup failed:', error);
      return;
    }

    console.log('User created successfully:', data.user.id);
    
    // Now verify if profile exists
    // Give it a moment for the trigger to fire
    await new Promise(r => setTimeout(r, 2000));
    
    const { data: profile, error: profileError } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();
        
    if (profileError) {
        console.error('Profile verification failed:', profileError);
        console.log('It seems the database trigger failed to create the profile.');
    } else {
        console.log('Profile created successfully:', profile);
    }

  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

testSignup();
