const axios = require('axios');
const { getWhatsAppAccountsByUserId } = require('../db-supabase');

const META_API_VERSION = 'v20.0';

exports.getCampaigns = async (req, res) => {
    try {
        const accounts = await getWhatsAppAccountsByUserId(req.user.id);
        if (!accounts || accounts.length === 0) {
            return res.status(404).json({ success: false, error: 'No WhatsApp account connected' });
        }

        const account = accounts[0]; // For simplicity, use first account
        const wabaId = account.waba_id;
        const accessToken = account.access_token;

        if (!wabaId || !accessToken) {
            return res.status(400).json({ success: false, error: 'Incomplete WhatsApp account setup' });
        }

        const url = `https://graph.facebook.com/${META_API_VERSION}/${wabaId}/message_templates`;
        const metaResponse = await axios.get(url, {
            params: { fields: 'name,status,category,language,components,rejected_reason' },
            headers: { Authorization: `Bearer ${accessToken}` }
        });

        // The Meta response has data array
        const templates = metaResponse.data.data.map(t => ({
            id: t.id,
            name: t.name,
            status: t.status.toLowerCase(), // Frontend expects lower case
            status_raw: t.status,
            category: t.category,
            language: t.language,
            components: t.components, // Keep original components for variable detection
            rejected_reason: t.rejected_reason,
            template_name: t.name, // compatibility
            scheduled_at: new Date().toISOString() // compatibility
        }));

        res.json({ success: true, campaigns: templates });
    } catch (error) {
        console.error('Error fetching templates from Meta:', error?.response?.data || error.message);
        res.status(500).json({ success: false, error: 'Failed to fetch templates from Meta' });
    }
};

exports.createCampaign = async (req, res) => {
    try {
        const { name, category, language, components } = req.body;

        if (!name || !category || !language || !components) {
            return res.status(400).json({ success: false, error: 'Missing required fields' });
        }

        const accounts = await getWhatsAppAccountsByUserId(req.user.id);
        if (!accounts || accounts.length === 0) {
            return res.status(404).json({ success: false, error: 'No WhatsApp account connected' });
        }

        const account = accounts[0];
        const wabaId = account.waba_id;
        const accessToken = account.access_token;

        const payload = {
            name: name,
            category: category,
            language: language,
            components: components
        };

        const url = `https://graph.facebook.com/${META_API_VERSION}/${wabaId}/message_templates`;
        console.log("Sending Template to Meta:", JSON.stringify(payload, null, 2));

        const metaResponse = await axios.post(url, payload, {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            }
        });

        const newTemplate = {
            id: metaResponse.data.id,
            name: name,
            status: metaResponse.data.status?.toLowerCase() || 'pending',
            category: metaResponse.data.category || category,
            template_name: name,
            scheduled_at: new Date().toISOString()
        };

        res.status(201).json({ success: true, campaign: newTemplate });
    } catch (error) {
        console.error('Error creating template in Meta:', JSON.stringify(error?.response?.data, null, 2) || error.message);
        const fbError = error?.response?.data?.error?.error_user_msg || error?.response?.data?.error?.message || 'Failed to create template';
        res.status(500).json({ success: false, error: fbError });
    }
};

const fs = require('fs');
const { parse } = require('csv-parse');

exports.broadcastCampaign = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, error: 'No CSV file uploaded' });
        }

        const { templateName, templateLanguage, variableMapping } = req.body;
        
        let mapping = {};
        if (variableMapping) {
            try {
                mapping = typeof variableMapping === 'string' ? JSON.parse(variableMapping) : variableMapping;
            } catch (e) {
                console.error("Failed to parse variableMapping:", e);
            }
        }
        
        if (!templateName || !templateLanguage) {
            if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
            return res.status(400).json({ success: false, error: 'Template name and language are required' });
        }

        const accounts = await getWhatsAppAccountsByUserId(req.user.id);
        if (!accounts || accounts.length === 0) {
            fs.unlinkSync(req.file.path);
            return res.status(404).json({ success: false, error: 'No WhatsApp account connected' });
        }

        const account = accounts[0];
        const accessToken = account.access_token;
        const phoneIdFromDb = account.phone_number_id;
        
        let phoneNumberId = phoneIdFromDb;
        
        if (!phoneNumberId) {
            // Fallback: Fetch phone numbers attached to WABA
            const wabaId = account.waba_id;
            const phoneUrl = `https://graph.facebook.com/${META_API_VERSION}/${wabaId}/phone_numbers`;
            const phoneRes = await axios.get(phoneUrl, {
                headers: { Authorization: `Bearer ${accessToken}` }
            });
            if (phoneRes.data && phoneRes.data.data && phoneRes.data.data.length > 0) {
                phoneNumberId = phoneRes.data.data[0].id;
            } else {
                 throw new Error("Could not find a WhatsApp Phone Number ID for this account. Please link it in Settings.");
            }
        }

        const results = [];
        let processed = 0;
        let successful = 0;
        const errors = [];

        fs.createReadStream(req.file.path)
            .pipe(parse({
                columns: true,
                skip_empty_lines: true,
                trim: true
            }))
            .on('data', (row) => {
                const phone = row.Phone || row.phone || row['Phone Number'] || row.phoneNumber;
                if (phone) {
                    const cleanPhone = phone.replace(/[^\d]/g, ''); // Remove + and spaces, just digits
                    if (cleanPhone) {
                        results.push({ phone: cleanPhone, row: row });
                    }
                }
            })
            .on('end', async () => {
                if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);

                if (results.length === 0) {
                    return res.status(400).json({ success: false, error: 'No valid phone numbers found in CSV.' });
                }

                console.log(`🚀 Starting broadcast to ${results.length} contacts using template: ${templateName}`);
                if (Object.keys(mapping).length > 0) {
                    console.log(`📊 With variable mapping:`, JSON.stringify(mapping));
                }

                // Send to each contact
                const url = `https://graph.facebook.com/${META_API_VERSION}/${phoneNumberId}/messages`;
                
                for (const item of results) {
                    const { phone, row } = item;
                    try {
                        const payload = {
                            messaging_product: 'whatsapp',
                            to: phone,
                            type: 'template',
                            template: {
                                name: templateName,
                                language: { code: templateLanguage }
                            }
                        };

                        // Add components if we have variable mapping
                        if (Object.keys(mapping).length > 0) {
                            const parameters = [];
                            
                            // Meta variables are 1-indexed {{1}}, {{2}}, etc.
                            // We sort correctly to ensure order
                            const sortedKeys = Object.keys(mapping).sort((a, b) => Number(a) - Number(b));
                            
                            for (const key of sortedKeys) {
                                const csvColumn = mapping[key];
                                const value = row[csvColumn] || ''; // Fallback to empty string
                                parameters.push({ type: 'text', text: value });
                            }

                            if (parameters.length > 0) {
                                payload.template.components = [{
                                    type: 'body',
                                    parameters: parameters
                                }];
                            }
                        }

                        await axios.post(url, payload, {
                            headers: {
                                'Authorization': `Bearer ${accessToken}`,
                                'Content-Type': 'application/json'
                            }
                        });
                        
                        successful++;
                        processed++;
                    } catch (err) {
                        processed++;
                        const errorMsg = err.response?.data?.error?.message || err.message;
                        console.error(`❌ Failed for ${phone}:`, errorMsg);
                        errors.push(`Failed for ${phone}: ${errorMsg}`);
                    }
                }

                res.json({
                    success: true,
                    message: `Broadcast complete. Sent: ${successful}, Failed: ${errors.length}, Total: ${processed}`,
                    errors: errors.length > 0 ? errors.slice(0, 50) : null // Cap error summary
                });
            })
            .on('error', (err) => {
                fs.unlinkSync(req.file.path);
                console.error('CSV Parsing Error:', err);
                res.status(500).json({ success: false, error: 'Failed to process CSV file' });
            });

    } catch (error) {
        if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
        console.error('Broadcast Error:', error.message);
        res.status(500).json({ success: false, error: error.message || 'Failed to start broadcast' });
    }
};
