// Import required packages
const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');
const dotenvResult = require('dotenv').config();

console.log('Current directory:', process.cwd());
if (dotenvResult.error) {
    console.warn('Note: .env file not found or could not be loaded. Environment variables should be provided by the host (Render/Vercel).');
} else {
    console.log('.env loaded successfully');
}

// --- Startup Environment Variable Check ---
const requiredEnvVars = ['META_APP_ID', 'META_APP_SECRET', 'WEBHOOK_VERIFY_TOKEN', 'SUPABASE_URL', 'SUPABASE_KEY', 'JWT_SECRET'];
for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
        console.error(`FATAL ERROR: Environment variable ${envVar} is not set.`);
        if (process.env.NODE_ENV === 'production') {
            process.exit(1);
        } else {
            console.warn(`Continuing in development mode, but ${envVar} is missing.`);
        }
    }
}

// Initialize the Express app
const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
    origin: '*', // For production, replace with your frontend URL
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
    credentials: true
}));
app.use(express.json());

// Initialize Socket.io
const io = new Server(server, {
    cors: {
        origin: "*", // Adjust in production to match frontend URL
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