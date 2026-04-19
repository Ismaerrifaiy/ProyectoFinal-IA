-- Tabla que extiende auth.users con el descriptor facial
create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  username text unique not null,
  face_descriptor float8[] not null,
  created_at timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "Usuario puede leer su propio perfil"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Usuario puede insertar su propio perfil"
  on public.profiles for insert
  with check (auth.uid() = id);
