-- EASY PARK — Nouvelle query (ajouts seulement)
-- Supabase → SQL Editor → New query → Run

-- Champs supplémentaires profil
alter table public.profiles add column if not exists phone        text    not null default '';
alter table public.profiles add column if not exists birth_date   date;
alter table public.profiles add column if not exists gender       text    not null default '';
alter table public.profiles add column if not exists vehicle_type text    not null default 'car'
  check (vehicle_type in ('car','motorcycle','truck','other',''));
alter table public.profiles add column if not exists notifications_enabled boolean not null default true;
alter table public.profiles add column if not exists radius_km    integer not null default 1;

-- Vérification
select column_name from information_schema.columns
where table_name = 'profiles'
order by ordinal_position;

-- Mettre à jour le trigger pour sauvegarder les nouveaux champs
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare v text;
begin
  v := coalesce(nullif(trim(new.raw_user_meta_data->>'username'),''), split_part(new.email,'@',1));
  v := regexp_replace(lower(v),'[^a-z0-9_]','_','g');
  if length(v) < 1 then v := 'user'; end if;
  if exists(select 1 from public.profiles where username=v) then
    v := v || '_' || floor(random()*9000+1000)::text;
  end if;
  insert into public.profiles(id, username, full_name, city, avatar_url, phone, gender, vehicle_type)
  values(
    new.id, v,
    coalesce(nullif(trim(new.raw_user_meta_data->>'full_name'),''),''),
    coalesce(nullif(trim(new.raw_user_meta_data->>'city'),''),'Paris'),
    '',
    coalesce(nullif(trim(new.raw_user_meta_data->>'phone'),''),''),
    coalesce(nullif(trim(new.raw_user_meta_data->>'gender'),''),''),
    coalesce(nullif(trim(new.raw_user_meta_data->>'vehicle_type'),''),'car')
  )
  on conflict(id) do nothing;
  return new;
exception when others then
  raise warning 'handle_new_user: %', sqlerrm;
  return new;
end; $$;
