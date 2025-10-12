// Import required packages
const express = require('express');
const axios = require('axios');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { generateToken, verifyToken } = require('./utils');
const {
    createUser,
    findUserByEmail,
    findUserById,
    saveWhatsAppAccount,
    getWhatsAppAccountsByUserId,
    getWhatsAppAccountByWabaId,
    saveWebhookConfig,
    getWebhookConfigByWabaId,
    getWebhookConfigsByUserId
} = require('./db-supabase');
require('dotenv').config();

// --- NEW: Startup Environment Variable Check ---
// Ensures all necessary variables are set before starting the server.
const requiredEnvVars = ['META_APP_ID', 'META_APP_SECRET', 'HOST_URL', 'WEBHOOK_VERIFY_TOKEN'];
for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
        console.error(`FATAL ERROR: Environment variable ${envVar} is not set.`);
        process.exit(1);
    }
}

// Initialize the Express app
const app = express();
const PORT = process.env.PORT || 3000;
const META_API_VERSION = 'v20.0';

// Middleware to parse JSON and serve static files
app.use(express.json());
app.use(express.static('.'));

// CORS middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'http://localhost:5173');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Middleware to authenticate routes
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        return res.status(401).json({ success: false, error: 'Access token required' });
    }

    try {
        const decoded = verifyToken(token);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(403).json({ success: false, error: 'Invalid token' });
    }
};

// --- Authentication Routes ---

// Signup route
app.post('/api/auth/signup', async (req, res) => {
    try {
        const { email, password, name } = req.body;

        // Validate input
        if (!email || !password || !name) {
            return res.status(400).json({ success: false, error: 'Email, password, and name are required' });
        }

        // Check if user already exists
        const existingUser = await findUserByEmail(email);
        if (existingUser) {
            return res.status(400).json({ success: false, error: 'User already exists with this email' });
        }

        // Create user
        const user = await createUser(email, password, name);
        
        // Generate token
        const token = generateToken(user);

        res.status(201).json({
            success: true,
            message: 'User created successfully',
            user: {
                id: user.id,
                email: user.email,
                name: user.name
            },
            token
        });
    } catch (error) {
        console.error('Error during signup:', error);
        res.status(500).json({ success: false, error: 'Failed to create user' });
    }
});

// Login route
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validate input
        if (!email || !password) {
            return res.status(400).json({ success: false, error: 'Email and password are required' });
        }

        // Find user
        const user = await findUserByEmail(email);
        if (!user) {
            return res.status(400).json({ success: false, error: 'Invalid credentials' });
        }

        // Check password
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(400).json({ success: false, error: 'Invalid credentials' });
        }

        // Generate token
        const token = generateToken(user);

        res.json({
            success: true,
            message: 'Login successful',
            user: {
                id: user.id,
                email: user.email,
                name: user.name
            },
            token
        });
    } catch (error) {
        console.error('Error during login:', error);
        res.status(500).json({ success: false, error: 'Failed to login' });
    }
});

// Get user profile
app.get('/api/auth/profile', authenticateToken, async (req, res) => {
    try {
        const user = await findUserById(req.user.id);
        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }

        // Remove password from response
        const { password, ...userWithoutPassword } = user;

        res.json({
            success: true,
            user: userWithoutPassword
        });
    } catch (error) {
        console.error('Error fetching profile:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch profile' });
    }
});

// --- Helper Functions to initiate Syncs ---
async function initiateContactSync(phoneNumberId, accessToken) {
    console.log(`🔄 Initiating CONTACT sync for Phone Number ID: ${phoneNumberId}`);
    try {
        await axios.post(
            `https://graph.facebook.com/${META_API_VERSION}/${phoneNumberId}/smb_app_data`,
            { messaging_product: "whatsapp", sync_type: "smb_app_state_sync" },
            { headers: { 'Authorization': `Bearer ${accessToken}` } }
        );
        console.log('✅ Contact sync initiated successfully.');
    } catch (error) {
        console.error('❌ Failed to initiate contact sync:', error.response ? error.response.data.error.message : error.message);
    }
}

async function initiateHistorySync(phoneNumberId, accessToken) {
    console.log(`🔄 Initiating HISTORY sync for Phone Number ID: ${phoneNumberId}`);
    try {
        await axios.post(
            `https://graph.facebook.com/${META_API_VERSION}/${phoneNumberId}/smb_app_data`,
            { messaging_product: "whatsapp", sync_type: "history" },
            { headers: { 'Authorization': `Bearer ${accessToken}` } }
        );
        console.log('✅ History sync initiated successfully.');
    } catch (error) {
        console.error('❌ Failed to initiate history sync:', error.response ? error.response.data.error.message : error.message);
    }
}

// --- Main Onboarding Endpoint for Embedded Signup v4 ---
app.post('/complete-onboarding-v4', authenticateToken, async (req, res) => {
    try {
        console.log('=== Starting Onboarding Process ===');
        console.log('User ID:', req.user.id);
        console.log('Request body:', JSON.stringify(req.body, null, 2));
        
        const { code, sessionInfo } = req.body;
        console.log('Received request with code:', code ? 'YES' : 'NO');
        console.log('Received request with sessionInfo:', sessionInfo ? 'YES' : 'NO');
        
        if (!code || !sessionInfo) {
            console.error('Missing required parameters:', { code: !!code, sessionInfo: !!sessionInfo });
            return res.status(400).json({ error: 'Authorization code or session info is missing.' });
        }

        const { phone_number_id: phoneNumberId, waba_id: wabaId } = sessionInfo;
        const APP_ID = process.env.META_APP_ID;
        const APP_SECRET = process.env.META_APP_SECRET;
        
        console.log('Session Info Details:', { phoneNumberId, wabaId });
        
        // Validate required session info
        if (!phoneNumberId || !wabaId) {
            console.error('Missing required session info:', { phoneNumberId: !!phoneNumberId, wabaId: !!wabaId });
            return res.status(400).json({ error: 'Missing required session information (phone_number_id or waba_id).' });
        }
        
        // Log the code (first few characters for security)
        console.log('Authorization code (first 20 chars):', code.substring(0, Math.min(20, code.length)));
        console.log('Session Info:', JSON.stringify(sessionInfo, null, 2));
        
        // Validate the code
        if (!code || code.length < 10) {
            console.error('Invalid authorization code:', code);
            return res.status(400).json({ 
                success: false, 
                error: 'Invalid authorization code provided.' 
            });
        }
        
        // For Facebook Embedded Signup, use the standard Facebook redirect URI
        const redirectUri = `${process.env.HOST_URL}/complete-onboarding-v4}`;
        
        console.log('Using redirect_uri:', redirectUri);

        // Exchange the authorization code for a short-lived access token
        let tokenResponse;
        try {
            console.log('Exchanging code for short-lived token...');
            tokenResponse = await axios.get(`https://graph.facebook.com/${META_API_VERSION}/oauth/access_token`, {
                params: {
                    client_id: APP_ID,
                    client_secret: APP_SECRET,
                    // redirect_uri: redirectUri,
                    code: code
                }
            });
            console.log('✅ Short-Lived Access Token received.');
            console.log('Token response:', JSON.stringify(tokenResponse.data, null, 2));
        } catch (error) {
            console.error('❌ Error during token exchange:');
            if (axios.isAxiosError(error) && error.response) {
                console.error(`Status: ${error.response.status}`);
                console.error('Data:', JSON.stringify(error.response.data, null, 2));
                // Log specific error messages
                if (error.response.data && error.response.data.error) {
                    console.error('Facebook error code:', error.response.data.error.code);
                    console.error('Facebook error message:', error.response.data.error.message);
                    console.error('Facebook error type:', error.response.data.error.type);
                    console.error('Facebook error fbtrace_id:', error.response.data.error.fbtrace_id);
                }
            } else {
                console.error(error);
            }
            return res.status(500).json({ 
                success: false, 
                error: 'Failed to exchange code for token.' 
            });
        }

        const shortLivedToken = tokenResponse.data.access_token;
        console.log('✅ Short-Lived Access Token received.');

        // --- Step 2: Exchange the short-lived token for a LONG-LIVED token ---
        console.log('Exchanging short-lived token for long-lived token...');
        const longLivedTokenResponse = await axios.get(`https://graph.facebook.com/${META_API_VERSION}/oauth/access_token`, {
            params: {
                grant_type: 'fb_exchange_token',
                client_id: APP_ID,
                client_secret: APP_SECRET,
                fb_exchange_token: shortLivedToken
            }
        });
        const longLivedAccessToken = longLivedTokenResponse.data.access_token;
        console.log('✅ Long-Lived Access Token received. This is the token to save!');

        // Step 3: Use the IDs from the sessionInfo payload.
        console.log(`Received WABA ID: ${wabaId} and Phone Number ID: ${phoneNumberId} from frontend.`);
            
        // Save the `longLivedAccessToken`, `wabaId`, and `phoneNumberId` to your database.
        // This long-lived token is crucial for making API calls in the future.
        console.log('Saving WhatsApp account to database (first save)...');
        await saveWhatsAppAccount(
            req.user.id,
            wabaId,
            phoneNumberId,
            longLivedAccessToken,
            null // We'll generate the API key next
        );
        console.log('✅ First save completed successfully.');

        // Step 4: Generate your platform's unique API key for the user.
        const platformApiKey = `wsk_${crypto.randomBytes(32).toString('hex')}`;
        console.log(`🔑 Generated a new safe API key for the user: ${platformApiKey}`);
            
        // Save this `platformApiKey` to the user's record in your database.
        console.log('Updating WhatsApp account with platform API key (second save)...');
        await saveWhatsAppAccount(
            req.user.id,
            wabaId,
            phoneNumberId,
            longLivedAccessToken,
            platformApiKey
        );
        console.log('✅ Second save completed successfully.');

        // Step 5: Initiate data syncs in the background using the long-lived token.
        console.log('Initiating contact and history syncs...');
        initiateContactSync(phoneNumberId, longLivedAccessToken);
        initiateHistorySync(phoneNumberId, longLivedAccessToken);

        // Step 6: Send a success response back to the user.
        console.log('=== Onboarding Process Completed Successfully ===');
        res.json({
            success: true,
            platformApiKey: platformApiKey,
            wabaId: wabaId,
            // Include the tokens in the response for debugging
            shortLivedToken: shortLivedToken,
            longLivedAccessToken: longLivedAccessToken,
            phoneNumberId: phoneNumberId
        });
    } catch (error) {
        // --- Improved Error Handling ---
        console.error('❌ Error during v4 onboarding flow:');
        if (axios.isAxiosError(error) && error.response) {
            console.error(`Status: ${error.response.status}`);
            console.error('Data:', JSON.stringify(error.response.data, null, 2));
        } else {
            console.error(error);
        }
        res.status(500).json({ success: false, error: 'Failed to complete onboarding due to an internal server error.' });
    }
});

// --- Webhook Endpoint ---
app.get('/whatsapp-webhooks', (req, res) => {
    if (req.query['hub.mode'] === 'subscribe' && req.query['hub.verify_token'] === process.env.WEBHOOK_VERIFY_TOKEN) {
        console.log('✅ Webhook Verified');
        res.status(200).send(req.query['hub.challenge']);
    } else {
        res.sendStatus(403);
    }
});

// Central Webhook Endpoint - Implements the "fan-out" approach
app.post('/whatsapp-webhooks', async (req, res) => {
    console.log('--- Incoming Webhook ---');
    console.log(JSON.stringify(req.body, null, 2));
    
    try {
        // Process webhook and identify which client it belongs to
        const body = req.body;
        if (body.entry && body.entry[0].changes) {
            const entry = body.entry[0];
            const wabaId = entry.id; // WhatsApp Business Account ID
            
            console.log(`Received webhook for WABA ID: ${wabaId}`);
            
            // Process each change in the webhook
            for (const change of entry.changes) {
                // Extract phone number information if available
                let phoneNumberId = null;
                let displayPhoneNumber = null;
                if (change.value && change.value.metadata) {
                    phoneNumberId = change.value.metadata.phone_number_id;
                    displayPhoneNumber = change.value.metadata.display_phone_number;
                }
                
                // Forward to customer-specific endpoint
                await forwardWebhookToCustomer(wabaId, phoneNumberId, displayPhoneNumber, change);
            }
        }
        
        // Acknowledge receipt of webhook
        res.sendStatus(200);
    } catch (error) {
        console.error('Error processing webhook:', error);
        res.sendStatus(500);
    }
});

// Function to forward webhooks to customer-specific endpoints
async function forwardWebhookToCustomer(wabaId, phoneNumberId, displayPhoneNumber, webhookData) {
    console.log(`Forwarding webhook for WABA ID: ${wabaId}, Phone Number ID: ${phoneNumberId}`);
    
    // In a real implementation, you would:
    // 1. Look up the customer in your database using the wabaId
    // 2. Get their forwarding URL or other delivery preferences
    // 3. Forward the webhook data to them
    
    // Example implementation:
    try {
        // This is where you would look up customer information from your database
        // For now, we'll use a placeholder implementation
        const customerInfo = await getWebhookConfigByWabaId(wabaId);
        
        if (customerInfo && customerInfo.webhook_url) {
            // Forward to customer's webhook URL (Option A: Push Method)
            await forwardToCustomerWebhook(customerInfo.webhook_url, {
                wabaId,
                phoneNumberId,
                displayPhoneNumber,
                webhookData
            });
        } else if (customerInfo && customerInfo.apiAccess) {
            // Store in database for customer to pull (Option B: Pull Method)
            await storeWebhookForCustomer(wabaId, {
                wabaId,
                phoneNumberId,
                displayPhoneNumber,
                webhookData,
                timestamp: new Date()
            });
        } else {
            console.log(`No forwarding configuration found for WABA ID: ${wabaId}`);
        }
    } catch (error) {
        console.error(`Error forwarding webhook for WABA ID ${wabaId}:`, error);
    }
}

// Placeholder function to get customer info by WABA ID
// In a real implementation, this would query your database
async function getCustomerInfoByWabaId(wabaId) {
    // This is a placeholder - you would implement this to query your database
    console.log(`Looking up customer info for WABA ID: ${wabaId}`);
    
    // Example customer data structure:
    const customerDatabase = {
        '123456789012345': {
            id: 'customer1',
            name: 'Customer One',
            webhookUrl: 'https://customer1.example.com/whatsapp-webhook',
            apiAccess: true
        },
        '987654321098765': {
            id: 'customer2',
            name: 'Customer Two',
            webhookUrl: 'https://customer2.example.com/whatsapp-webhook',
            apiAccess: false
        }
    };
    
    return customerDatabase[wabaId];
}

// Function to forward to customer's webhook URL
async function forwardToCustomerWebhook(webhookUrl, data) {
    try {
        console.log(`Forwarding to customer webhook: ${webhookUrl}`);
        
        // Forward the webhook data to the customer's endpoint
        const response = await axios.post(webhookUrl, data, {
            timeout: 5000, // 5 second timeout
            headers: {
                'Content-Type': 'application/json'
                // You might want to add authentication headers here
                // 'X-Signature': generateSignature(data) // Example of adding a signature
            }
        });
        
        console.log(`Successfully forwarded to ${webhookUrl} - Status: ${response.status}`);
        return { success: true, status: response.status };
    } catch (error) {
        console.error(`Failed to forward to ${webhookUrl}:`, error.message);
        
        // Log more details about the error
        if (error.response) {
            console.error(`Response status: ${error.response.status}`);
            console.error(`Response data: ${JSON.stringify(error.response.data)}`);
        }
        
        return { success: false, error: error.message };
    }
}

// Function to store webhook for customer to pull via API
async function storeWebhookForCustomer(wabaId, data) {
    try {
        console.log(`Storing webhook data for WABA ID: ${wabaId}`);
        
        // In a real implementation, you would store this in a database
        // Example with a simple in-memory store:
        if (!global.customerWebhooks) {
            global.customerWebhooks = {};
        }
        
        if (!global.customerWebhooks[wabaId]) {
            global.customerWebhooks[wabaId] = [];
        }
        
        global.customerWebhooks[wabaId].push(data);
        
        console.log(`Successfully stored webhook for WABA ID: ${wabaId}`);
        return { success: true };
    } catch (error) {
        console.error(`Failed to store webhook for WABA ID ${wabaId}:`, error.message);
        return { success: false, error: error.message };
    }
}

// API endpoint for customers to pull their messages (Option B: Pull Method)
app.get('/api/v1/messages/:wabaId', async (req, res) => {
    try {
        const { wabaId } = req.params;
        const { apiKey } = req.headers;
        
        // In a real implementation, you would authenticate the customer using the API key
        // and verify they have access to the requested WABA ID
        
        // For this example, we'll skip authentication
        console.log(`Customer requesting messages for WABA ID: ${wabaId}`);
        
        // Retrieve stored messages
        const messages = global.customerWebhooks && global.customerWebhooks[wabaId] 
            ? global.customerWebhooks[wabaId] 
            : [];
        
        res.json({
            success: true,
            wabaId,
            messageCount: messages.length,
            messages
        });
    } catch (error) {
        console.error('Error retrieving messages:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to retrieve messages'
        });
    }
});

// API endpoint to get connected WhatsApp accounts for a user
app.get('/api/whatsapp/accounts', authenticateToken, async (req, res) => {
    try {
        const accounts = await getWhatsAppAccountsByUserId(req.user.id);
        
        res.json({
            success: true,
            accounts: accounts
        });
    } catch (error) {
        console.error('Error fetching WhatsApp accounts:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch WhatsApp accounts'
        });
    }
});

// API endpoint to get details of a specific WhatsApp account
app.get('/api/whatsapp/accounts/:wabaId', authenticateToken, async (req, res) => {
    try {
        const { wabaId } = req.params;
        
        // First verify that this account belongs to the user
        const account = await getWhatsAppAccountByWabaId(wabaId);
        
        if (!account) {
            return res.status(404).json({
                success: false,
                error: 'Account not found'
            });
        }
        
        // Check if the account belongs to the current user
        if (account.user_id !== req.user.id) {
            return res.status(403).json({
                success: false,
                error: 'Access denied'
            });
        }
        
        res.json({
            success: true,
            account: account
        });
    } catch (error) {
        console.error('Error fetching WhatsApp account details:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch WhatsApp account details'
        });
    }
});

// --- Start the Server ---
app.listen(PORT, () => {
    console.log(`🚀 Server is running on http://localhost:${PORT}`);
});