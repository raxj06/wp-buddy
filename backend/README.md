# Backend

This directory contains all backend server files for the WhatsApp application.

## Structure

- `server.js` - Main Express server and API routes
- `db.js` - SQLite database functions
- `db-supabase.js` - Supabase database functions
- `utils.js` - JWT token utilities
- `check-db.js` - Database checking utility
- `db/` - Database files directory

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create a `.env` file in this directory with the required environment variables:
   - `META_APP_ID`
   - `META_APP_SECRET`
   - `HOST_URL`
   - `WEBHOOK_VERIFY_TOKEN`
   - `JWT_SECRET`
   - `SUPABASE_URL` (if using Supabase)
   - `SUPABASE_KEY` (if using Supabase)
   - `PORT` (optional, defaults to 3000)

3. Start the server:
   ```bash
   npm start
   ```

## API Endpoints

- `POST /api/auth/signup` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile (requires authentication)
- `POST /complete-onboarding-v4` - Complete WhatsApp onboarding (requires authentication)
- `GET /whatsapp-webhooks` - Webhook verification
- `POST /whatsapp-webhooks` - Webhook receiver
- `GET /api/whatsapp/accounts` - Get user's WhatsApp accounts (requires authentication)
- `GET /api/whatsapp/accounts/:wabaId` - Get specific WhatsApp account (requires authentication)

