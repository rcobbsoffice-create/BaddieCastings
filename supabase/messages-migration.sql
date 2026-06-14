-- Messages table for direct talent ↔ agency/admin messaging
create table if not exists messages (
  id           uuid primary key default uuid_generate_v4(),
  sender_id    uuid references profiles(id) on delete cascade,
  recipient_id uuid references profiles(id) on delete cascade,
  body         text not null,
  read         boolean default false,
  created_at   timestamptz default now()
);

create index if not exists messages_recipient_idx on messages(recipient_id, created_at desc);
create index if not exists messages_sender_idx    on messages(sender_id, created_at desc);

alter table messages enable row level security;

-- Users can read messages they sent or received
create policy "Read own messages" on messages
  for select using (auth.uid() = sender_id or auth.uid() = recipient_id);

-- Users can send messages
create policy "Send messages" on messages
  for insert with check (auth.uid() = sender_id);

-- Recipients can mark as read
create policy "Mark read" on messages
  for update using (auth.uid() = recipient_id);
