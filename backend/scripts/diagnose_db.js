const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_KEY
);

async function diagnose() {
    console.log('--- Diagnosis Start ---');

    console.log('Checking Table Schema...');
    const { data: cols, error: colErr } = await supabase.rpc('get_column_info', { table_name: 'users' });
    // If RPC isn't available, try raw query through a simple edge function or just fetch one user and check
    
    console.log('Fetching last 5 users...');
    const { data: users, error: userErr } = await supabase
        .from('users')
        .select('*')
        .order('id', { ascending: false })
        .limit(5);

    if (userErr) {
        console.error('Error fetching users:', userErr);
    } else {
        users.forEach(u => {
            console.log(`ID: ${u.id}, Email: ${u.email}, Hash: ${u.password}, Length: ${u.password?.length}`);
        });
    }

    console.log('Checking for triggers (raw SQL)...');
    // Using an intentional error trigger to see if we can get info, OR just relying on the lengths
}

diagnose();
