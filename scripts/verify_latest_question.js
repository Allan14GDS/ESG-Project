require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Error: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in environment variables.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyLatest() {
    console.log('Fetching latest question from book_questions...');

    const { data: questions, error } = await supabase
        .from('book_questions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1);

    if (error) {
        console.error('Error fetching questions:', error);
        return;
    }

    if (!questions || questions.length === 0) {
        console.log('No questions found.');
        return;
    }

    const q = questions[0];
    console.log('\n--- LATEST QUESTION ---');
    console.log('ID:', q.id);
    console.log('Label:', q.label);
    console.log('Created At:', q.created_at);
    console.log('Metadata V2:', JSON.stringify(q.metadata_v2, null, 2));

    console.log('\n--- VERIFICATION ---');
    if (q.metadata_v2) {
        if (q.metadata_v2.framework_1 || q.metadata_v2.sub_framework_1) {
            console.log('✅ Metadata V2 contains Framework 1 data.');
        } else {
            console.log('⚠️ Metadata V2 does NOT contain Framework 1 data (maybe not filled?).');
        }

        if (q.metadata_v2.legacy_sub_frameworks) {
            console.log('ℹ️ Legacy sub_frameworks field exists.');
        }
    } else {
        console.log('❌ Metadata V2 is missing!');
    }
}

verifyLatest();
