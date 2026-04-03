const bcrypt = require('bcryptjs');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_KEY
);

async function testLogin(email, rawPassword) {
    console.log(`Testing login for: ${email}`);
    
    const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .maybeSingle();

    if (error) {
        console.error('DB Error:', error);
        return;
    }
    
    if (!user) {
        console.log('User not found.');
        return;
    }

    console.log('User found in DB.');
    console.log('Hash in DB:', user.password);
    
    const isMatch = await bcrypt.compare(rawPassword, user.password);
    console.log('Direct Bcrypt Compare Result:', isMatch);
    
    // Test what the hash WOULD be if we hashed it now
    const newHash = await bcrypt.hash(rawPassword, 10);
    console.log('New hash for same password:', newHash);
    const isMatchNew = await bcrypt.compare(rawPassword, newHash);
    console.log('Compare with new hash result:', isMatchNew);
}

const email = process.argv[2];
const password = process.argv[3];

if (!email || !password) {
    console.error('Usage: node test_login.js <email> <password>');
    process.exit(1);
}

testLogin(email, password);
