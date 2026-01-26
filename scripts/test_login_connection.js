
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Simple env parser
const envPath = path.resolve(__dirname, '../.env');
const envFile = fs.readFileSync(envPath, 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    let value = match[2].trim();
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.slice(1, -1);
    }
    env[match[1].trim()] = value;
  }
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing env vars');
  process.exit(1);
}

console.log('Testing connection to:', supabaseUrl);

const supabase = createClient(supabaseUrl, supabaseKey);

async function testLogin() {
  console.log('Attempting login with dummy credentials...');
  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'test@example.com',
    password: 'wrongpassword123'
  });

  if (error) {
    console.log('Login failed with error:');
    console.log('Status:', error.status);
    console.log('Message:', error.message);
    if (error.status === 404) {
        console.error('CRITICAL: Received 404 from Supabase Auth. The endpoint is unreachable.');
    } else {
        console.log('Connection successful, Auth service is reachable (returned ' + error.status + ').');
    }
  } else {
    console.log('Login successful (unexpected for dummy user)');
  }
}

testLogin();
