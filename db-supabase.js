const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Initialize Supabase client
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_KEY
);

// User functions
const createUser = async (email, password, name) => {
    try {
        // Check if user already exists
        const { data: existingUser, error: fetchError } = await supabase
            .from('users')
            .select('*')
            .eq('email', email)
            .maybeSingle();

        if (fetchError) {
            throw new Error(fetchError.message);
        }

        if (existingUser) {
            throw new Error('User already exists with this email');
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create new user
        const { data, error } = await supabase
            .from('users')
            .insert([
                {
                    email: email,
                    password: hashedPassword,
                    name: name
                }
            ])
            .select()
            .single();

        if (error) {
            throw new Error(error.message);
        }

        // Remove password from returned data
        const { password: _, ...userWithoutPassword } = data;
        return userWithoutPassword;
    } catch (error) {
        throw new Error(error.message);
    }
};

const findUserByEmail = async (email) => {
    try {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('email', email)
            .maybeSingle();

        if (error) {
            throw new Error(error.message);
        }

        return data;
    } catch (error) {
        throw new Error(error.message);
    }
};

const findUserById = async (id) => {
    try {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', id)
            .maybeSingle();

        if (error) {
            throw new Error(error.message);
        }

        // Remove password from returned data
        if (data) {
            const { password: _, ...userWithoutPassword } = data;
            return userWithoutPassword;
        }

        return data;
    } catch (error) {
        throw new Error(error.message);
    }
};

// WhatsApp account functions
const saveWhatsAppAccount = async (userId, wabaId, phoneNumberId, accessToken, platformApiKey) => {
    try {
        console.log('Attempting to save WhatsApp account:', { userId, wabaId, phoneNumberId, accessToken: accessToken ? '***' : null, platformApiKey: platformApiKey ? '***' : null });
        
        // Use upsert to insert or update
        const { data, error } = await supabase
            .from('whatsapp_accounts')
            .upsert([
                {
                    user_id: userId,
                    waba_id: wabaId,
                    phone_number_id: phoneNumberId,
                    access_token: accessToken,
                    platform_api_key: platformApiKey
                }
            ], {
                onConflict: 'waba_id'
            })
            .select()
            .single();

        if (error) {
            console.error('Database error when saving WhatsApp account:', error);
            throw new Error(error.message);
        }

        console.log('Successfully saved WhatsApp account:', data);
        return data;
    } catch (error) {
        console.error('Exception when saving WhatsApp account:', error);
        throw new Error(error.message);
    }
};

const getWhatsAppAccountsByUserId = async (userId) => {
    try {
        const { data, error } = await supabase
            .from('whatsapp_accounts')
            .select('*')
            .eq('user_id', userId);

        if (error) {
            throw new Error(error.message);
        }

        return data;
    } catch (error) {
        throw new Error(error.message);
    }
};

const getWhatsAppAccountByWabaId = async (wabaId) => {
    try {
        const { data, error } = await supabase
            .from('whatsapp_accounts')
            .select('*')
            .eq('waba_id', wabaId)
            .maybeSingle();

        if (error) {
            throw new Error(error.message);
        }

        return data;
    } catch (error) {
        throw new Error(error.message);
    }
};

// Webhook configuration functions
const saveWebhookConfig = async (userId, wabaId, webhookUrl, apiAccess, apiKey) => {
    try {
        // Use upsert to insert or update
        const { data, error } = await supabase
            .from('webhook_configs')
            .upsert([
                {
                    user_id: userId,
                    waba_id: wabaId,
                    webhook_url: webhookUrl,
                    api_access: apiAccess,
                    api_key: apiKey
                }
            ], {
                onConflict: 'waba_id'
            })
            .select()
            .single();

        if (error) {
            throw new Error(error.message);
        }

        return data;
    } catch (error) {
        throw new Error(error.message);
    }
};

const getWebhookConfigByWabaId = async (wabaId) => {
    try {
        const { data, error } = await supabase
            .from('webhook_configs')
            .select('*')
            .eq('waba_id', wabaId)
            .maybeSingle();

        if (error) {
            throw new Error(error.message);
        }

        return data;
    } catch (error) {
        throw new Error(error.message);
    }
};

const getWebhookConfigsByUserId = async (userId) => {
    try {
        const { data, error } = await supabase
            .from('webhook_configs')
            .select('*')
            .eq('user_id', userId);

        if (error) {
            throw new Error(error.message);
        }

        return data;
    } catch (error) {
        throw new Error(error.message);
    }
};

module.exports = {
    createUser,
    findUserByEmail,
    findUserById,
    saveWhatsAppAccount,
    getWhatsAppAccountsByUserId,
    getWhatsAppAccountByWabaId,
    saveWebhookConfig,
    getWebhookConfigByWabaId,
    getWebhookConfigsByUserId
};