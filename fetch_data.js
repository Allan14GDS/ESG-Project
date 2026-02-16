const https = require('https');

const SUPABASE_URL = 'https://lhwwqykueiwywutwrlnj.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxod3dxeWt1ZWl3eXd1dHdybG5qIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDMwNzgxMCwiZXhwIjoyMDc1ODgzODEwfQ.yDsvPrv5fbatNxugT2MWPNZh7PfcKly-MvaWJTwe5YA';

async function fetchData(tableName) {
    return new Promise((resolve, reject) => {
        const url = `${SUPABASE_URL}/rest/v1/${tableName}?select=*&limit=10`;
        const options = {
            headers: {
                'apikey': SUPABASE_SERVICE_ROLE_KEY,
                'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
            },
            rejectUnauthorized: false
        };

        https.get(url, options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    resolve(data);
                }
            });
        }).on('error', reject);
    });
}

async function main() {
    console.log("# Datasets Overview\n");

    const tables = ['book_questions', 'book_templates', 'book_question_junction'];

    for (const table of tables) {
        console.log(`## Table: ${table}`);
        const data = await fetchData(table);
        if (typeof data === 'string') {
            console.log("Error or raw data:", data);
        } else if (Array.isArray(data)) {
            if (data.length === 0) {
                console.log("No data found.");
            } else {
                const headers = Object.keys(data[0]);
                console.log(`| ${headers.join(' | ')} |`);
                console.log(`| ${headers.map(() => '---').join(' | ')} |`);
                data.forEach(row => {
                    const values = headers.map(h => {
                        const val = row[h];
                        if (typeof val === 'object') return JSON.stringify(val).substring(0, 20) + '...';
                        return String(val).substring(0, 50);
                    });
                    console.log(`| ${values.join(' | ')} |`);
                });
            }
        } else {
            console.log("Unexpected data format:", data);
        }
        console.log("\n");
    }
}

main();
