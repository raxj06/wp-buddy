# Changelog

All notable changes to this project will be documented in this file.

Format: [Date] - [Version] - [Type]

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
