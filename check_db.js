const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabaseUrl = 'https://lhwwqykueiwywutwrlnj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxod3dxeWt1ZWl3eXd1dHdybG5qIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDMwNzgxMCwiZXhwIjoyMDc1ODgzODEwfQ.yDsvPrv5fbatNxugT2MWPNZh7PfcKly-MvaWJTwe5YA';

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    const { data, error } = await supabase
        .from('book_templates')
        .select('id, name')
        .limit(1);

    if (error) {
        console.error(error);
        return;
    }
    console.log('Template ID:', data[0]?.id);
    console.log('Template Name:', data[0]?.name);
}

check();
