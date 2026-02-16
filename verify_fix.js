const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Manually parse .env.local
const envPath = path.join(process.cwd(), '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) env[key.trim()] = value.trim().replace(/^"|"$/g, '');
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Error: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY not found in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function verify() {
    console.log('Verifying latest question metadata status...');

    // Fetch last 3 questions to see recent activity
    const { data: questions, error } = await supabase
        .from('book_questions')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(3);

    if (error) {
        console.error('Error:', error);
        return;
    }

    questions.forEach((q, i) => {
        console.log(`\n[Questão ${i + 1}]`);
        console.log('ID:', q.id);
        console.log('Label:', q.label.substring(0, 50) + (q.label.length > 50 ? '...' : ''));
        console.log('Metadata V1 Disclosure:', q.metadata?.disclosure || 'EMPTY');
        console.log('Metadata V2 Disclosure:', q.metadata_v2?.disclosure || 'EMPTY');
        console.log('Metadata V2 Framework 1:', q.metadata_v2?.framework_1 || 'EMPTY');

        const hasV2 = q.metadata_v2 ? '✅' : '❌';
        console.log(`Status Metadata V2: ${hasV2}`);

        if (q.metadata_v2?.sub_frameworks) {
            console.log('Sub-frameworks V2:', JSON.stringify(q.metadata_v2.sub_frameworks));
        }
    });
}

verify();
