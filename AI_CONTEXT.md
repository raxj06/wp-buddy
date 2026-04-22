# AI Context for Wappy

## Project Overview
- **Purpose**: A modern WhatsApp marketing and automation platform (WP-Buddy).
- **Tech Stack**: 
  - **Frontend**: React (Vite), Tailwind CSS, React Flow.
  - **Backend**: Node.js, Express, Socket.IO.
  - **Database**: Supabase (PostgreSQL).
  - **Integrations**: Meta WhatsApp API.
- **Architecture**: Modular Express backend with controllers and a React-based SPA frontend. Designed for split deployment (Vercel + Render).

## Current State
- **Version**: 1.0.0
- **Status**: Production Ready
- **Last Updated**: 2026-04-22

## File Structure
```
/
├── backend/                # Express backend (Deploy on Render)
│   ├── controllers/        # Route controllers
│   ├── routes/             # API routes
│   ├── services/           # Business logic (Flow engine, etc.)
│   ├── db-supabase.js      # Supabase database client and helpers
│   ├── server.js           # Server entry point
│   └── .env                # Environment variables
├── frontend-new/           # Unified React frontend (Deploy on Vercel)
│   ├── src/
│   │   ├── components/     # UI Components
│   │   ├── contexts/       # React Contexts (Auth, etc.)
│   │   ├── config.js       # Centralized Environment Config
│   │   └── App.jsx         # Main App entry
│   ├── vercel.json         # SPA routing for Vercel
│   └── vite.config.js      # Vite configuration
└── supabase-migration.sql  # SQL for database setup
```

## Key Components
### Socket.IO Real-time
- **Location**: `backend/server.js`, `backend/controllers/whatsappController.js`, `frontend-new/src/config.js`
- **Purpose**: Provides live message updates to the dashboard.
- **Notes**: Uses `VITE_SOCKET_URL` to connect to the Render backend.

### Manual Media Messaging
- **Location**: `backend/controllers/messagesController.js`
- **Purpose**: Allows users to manually send images and audio.
- **Notes**: Uses Multer for uploads and Meta's `/media` and `/messages` endpoints.

## Configuration
- **Backend (Render)**: 
  - `META_APP_ID`, `META_APP_SECRET`: Meta App credentials.
  - `HOST_URL`: Production URL for webhooks/OAuth.
  - `WEBHOOK_VERIFY_TOKEN`: Token for Meta webhook verification.
  - `SUPABASE_URL`, `SUPABASE_KEY`: Supabase project connection.
  - `JWT_SECRET`: Secret for auth tokens.
- **Frontend (Vercel)**:
  - `VITE_API_URL`: Backend API URL.
  - `VITE_SOCKET_URL`: Backend Socket URL.
  - `VITE_META_APP_ID`: Meta App ID for SDK.

## Known Issues
- None (Production ready).

## Future Improvements
- Implement persistent socket rooms/channels for multi-tenant isolation.
- Add advanced media previews in the Inbox UI.

## Development Notes
- Use `npm run dev` in `frontend-new` for UI development.
- Use `npm start` in `backend` for server development.
