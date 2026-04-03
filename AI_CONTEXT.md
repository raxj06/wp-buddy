# AI Context for Wappy

## Project Overview
- **Purpose**: A modern WhatsApp marketing and automation platform (WP-Buddy).
- **Tech Stack**: 
  - **Frontend**: React (Vite), Tailwind CSS, React Flow.
  - **Backend**: Node.js, Express, Socket.IO.
  - **Database**: Supabase (PostgreSQL).
  - **Integrations**: Meta WhatsApp API.
- **Architecture**: Modular Express backend with controllers and a React-based SPA frontend.

## Current State
- **Version**: 0.2.0
- **Status**: In Development
- **Last Updated**: 2026-04-02

## File Structure
```
/
├── backend/                # Express backend
│   ├── controllers/        # Route controllers
│   ├── routes/             # API routes
│   ├── services/           # Business logic (Flow engine, etc.)
│   ├── db-supabase.js      # Supabase database client and helpers
│   ├── server.js           # Server entry point
│   └── .env                # Environment variables
├── frontend-new/           # Unified React frontend
│   ├── src/
│   │   ├── components/     # UI Components
│   │   ├── contexts/       # React Contexts (Auth, etc.)
│   │   └── App.jsx         # Main App entry
│   └── vite.config.js      # Vite configuration
└── supabase-migration.sql  # SQL for database setup
```

## Key Components
### Socket.IO Real-time
- **Location**: `backend/server.js`, `backend/controllers/whatsappController.js`
- **Purpose**: Provides live message updates to the dashboard.
- **Notes**: Proxied via Vite in development.

### Manual Media Messaging
- **Location**: `backend/controllers/messagesController.js`
- **Purpose**: Allows users to manually send images and audio.
- **Notes**: Uses Multer for uploads and Meta's `/media` and `/messages` endpoints.

## Configuration
- **Environment Variables**: 
  - `META_APP_ID`, `META_APP_SECRET`: Meta App credentials.
  - `HOST_URL`: Public ngrok URL for webhooks.
  - `WEBHOOK_VERIFY_TOKEN`: Token for Meta webhook verification.
  - `SUPABASE_URL`, `SUPABASE_KEY`: Supabase project connection.

## Known Issues
- Backend requires manual restart when Socket bindings change.

## Future Improvements
- Implement persistent socket rooms/channels for multi-tenant isolation.
- Add advanced media previews in the Inbox UI.

## Development Notes
- Use `npm run dev` in `frontend-new` for UI development.
- Use `npm start` in `backend` for server development.
