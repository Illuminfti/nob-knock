create table if not exists clip_likes (
  user_id text not null,
  clip_id text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, clip_id)
);
create index if not exists clip_likes_user_id_idx on clip_likes (user_id);
