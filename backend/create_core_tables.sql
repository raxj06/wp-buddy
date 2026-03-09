-- Enable UUID extension if not already enabled
create extension if not exists "uuid-ossp";

-- CONTACTS TABLE
create table contacts (
  id uuid default uuid_generate_v4() primary key,
  user_id bigint references users(id) not null,
  waba_id text not null,
  phone_number text not null,
  name text,
  email text,
  tags text[] default array[]::text[],
  attributes jsonb default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, phone_number)
);

create index contacts_user_id_idx on contacts(user_id);
alter table contacts enable row level security;

create policy "Users can view their own contacts"
  on contacts for select using (auth.uid() = user_id);

create policy "Users can insert their own contacts"
  on contacts for insert with check (auth.uid() = user_id);

create policy "Users can update their own contacts"
  on contacts for update using (auth.uid() = user_id);

create policy "Users can delete their own contacts"
  on contacts for delete using (auth.uid() = user_id);


-- MESSAGES TABLE
create table messages (
  id uuid default uuid_generate_v4() primary key,
  user_id bigint references users(id) not null, -- for easy RLS
  waba_id text not null,
  phone_number_id text not null,
  contact_id uuid references contacts(id),
  wa_message_id text unique, -- Message ID from Meta
  direction text check (direction in ('inbound', 'outbound')) not null,
  type text not null, -- text, image, template, etc.
  body text, -- Text content or caption
  media_url text,
  status text default 'sent', -- sent, delivered, read, failed
  timestamp timestamp with time zone default timezone('utc'::text, now()) not null,
  raw_data jsonb -- Full webhook payload for debugging
);

create index messages_contact_id_idx on messages(contact_id);
create index messages_user_id_idx on messages(user_id);
alter table messages enable row level security;

create policy "Users can view their own messages"
  on messages for select using (auth.uid() = user_id);

create policy "Users can insert their own messages" -- System triggers might need bypass, but for API usage
  on messages for insert with check (auth.uid() = user_id);

-- CAMPAIGNS TABLE
create table campaigns (
  id uuid default uuid_generate_v4() primary key,
  user_id bigint references users(id) not null,
  name text not null,
  template_name text,
  template_language text default 'en_US',
  status text default 'draft', -- draft, scheduled, processing, completed, failed
  scheduled_at timestamp with time zone,
  audience_filter jsonb default '{}'::jsonb, -- Filter criteria for contacts
  stats jsonb default '{"sent": 0, "delivered": 0, "read": 0, "failed": 0}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index campaigns_user_id_idx on campaigns(user_id);
alter table campaigns enable row level security;

create policy "Users can view their own campaigns"
  on campaigns for select using (auth.uid() = user_id);

create policy "Users can manage their own campaigns"
  on campaigns for all using (auth.uid() = user_id);
