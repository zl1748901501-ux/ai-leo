create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references auth.users(id) on delete cascade,
  title text,
  identity text,
  bio text,
  avatar_url text null,
  ability_tags jsonb default '[]'::jsonb,
  recommended_questions jsonb default '[]'::jsonb,
  visitor_intro text null,
  privacy_notice text null,
  is_active boolean default false,
  created_at timestamp default now(),
  updated_at timestamp default now()
);

create table if not exists public.assets (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references auth.users(id) on delete cascade,
  file_name text,
  file_url text null,
  file_type text,
  raw_text text null,
  ai_title text null,
  asset_type text null,
  one_sentence_summary text null,
  detailed_summary text null,
  tags jsonb default '[]'::jsonb,
  skills jsonb default '[]'::jsonb,
  project_keywords jsonb default '[]'::jsonb,
  answerable_questions jsonb default '[]'::jsonb,
  card jsonb null,
  source_quotes jsonb default '[]'::jsonb,
  visibility text default 'private',
  analysis_status text default 'waiting',
  created_at timestamp default now(),
  updated_at timestamp default now()
);

create table if not exists public.invitations (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles(id) on delete cascade,
  owner_id uuid references auth.users(id) on delete cascade,
  visitor_email text,
  invite_token text unique,
  status text default 'pending',
  note text null,
  expires_at timestamp null,
  created_at timestamp default now(),
  used_at timestamp null,
  last_access_at timestamp null
);

create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles(id) on delete cascade,
  visitor_email text,
  question text,
  answer text,
  sources jsonb default '[]'::jsonb,
  cards jsonb default '[]'::jsonb,
  follow_up_questions jsonb default '[]'::jsonb,
  confidence text null,
  created_at timestamp default now()
);

alter table public.profiles enable row level security;
alter table public.assets enable row level security;
alter table public.invitations enable row level security;
alter table public.chat_messages enable row level security;

drop policy if exists "Owners can manage own profiles" on public.profiles;
create policy "Owners can manage own profiles"
on public.profiles
for all
to authenticated
using (auth.uid() = owner_id)
with check (auth.uid() = owner_id);

drop policy if exists "Owners can manage own assets" on public.assets;
create policy "Owners can manage own assets"
on public.assets
for all
to authenticated
using (auth.uid() = owner_id)
with check (auth.uid() = owner_id);

drop policy if exists "Owners can manage own invitations" on public.invitations;
create policy "Owners can manage own invitations"
on public.invitations
for all
to authenticated
using (auth.uid() = owner_id)
with check (auth.uid() = owner_id);

drop policy if exists "Owners can read chat messages for own profiles" on public.chat_messages;
create policy "Owners can read chat messages for own profiles"
on public.chat_messages
for select
to authenticated
using (
  exists (
    select 1
    from public.profiles
    where public.profiles.id = public.chat_messages.profile_id
      and public.profiles.owner_id = auth.uid()
  )
);

create index if not exists profiles_owner_id_idx on public.profiles(owner_id);
create index if not exists assets_owner_id_idx on public.assets(owner_id);
create index if not exists invitations_owner_id_idx on public.invitations(owner_id);
create index if not exists invitations_profile_id_idx on public.invitations(profile_id);
create index if not exists chat_messages_profile_id_idx on public.chat_messages(profile_id);

insert into storage.buckets (id, name, public)
values ('assets', 'assets', false)
on conflict (id) do nothing;

drop policy if exists "Owners can upload own asset files" on storage.objects;
create policy "Owners can upload own asset files"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'assets'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Owners can read own asset files" on storage.objects;
create policy "Owners can read own asset files"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'assets'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Owners can update own asset files" on storage.objects;
create policy "Owners can update own asset files"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'assets'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'assets'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Owners can delete own asset files" on storage.objects;
create policy "Owners can delete own asset files"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'assets'
  and (storage.foldername(name))[1] = auth.uid()::text
);
