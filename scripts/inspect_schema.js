const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

// Load environment variables manually
const envLocalPath = path.resolve(__dirname, '../.env.local');
const envPath = path.resolve(__dirname, '../.env');

const loadEnv = (filePath) => {
    if (fs.existsSync(filePath)) {
        const config = dotenv.parse(fs.readFileSync(filePath));
        for (const k in config) {
            process.env[k] = config[k];
        }
    }
};

loadEnv(envPath);
loadEnv(envLocalPath);

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('❌ Missing environment variables.');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function inspectSchema() {
    console.log('🔍 Inspecting Database Schema...');

    const tables = ['exhibitions'];

    for (const table of tables) {
        console.log(`\nChecking table: ${table}`);
        const { data, error } = await supabase.from(table).select('*').limit(1);
        
        if (error) {
            console.log(`❌ Error: ${error.message}`);
        } else {
            console.log(`✅ Found table: ${table}`);
            if (data && data.length > 0) {
                console.log('Sample keys:', Object.keys(data[0]));
            } else {
                console.log('Table is empty, cannot infer columns.');
            }
        }
    }
}

inspectSchema();
