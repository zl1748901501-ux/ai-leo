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
  token text unique,
  status text default 'pending',
  note text null,
  expires_at timestamp null,
  created_at timestamp default now(),
  updated_at timestamp default now(),
  used_at timestamp null,
  last_access_at timestamp null
);

alter table public.invitations
add column if not exists token text;

alter table public.invitations
add column if not exists updated_at timestamp default now();

update public.invitations
set token = invite_token
where token is null
  and invite_token is not null;

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

update public.assets
set visibility = 'show'
where visibility = 'display';

delete from public.chat_messages
where profile_id in (
  select id
  from public.profiles
  where title in ('Isabella 的 Second AI 作品主页', 'Isabella 鐨?Second AI 浣滃搧涓婚〉')
);

delete from public.assets
where file_url is null
  and file_name in (
    'Second AI PRD.pdf',
    'Second AI 产品 PRD.pdf',
    'Second AI 原型设计说明.docx',
    'Second AI 鍘熷瀷璁捐璇存槑.docx',
    'Isabella Resume.pdf',
    'second-ai-demo.mp4'
  );

delete from public.invitations
where visitor_email in ('hr@company.com', 'mentor@example.com', 'client@studio.cn')
  and (
    invite_token like 'hr-company-%'
    or invite_token like 'mentor-%'
    or invite_token like 'client-%'
    or token like 'hr-company-%'
    or token like 'mentor-%'
    or token like 'client-%'
  );

update public.profiles
set
  title = '我的 Second AI 主页',
  identity = '',
  bio = '',
  ability_tags = '[]'::jsonb,
  recommended_questions = '["你可以介绍一下自己吗？","有哪些项目或作品可以展示？","哪些资料能证明你的能力？","你的经历和优势是什么？"]'::jsonb,
  visitor_intro = '通过 AI 对话了解资料主人的项目、作品与能力证据。',
  privacy_notice = 'AI 只读取授权资料，未授权内容不会进入回答。',
  updated_at = now()
where title in ('Isabella 的 Second AI 作品主页', 'Isabella 鐨?Second AI 浣滃搧涓婚〉');

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

drop policy if exists "Invited visitors can read active profiles" on public.profiles;
create policy "Invited visitors can read active profiles"
on public.profiles
for select
to authenticated
using (
  exists (
    select 1
    from public.invitations
    where public.invitations.profile_id = public.profiles.id
      and lower(public.invitations.visitor_email) = lower(auth.jwt() ->> 'email')
      and public.invitations.status = 'active'
      and public.invitations.token is not null
      and (
        public.invitations.expires_at is null
        or public.invitations.expires_at > now()
      )
  )
);

drop policy if exists "Owners can manage own assets" on public.assets;
create policy "Owners can manage own assets"
on public.assets
for all
to authenticated
using (auth.uid() = owner_id)
with check (auth.uid() = owner_id);

drop policy if exists "Invited visitors can read authorized assets" on public.assets;
create policy "Invited visitors can read authorized assets"
on public.assets
for select
to authenticated
using (
  analysis_status = 'completed'
  and visibility in ('answer_only', 'show')
  and exists (
    select 1
    from public.invitations
    where public.invitations.owner_id = public.assets.owner_id
      and lower(public.invitations.visitor_email) = lower(auth.jwt() ->> 'email')
      and public.invitations.status = 'active'
      and public.invitations.token is not null
      and (
        public.invitations.expires_at is null
        or public.invitations.expires_at > now()
      )
  )
);

drop policy if exists "Owners can manage own invitations" on public.invitations;
create policy "Owners can manage own invitations"
on public.invitations
for all
to authenticated
using (auth.uid() = owner_id)
with check (auth.uid() = owner_id);

drop policy if exists "Invited visitors can read own active invitations" on public.invitations;
create policy "Invited visitors can read own active invitations"
on public.invitations
for select
to authenticated
using (
  lower(visitor_email) = lower(auth.jwt() ->> 'email')
);

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

drop policy if exists "Invited visitors can insert chat messages" on public.chat_messages;
create policy "Invited visitors can insert chat messages"
on public.chat_messages
for insert
to authenticated
with check (
  lower(visitor_email) = lower(auth.jwt() ->> 'email')
  and exists (
    select 1
    from public.invitations
    where public.invitations.profile_id = public.chat_messages.profile_id
      and lower(public.invitations.visitor_email) = lower(auth.jwt() ->> 'email')
      and public.invitations.status = 'active'
      and public.invitations.token is not null
      and (
        public.invitations.expires_at is null
        or public.invitations.expires_at > now()
      )
  )
);

create index if not exists profiles_owner_id_idx on public.profiles(owner_id);
create index if not exists assets_owner_id_idx on public.assets(owner_id);
create index if not exists invitations_owner_id_idx on public.invitations(owner_id);
create index if not exists invitations_profile_id_idx on public.invitations(profile_id);
create unique index if not exists invitations_token_idx on public.invitations(token)
where token is not null;
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

drop policy if exists "Invited visitors can read authorized asset files" on storage.objects;
create policy "Invited visitors can read authorized asset files"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'assets'
  and exists (
    select 1
    from public.assets
    join public.invitations
      on public.invitations.owner_id = public.assets.owner_id
    where public.assets.file_url = storage.objects.name
      and public.assets.visibility in ('answer_only', 'show')
      and public.assets.analysis_status = 'completed'
      and lower(public.invitations.visitor_email) = lower(auth.jwt() ->> 'email')
      and public.invitations.status = 'active'
      and public.invitations.token is not null
      and (
        public.invitations.expires_at is null
        or public.invitations.expires_at > now()
      )
  )
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
