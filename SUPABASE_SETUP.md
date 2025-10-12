# Supabase Setup Guide

This document explains how to set up Supabase for the WhatsApp Business Platform.

## Prerequisites

1. A Supabase account (free tier available at [supabase.com](https://supabase.com))
2. A Supabase project created

## Setup Instructions

### 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up or log in
2. Create a new project
3. Note down your project URL and API keys

### 2. Update Environment Variables

Update the `.env` file with your Supabase credentials:

```env
SUPABASE_URL=your_supabase_project_url
SUPABASE_KEY=your_supabase_service_role_key
```

You can find these in your Supabase project dashboard under "Project Settings" > "API".

### 3. Create Database Tables

Run the SQL script in `supabase-migration.sql` in your Supabase SQL editor:

1. Go to your Supabase project dashboard
2. Navigate to "SQL Editor" in the left sidebar
3. Copy and paste the contents of `supabase-migration.sql`
4. Run the script

### 4. Configure Row Level Security (Optional but Recommended)

For production use, you should configure Row Level Security (RLS) to ensure data isolation between users.

### 5. Test the Connection

Run the test script to verify everything is working:

```bash
node test-supabase.js
```

## Database Schema

The database consists of three main tables:

### users
- `id` (SERIAL, PRIMARY KEY)
- `email` (TEXT, UNIQUE, NOT NULL)
- `password` (TEXT, NOT NULL)
- `name` (TEXT)
- `created_at` (TIMESTAMP WITH TIME ZONE, DEFAULT NOW())

### whatsapp_accounts
- `id` (SERIAL, PRIMARY KEY)
- `user_id` (INTEGER, REFERENCES users(id))
- `waba_id` (TEXT, NOT NULL, UNIQUE)
- `phone_number_id` (TEXT)
- `access_token` (TEXT)
- `platform_api_key` (TEXT)
- `created_at` (TIMESTAMP WITH TIME ZONE, DEFAULT NOW())

### webhook_configs
- `id` (SERIAL, PRIMARY KEY)
- `user_id` (INTEGER, REFERENCES users(id))
- `waba_id` (TEXT, NOT NULL, UNIQUE)
- `webhook_url` (TEXT)
- `api_access` (BOOLEAN, DEFAULT false)
- `api_key` (TEXT)
- `created_at` (TIMESTAMP WITH TIME ZONE, DEFAULT NOW())

## Security Considerations

1. Always use the service role key for server-side operations
2. Never expose the service role key in client-side code
3. Implement Row Level Security for multi-tenant applications
4. Use Supabase Auth for additional authentication layers if needed

## Troubleshooting

### "supabaseUrl is required" Error
Make sure you've updated the `.env` file with your actual Supabase URL and key.

### Connection Issues
Verify that:
1. Your Supabase project is active
2. Your network connection is working
3. Your API key is correct and has the necessary permissions

### Database Query Errors
Ensure that:
1. All tables have been created successfully
2. Column names match exactly (case-sensitive)
3. Foreign key relationships are properly set up