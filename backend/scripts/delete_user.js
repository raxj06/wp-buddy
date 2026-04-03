const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_KEY
);

async function deleteUser(email) {
    console.log(`Searching for user: ${email}`);
    const { data, error } = await supabase
        .from('users')
        .delete()
        .eq('email', email);

    if (error) {
        console.error('Error deleting user:', error);
    } else {
        console.log(`Successfully deleted user: ${email}`);
    }
}

const emailToDelete = process.argv[2];
if (!emailToDelete) {
    console.error('Please provide an email to delete.');
    process.exit(1);
}

deleteUser(emailToDelete);
