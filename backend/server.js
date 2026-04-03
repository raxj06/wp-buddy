// Import required packages
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const dotenvResult = require('dotenv').config();

console.log('Current directory:', process.cwd());
if (dotenvResult.error) {
    console.error('Error loading .env file:', dotenvResult.error);
} else {
    console.log('.env loaded successfully');
    console.log('META_APP_ID:', process.env.META_APP_ID ? 'SET' : 'NOT SET');
}

// --- Startup Environment Variable Check ---
const requiredEnvVars = ['META_APP_ID', 'META_APP_SECRET', 'HOST_URL', 'WEBHOOK_VERIFY_TOKEN'];
for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
        console.error(`FATAL ERROR: Environment variable ${envVar} is not set.`);
        process.exit(1);
    }
}

// Initialize the Express app
const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3000;

// Initialize Socket.io
const io = new Server(server, {
    cors: {
        origin: "*", // Adjust in production
        methods: ["GET", "POST"]
    }
});
app.set('io', io);

io.on('connection', (socket) => {
    console.log(`🔌 Client connected to Socket.IO: ${socket.id}`);
    socket.on('disconnect', () => {
        console.log(`🔌 Client disconnected: ${socket.id}`);
    });
});

// Middleware to parse JSON
app.use(express.json());

// CORS middleware
app.use((req, res, next) => {
    // Allow all origins for development, restrict in production
    const origin = req.headers.origin;
    if (origin) {
        res.header('Access-Control-Allow-Origin', origin);
    } else {
        res.header('Access-Control-Allow-Origin', '*');
    }

    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    res.header('Access-Control-Allow-Credentials', 'true');

    if (req.method === 'OPTIONS') {
        res.sendStatus(200);
    } else {
        next();
    }
});

// --- Import Modular Routes ---
const authRoutes = require('./routes/auth');
const whatsappRoutes = require('./routes/whatsapp');
const contactsRoutes = require('./routes/contacts');
const messagesRoutes = require('./routes/messages');
const campaignsRoutes = require('./routes/campaigns');
const flowsRoutes = require('./routes/flows');
const analyticsRoutes = require('./routes/analytics');

// --- Mount Routes ---
app.use('/api/auth', authRoutes);
app.use('/api/contacts', contactsRoutes);
app.use('/api/messages', messagesRoutes);
app.use('/api/campaigns', campaignsRoutes);
app.use('/api/flows', flowsRoutes);
app.use('/api/analytics', analyticsRoutes);

// Mount WhatsApp webhooks and onboarding (Handles root paths like /whatsapp-webhooks)
app.use('/', whatsappRoutes);

// --- Start the Server ---
server.listen(PORT, () => {
    console.log(`🚀 Modular Server is running on http://localhost:${PORT}`);
});