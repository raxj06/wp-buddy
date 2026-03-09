-- Create the automation_flows table
create table automation_flows (
  id uuid default uuid_generate_v4() primary key,
  user_id bigint references users(id) not null,
  name text not null,
  trigger_keyword text,
  flow_data jsonb default '{}'::jsonb,
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Add simple index for user lookups
create index automation_flows_user_id_idx on automation_flows(user_id);

-- Enable Row Level Security (RLS)
alter table automation_flows enable row level security;

-- Create Policy: Users can only see their own flows
create policy "Users can view their own flows"
  on automation_flows for select
  using (auth.uid() = user_id);

create policy "Users can insert their own flows"
  on automation_flows for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own flows"
  on automation_flows for update
  using (auth.uid() = user_id);

create policy "Users can delete their own flows"
  on automation_flows for delete
  using (auth.uid() = user_id);
