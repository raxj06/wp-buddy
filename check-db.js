const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Initialize Supabase client
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_KEY
);

async function checkDatabase() {
    try {
        console.log('Checking database tables...');
        
        // Check users table
        console.log('\n--- Users Table ---');
        const { data: users, error: usersError } = await supabase
            .from('users')
            .select('*');

        if (usersError) {
            console.error('Error fetching users:', usersError);
        } else {
            console.log('Users count:', users.length);
            console.log('Users:', users);
        }

        // Check whatsapp_accounts table
        console.log('\n--- WhatsApp Accounts Table ---');
        const { data: accounts, error: accountsError } = await supabase
            .from('whatsapp_accounts')
            .select('*');

        if (accountsError) {
            console.error('Error fetching WhatsApp accounts:', accountsError);
        } else {
            console.log('WhatsApp accounts count:', accounts.length);
            console.log('WhatsApp accounts:', accounts);
        }

        // Check webhook_configs table
        console.log('\n--- Webhook Configs Table ---');
        const { data: webhooks, error: webhooksError } = await supabase
            .from('webhook_configs')
            .select('*');

        if (webhooksError) {
            console.error('Error fetching webhook configs:', webhooksError);
        } else {
            console.log('Webhook configs count:', webhooks.length);
            console.log('Webhook configs:', webhooks);
        }
    } catch (error) {
        console.error('Exception during database check:', error);
    }
}

checkDatabase();