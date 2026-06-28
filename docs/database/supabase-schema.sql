create table if not exists app_users (
  id text primary key,
  username text unique not null,
  display_name text not null,
  avatar_url text not null,
  trip_id text not null,
  password_hash text not null,
  role text not null default 'member',
  created_at timestamptz not null default now()
);

create table if not exists photos (
  id text primary key,
  public_id text unique not null,
  secure_url text not null,
  caption text not null,
  trip_day integer not null check (trip_day between 1 and 3),
  uploaded_by text not null references app_users(id),
  uploaded_by_name text not null,
  created_at timestamptz not null default now()
);

create table if not exists upload_events (
  id text primary key,
  user_id text not null references app_users(id),
  public_id text,
  file_size integer,
  status text not null check (status in ('signature_issued', 'metadata_saved', 'rate_limited', 'rejected')),
  created_at timestamptz not null default now()
);

create table if not exists user_missions (
  user_id text primary key references app_users(id),
  mission_id text not null,
  remaining_redraws integer not null default 2 check (remaining_redraws between 0 and 2),
  locked boolean not null default false,
  updated_at timestamptz not null default now()
);

create index if not exists photos_created_at_idx on photos (created_at desc);
create index if not exists upload_events_user_created_idx on upload_events (user_id, created_at desc);
create index if not exists user_missions_updated_idx on user_missions (updated_at desc);
