const axios = require('axios');
const { getMessages, createMessage, getWhatsAppAccountByWabaId, getContactById } = require('../db-supabase');

const META_API_VERSION = 'v20.0';

exports.getMessages = async (req, res) => {
    try {
        const messages = await getMessages(req.user.id, req.params.contactId);
        res.json({ success: true, messages });
    } catch (error) {
        console.error('Error fetching messages:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch messages' });
    }
};

exports.sendMessage = async (req, res) => {
    try {
        const { wabaId, phoneNumberId, contactId, type, body } = req.body;

        if (!wabaId || !phoneNumberId || !contactId || type !== 'text' || !body || !body.text) {
            return res.status(400).json({ success: false, error: 'Missing required message parameters' });
        }

        // 1. Get WABA Account for access token
        const account = await getWhatsAppAccountByWabaId(wabaId);
        if (!account || account.user_id !== req.user.id) {
            return res.status(403).json({ success: false, error: 'Unauthorized or account not found' });
        }

        // 2. Get Contact details to retrieve phone number
        const contact = await getContactById(req.user.id, contactId);
        if (!contact) {
            return res.status(404).json({ success: false, error: 'Contact not found' });
        }

        // 3. Call Meta API to send message
        const url = `https://graph.facebook.com/${META_API_VERSION}/${phoneNumberId}/messages`;
        const payload = {
            messaging_product: "whatsapp",
            recipient_type: "individual",
            to: contact.phone_number,
            type: "text",
            text: {
                preview_url: false,
                body: body.text
            }
        };

        let metaResponse;
        try {
            console.log(`Sending message to Meta API: ${url}`);
            metaResponse = await axios.post(url, payload, {
                headers: {
                    'Authorization': `Bearer ${account.access_token}`,
                    'Content-Type': 'application/json'
                }
            });
        } catch (metaApiError) {
            console.error('Meta API Error:', metaApiError?.response?.data || metaApiError.message);
            return res.status(500).json({ 
                success: false, 
                error: metaApiError?.response?.data?.error?.message || 'Meta API returned an error' 
            });
        }

        const waMessageId = metaResponse.data?.messages?.[0]?.id || 'unknown_meta_id_' + Date.now();

        // 4. Save to DB
        const message = await createMessage(
            req.user.id,
            wabaId,
            phoneNumberId,
            contactId,
            'outbound',
            type,
            body,
            'sent',
            waMessageId
        );

        // 5. AUTO-PAUSE BOT: Mark bot as paused for this contact since an agent handled it
        const { updateContactAttributes } = require('../db-supabase');
        await updateContactAttributes(contactId, { 
            ...(contact.attributes || {}), 
            bot_paused: true 
        });
        console.log(`  ⏸️ Auto-paused bot for contact ${contactId} after manual message.`);

        res.status(201).json({ success: true, message });
    } catch (error) {
        console.error('Error sending message:', error);
        res.status(500).json({ success: false, error: 'Failed to send message' });
    }
};

exports.sendMedia = async (req, res) => {
    try {
        const { wabaId, phoneNumberId, contactId, type } = req.body;
        const file = req.file;

        if (!wabaId || !phoneNumberId || !contactId || !file) {
            return res.status(400).json({ success: false, error: 'Missing required parameters' });
        }

        // 1. Get WABA Account for access token
        const account = await getWhatsAppAccountByWabaId(wabaId);
        if (!account || account.user_id !== req.user.id) {
            return res.status(403).json({ success: false, error: 'Unauthorized or account not found' });
        }

        // 2. Get Contact
        const contact = await getContactById(req.user.id, contactId);
        if (!contact) {
            return res.status(404).json({ success: false, error: 'Contact not found' });
        }

        // 3. Upload Media to Meta
        const uploadUrl = `https://graph.facebook.com/${META_API_VERSION}/${phoneNumberId}/media`;
        const FormData = require('form-data');
        const fs = require('fs');
        
        const formData = new FormData();
        formData.append('messaging_product', 'whatsapp');
        // File extension needs to match original or Meta complains sometimes, but we pass originalname.
        formData.append('file', fs.createReadStream(file.path), { filename: file.originalname });

        console.log(`Uploading media to Meta API: ${uploadUrl}`);
        const uploadResponse = await axios.post(uploadUrl, formData, {
            headers: {
                'Authorization': `Bearer ${account.access_token}`,
                ...formData.getHeaders()
            }
        });

        const mediaId = uploadResponse.data.id;

        // 4. Send the Media Message via Meta API
        const messageUrl = `https://graph.facebook.com/${META_API_VERSION}/${phoneNumberId}/messages`;
        const payload = {
            messaging_product: "whatsapp",
            recipient_type: "individual",
            to: contact.phone_number,
            type: type, // 'image', 'audio', etc.
        };
        
        payload[type] = { id: mediaId };

        console.log(`Sending media message to Meta API: ${messageUrl}`);
        const metaResponse = await axios.post(messageUrl, payload, {
            headers: {
                'Authorization': `Bearer ${account.access_token}`,
                'Content-Type': 'application/json'
            }
        });

        const waMessageId = metaResponse.data?.messages?.[0]?.id || 'unknown_meta_id_' + Date.now();

        // 5. Clean up local file
        fs.unlinkSync(file.path);

        // 6. Save to DB
        const message = await createMessage(
            req.user.id,
            wabaId,
            phoneNumberId,
            contactId,
            'outbound',
            type,
            { link: `Media Upload: ${file.originalname}`, id: mediaId, text: `[${type.toUpperCase()}] ${file.originalname}` },
            'sent',
            waMessageId
        );

        // 7. AUTO-PAUSE BOT
        try {
            const { updateContactAttributes: updateAttrs } = require('../db-supabase');
            await updateAttrs(contactId, { 
                ...(contact.attributes || {}), 
                bot_paused: true 
            });
            console.log(`  Set bot_paused: true for ${contactId}`);
        } catch (botErr) {
            console.error('Failed to auto-pause bot:', botErr.message);
        }

        res.status(201).json({ success: true, message });
    } catch (error) {
        console.error('Error sending media message:', error?.response?.data || error);
        // Clean up file if error
        const fs = require('fs');
        if (req.file && req.file.path && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        res.status(500).json({ success: false, error: 'Failed to send media message' });
    }
};
