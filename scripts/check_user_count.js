
const fetch = require('node-fetch');
global.fetch = fetch;
global.Headers = fetch.Headers;
global.Request = fetch.Request;
global.Response = fetch.Response;

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://kvjmgtigzilketuaigwi.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt2am1ndGlnemlsa2V0dWFpZ3dpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODEwMjIzNiwiZXhwIjoyMDgzNjc4MjM2fQ.fjHjilgHH8n9j84EFNoKXFeIU-vn1cQFl8NdXxJ7_aI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkUserCount() {
  try {
    const { count, error } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    if (error) {
      console.error('Error fetching profiles:', error);
      return;
    }

    console.log(`Total registered users (profiles): ${count}`);
    
    // Also fetch the usernames to be helpful
    const { data: users, error: usersError } = await supabase
        .from('profiles')
        .select('username, created_at')
        .order('created_at', { ascending: false })
        .limit(5);

    if (users) {
        console.log('Recent users:');
        users.forEach(u => console.log(`- ${u.username} (joined ${new Date(u.created_at).toLocaleDateString()})`));
    }

  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

checkUserCount();
