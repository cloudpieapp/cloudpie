create type public.app_role as enum ('admin','user');
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  role app_role not null,
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;
create policy "own roles" on public.user_roles for select to authenticated using (user_id = auth.uid());

create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

-- First account ever created becomes the admin.
create or replace function public.grant_first_admin()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from public.user_roles where role = 'admin') then
    insert into public.user_roles (user_id, role) values (new.id, 'admin');
  end if;
  return new;
end $$;
create trigger on_auth_user_created_admin after insert on auth.users
for each row execute function public.grant_first_admin();

create table public.player_servers (
  id text primary key,
  label text not null,
  base text not null,
  sort int not null default 0,
  enabled boolean not null default true,
  updated_at timestamptz not null default now()
);
grant select on public.player_servers to anon, authenticated;
grant insert, update, delete on public.player_servers to authenticated;
grant all on public.player_servers to service_role;
alter table public.player_servers enable row level security;
create policy "public read" on public.player_servers for select to anon, authenticated using (true);
create policy "admin write" on public.player_servers for all to authenticated
  using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

insert into public.player_servers (id,label,base,sort) values
('cinesrc','Nova','https://cinesrc.st/embed',1),
('vidnest','Helix','https://moviesapi.to',2),
('vidbolt','Cipher','https://vidbolt.xyz',3),
('vidcore','Crimson','https://vidcore.io',4),
('vidlink','Astra','https://vidzen.fun',5),
('vidsrcme','Ironclad','https://player.videasy.net',6),
('vidgod','Vale','https://vidcore.io/embed',7),
('filmu','Lumen','https://player.smashy.stream',8);