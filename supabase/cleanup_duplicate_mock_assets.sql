-- Safe cleanup for duplicated Second AI seed mock assets.
-- Replace the email below with the owner account you want to clean.
-- This only removes duplicated built-in mock assets whose file_url is null.
-- Real uploaded files have file_url/storage path and will not be touched.

with target_owner as (
  select id as owner_id
  from auth.users
  where email = '1748901501@qq.com'
),
ranked_mock_assets as (
  select
    assets.id,
    row_number() over (
      partition by assets.owner_id, assets.file_name
      order by assets.created_at desc, assets.id desc
    ) as keep_rank
  from public.assets
  join target_owner on target_owner.owner_id = assets.owner_id
  where assets.file_url is null
    and assets.file_name in (
      'Second AI PRD.pdf',
      'Second AI 原型设计说明.docx',
      'Isabella Resume.pdf',
      'second-ai-demo.mp4'
    )
)
delete from public.assets
using ranked_mock_assets
where public.assets.id = ranked_mock_assets.id
  and ranked_mock_assets.keep_rank > 1;
