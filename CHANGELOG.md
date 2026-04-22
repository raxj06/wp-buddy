# Changelog

All notable changes to this project will be documented in this file.

Format: [Date] - [Version] - [Type]

---

## [1.0.0] - 2026-04-22

### Added
- **Deployment Infrastructure**: Added `vercel.json` for SPA routing on Vercel.
- **Environment Configuration**: Centralized API and Socket URLs in `frontend-new/src/config.js`.
- **Dynamic Meta SDK**: Integrated `VITE_META_APP_ID` for environment-driven Meta App configuration.

### Changed
- **Frontend Components**: Updated all API calls to use `API_BASE_URL` from config instead of relative paths.
- **Backend Hardening**: 
  - Switched from local file logging to standard `console.log` for Render compatibility.
  - Removed `sqlite3` dependency in favor of full Supabase integration.
  - Added strict environment variable validation on server startup.
  - Enhanced CORS configuration for secure cross-origin requests.

### Technical Details
- Successfully decoupled frontend and backend for independent scaling.
- Verified persistent storage using Supabase.
- Optimized Socket.IO for production URL injection.

---

## [0.2.0] - 2026-04-02

### Added
- **Real-Time Messaging**: Integrated Socket.IO for live inbox updates.
- **Media Messaging**: Added support for manual image and audio uploads in the chat.
- **Backend Infrastructure**: 
  - Sub-process and middleware for Multer file handling.
  - New `POST /api/messages/media` endpoint.
  - Broadcast logic in WhatsApp webhook handler.
- **Dashboard UI**:
  - Live socket connection with message reconciliation.
  - File picker and attachment preview in the Inbox.

### Technical Details
- Added `socket.io` and `multer` dependencies.
- Updated `vite.config.js` with WebSocket proxying.
- Implemented temporary file cleanup in the media controller.

---

## [0.1.0] - 2026-04-02

### Added
- Initial project setup with Express and React.
- Basic Meta WhatsApp API integration.
- Supabase authentication and database integration.
- Flow automation engine basics.
