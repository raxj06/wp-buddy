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

// Update user profile function
const updateUserProfile = async (id, name) => {
    try {
        const { data, error } = await supabase
            .from('users')
            .update({ name: name })
            .eq('id', id)
            .select('*')
            .single();

        if (error) {
            throw new Error(error.message);
        }

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

const deleteWhatsAppAccount = async (userId, wabaId) => {
    try {
        const { data, error } = await supabase
            .from('whatsapp_accounts')
            .delete()
            .eq('waba_id', wabaId)
            .eq('user_id', userId);

        if (error) {
            throw new Error(error.message);
        }

        return true;
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

// Automation Flow Functions
const createFlow = async (userId, name, triggerKeyword, flowData) => {
    try {
        const { data, error } = await supabase
            .from('automation_flows')
            .insert([
                {
                    user_id: userId,
                    name: name,
                    trigger_keyword: triggerKeyword,
                    flow_data: flowData,
                    is_active: true
                }
            ])
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

const getFlowsByUserId = async (userId) => {
    try {
        const { data, error } = await supabase
            .from('automation_flows')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) {
            throw new Error(error.message);
        }
        return data;
    } catch (error) {
        throw new Error(error.message);
    }
};

const getFlowById = async (flowId) => {
    try {
        const { data, error } = await supabase
            .from('automation_flows')
            .select('*')
            .eq('id', flowId)
            .maybeSingle();

        if (error) {
            throw new Error(error.message);
        }
        return data;
    } catch (error) {
        throw new Error(error.message);
    }
};

const updateFlow = async (flowId, userId, updates) => {
    try {
        const { data, error } = await supabase
            .from('automation_flows')
            .update(updates)
            .eq('id', flowId)
            .eq('user_id', userId) // Ensure user owns the flow
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

const deleteFlow = async (flowId, userId) => {
    try {
        const { error } = await supabase
            .from('automation_flows')
            .delete()
            .eq('id', flowId)
            .eq('user_id', userId);

        if (error) {
            throw new Error(error.message);
        }
        return true;
    } catch (error) {
        throw new Error(error.message);
    }
};

// Contacts Functions
const createContact = async (userId, wabaId, phoneNumber, name, email, tags, attributes) => {
    try {
        const { data, error } = await supabase
            .from('contacts')
            .upsert([{
                user_id: userId,
                waba_id: wabaId,
                phone_number: phoneNumber,
                name: name,
                email: email,
                tags: tags || [],
                attributes: attributes || {}
            }], { onConflict: 'user_id, phone_number' })
            .select()
            .single();

        if (error) throw new Error(error.message);
        return data;
    } catch (error) {
        throw new Error(error.message);
    }
};

const getContacts = async (userId) => {
    try {
        const { data, error } = await supabase
            .from('contacts')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) throw new Error(error.message);
        return data;
    } catch (error) {
        throw new Error(error.message);
    }
};

const getContactById = async (userId, contactId) => {
    try {
        const { data, error } = await supabase
            .from('contacts')
            .select('*')
            .eq('id', contactId)
            .eq('user_id', userId)
            .single();

        if (error) throw new Error(error.message);
        return data;
    } catch (error) {
        throw new Error(error.message);
    }
};

const getContactByPhone = async (userId, phoneNumber) => {
    try {
        const { data, error } = await supabase
            .from('contacts')
            .select('*')
            .eq('user_id', userId)
            .eq('phone_number', phoneNumber)
            .maybeSingle();

        if (error) throw new Error(error.message);
        return data;
    } catch (error) {
        throw new Error(error.message);
    }
};

const updateContactAttributes = async (contactId, attributes) => {
    try {
        const { data, error } = await supabase
            .from('contacts')
            .update({ attributes: attributes })
            .eq('id', contactId)
            .select()
            .single();

        if (error) throw new Error(error.message);
        return data;
    } catch (error) {
        throw new Error(error.message);
    }
};

const addContactTag = async (contactId, tag) => {
    try {
        // Fetch current tags
        const { data: contact, error: fetchError } = await supabase
            .from('contacts')
            .select('tags')
            .eq('id', contactId)
            .single();

        if (fetchError) throw new Error(fetchError.message);

        const currentTags = contact.tags || [];
        if (currentTags.includes(tag)) {
            // Tag already exists
            return contact;
        }

        const newTags = [...currentTags, tag];

        const { data, error } = await supabase
            .from('contacts')
            .update({ tags: newTags })
            .eq('id', contactId)
            .select()
            .single();

        if (error) throw new Error(error.message);
        return data;
    } catch (error) {
        throw new Error(error.message);
    }
};

// Messages Functions
const createMessage = async (userId, wabaId, phoneNumberId, contactId, direction, type, body, status, waMessageId) => {
    try {
        const { data, error } = await supabase
            .from('messages')
            .insert([{
                user_id: userId,
                waba_id: wabaId,
                phone_number_id: phoneNumberId,
                contact_id: contactId,
                direction: direction,
                type: type,
                body: typeof body === 'object' ? JSON.stringify(body) : body,
                status: status,
                wa_message_id: waMessageId
            }])
            .select()
            .single();

        if (error) throw new Error(error.message);
        return data;
    } catch (error) {
        throw new Error(error.message);
    }
};

const getMessages = async (userId, contactId) => {
    try {
        const { data, error } = await supabase
            .from('messages')
            .select('*')
            .eq('user_id', userId)
            .eq('contact_id', contactId)
            .order('timestamp', { ascending: true });

        if (error) throw new Error(error.message);
        
        // Parse the body string back to an object if it looks like JSON
        return data.map(msg => {
            if (msg.body && typeof msg.body === 'string' && msg.body.trim().startsWith('{')) {
                try {
                    msg.body = JSON.parse(msg.body);
                } catch (e) {
                    // Keep original string if parsing fails
                }
            }
            return msg;
        });
    } catch (error) {
        throw new Error(error.message);
    }
};

const updateMessageStatus = async (waMessageId, status) => {
    try {
        const { data, error } = await supabase
            .from('messages')
            .update({ status: status })
            .eq('wa_message_id', waMessageId)
            .select();

        if (error) throw new Error(error.message);
        return data;
    } catch (error) {
        throw new Error(error.message);
    }
};

// Campaigns Functions
const createCampaign = async (userId, name, templateName, scheduledAt, audienceFilter) => {
    try {
        const { data, error } = await supabase
            .from('campaigns')
            .insert([{
                user_id: userId,
                name: name,
                template_name: templateName,
                scheduled_at: scheduledAt,
                audience_filter: audienceFilter || {}
            }])
            .select()
            .single();

        if (error) throw new Error(error.message);
        return data;
    } catch (error) {
        throw new Error(error.message);
    }
};

const getCampaigns = async (userId) => {
    try {
        const { data, error } = await supabase
            .from('campaigns')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) throw new Error(error.message);
        return data;
    } catch (error) {
        throw new Error(error.message);
    }
};

// Get all active flows (for execution engine)
const getActiveFlows = async () => {
    try {
        const { data, error } = await supabase
            .from('automation_flows')
            .select('*')
            .eq('is_active', true);

        if (error) throw new Error(error.message);
        return data;
    } catch (error) {
        throw new Error(error.message);
    }
};

// Analytics Functions
const getAnalyticsStats = async (userId) => {
    try {
        // Run multiple count queries in parallel
        const [
            sentResult,
            deliveredResult,
            readResult,
            repliedResult,
            flowsResult,
            contactsResult
        ] = await Promise.all([
            // Total Sent (outbound)
            supabase.from('messages').select('id', { count: 'exact', head: true })
                .eq('user_id', userId)
                .eq('direction', 'outbound'),
            
            // Delivered & Read (outbound)
            supabase.from('messages').select('id', { count: 'exact', head: true })
                .eq('user_id', userId)
                .eq('direction', 'outbound')
                .in('status', ['delivered', 'read']),
            
            // Read (outbound)
            supabase.from('messages').select('id', { count: 'exact', head: true })
                .eq('user_id', userId)
                .eq('direction', 'outbound')
                .eq('status', 'read'),
            
            // Replied (inbound)
            supabase.from('messages').select('id', { count: 'exact', head: true })
                .eq('user_id', userId)
                .eq('direction', 'inbound'),
            
            // Active Flows
            supabase.from('automation_flows').select('id', { count: 'exact', head: true })
                .eq('user_id', userId)
                .eq('is_active', true),
                
            // Active Contacts
            supabase.from('contacts').select('id', { count: 'exact', head: true })
                .eq('user_id', userId)
        ]);

        // Get outbound messages from last 7 days for the chart
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
        sevenDaysAgo.setHours(0, 0, 0, 0);

        const { data: recentMessages, error: chartError } = await supabase
            .from('messages')
            .select('timestamp')
            .eq('user_id', userId)
            .eq('direction', 'outbound')
            .gte('timestamp', sevenDaysAgo.toISOString());

        if (chartError) throw new Error(chartError.message);

        return {
            stats: {
                totalSent: sentResult.count || 0,
                delivered: deliveredResult.count || 0,
                read: readResult.count || 0,
                replied: repliedResult.count || 0,
                activeFlows: flowsResult.count || 0,
                activeContacts: contactsResult.count || 0,
            },
            recentMessages: recentMessages || []
        };
    } catch (error) {
        throw new Error(error.message);
    }
};

module.exports = {
    createUser,
    findUserByEmail,
    findUserById,
    updateUserProfile,
    saveWhatsAppAccount,
    getWhatsAppAccountsByUserId,
    getWhatsAppAccountByWabaId,
    deleteWhatsAppAccount,
    saveWebhookConfig,
    getWebhookConfigByWabaId,
    getWebhookConfigsByUserId,
    createFlow,
    getFlowsByUserId,
    getFlowById,
    updateFlow,
    deleteFlow,
    createContact,
    getContacts,
    getContactById,
    getContactByPhone,
    updateContactAttributes,
    createMessage,
    getMessages,
    updateMessageStatus,
    createCampaign,
    getCampaigns,
    getActiveFlows,
    getAnalyticsStats,
    addContactTag
};