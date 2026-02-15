const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://kvjmgtigzilketuaigwi.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt2am1ndGlnemlsa2V0dWFpZ3dpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODEwMjIzNiwiZXhwIjoyMDgzNjc4MjM2fQ.fjHjilgHH8n9j84EFNoKXFeIU-vn1cQFl8NdXxJ7_aI';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkAnalysisTable() {
  console.log("Checking photo_analysis table...");
  
  const { data, error } = await supabase
    .from('photo_analysis')
    .select('*')
    .limit(5);

  if (error) {
    console.error("Error fetching photo_analysis:", error);
  } else {
    console.log(`Found ${data.length} records.`);
    if (data.length > 0) {
        console.log("Sample record:", data[0]);
    }
  }
}

checkAnalysisTable();
