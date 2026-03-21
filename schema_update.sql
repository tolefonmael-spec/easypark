-- ============================================================
-- EASY PARK — NOUVELLE QUERY (ne touche pas à l'existant)
-- Supabase → SQL Editor → New query → colle tout → Run
-- ============================================================

-- 1. Colonnes manquantes dans spots
alter table public.spots add column if not exists free_at  timestamptz;
alter table public.spots add column if not exists is_paid  boolean not null default false;

-- 2. Colonne avatar dans profiles
alter table public.profiles add column if not exists avatar_url text not null default '';

-- 3. Table reviews (évaluations des signalements)
create table if not exists public.reviews (
  id           uuid        primary key default gen_random_uuid(),
  spot_id      uuid        references public.spots(id)    on delete cascade,
  reviewer_id  uuid        references public.profiles(id) on delete cascade,
  rating       integer     not null check (rating between 1 and 5),
  comment      text        not null default '',
  was_accurate boolean,
  created_at   timestamptz not null default now(),
  unique(spot_id, reviewer_id)
);
alter table public.reviews enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where tablename='reviews' and policyname='reviews_sel') then
    execute $q$ create policy "reviews_sel" on public.reviews for select using (true) $q$;
  end if;
  if not exists (select 1 from pg_policies where tablename='reviews' and policyname='reviews_ins') then
    execute $q$ create policy "reviews_ins" on public.reviews for insert with check (auth.uid() = reviewer_id) $q$;
  end if;
  if not exists (select 1 from pg_policies where tablename='reviews' and policyname='reviews_upd') then
    execute $q$ create policy "reviews_upd" on public.reviews for update using (auth.uid() = reviewer_id) $q$;
  end if;
end; $$;

-- 4. Trigger : mise à jour fiabilité après une review
create or replace function public.update_reliability_from_review()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_reporter uuid;
  v_avg      numeric;
begin
  select reported_by into v_reporter from public.spots where id = new.spot_id;
  if v_reporter is null then return new; end if;

  select round(avg(case when r.was_accurate = true then 100 else 0 end)::numeric, 2)
  into v_avg
  from public.reviews r
  join public.spots s on s.id = r.spot_id
  where s.reported_by = v_reporter and r.was_accurate is not null;

  if v_avg is not null then
    update public.profiles set reliability = v_avg where id = v_reporter;
  end if;
  return new;
exception when others then
  raise warning 'update_reliability: %', sqlerrm;
  return new;
end; $$;

drop trigger if exists on_new_review on public.reviews;
create trigger on_new_review
  after insert or update on public.reviews
  for each row execute procedure public.update_reliability_from_review();

-- 5. Storage bucket avatars
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 2097152, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public = true;

do $$ begin
  if not exists (select 1 from pg_policies where schemaname='storage' and tablename='objects' and policyname='av_r') then
    execute $q$ create policy "av_r" on storage.objects for select using (bucket_id = 'avatars') $q$;
  end if;
  if not exists (select 1 from pg_policies where schemaname='storage' and tablename='objects' and policyname='av_i') then
    execute $q$ create policy "av_i" on storage.objects for insert with check (bucket_id = 'avatars' and auth.role() = 'authenticated') $q$;
  end if;
  if not exists (select 1 from pg_policies where schemaname='storage' and tablename='objects' and policyname='av_u') then
    execute $q$ create policy "av_u" on storage.objects for update using (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]) $q$;
  end if;
end; $$;

-- 6. Realtime sur reviews
alter publication supabase_realtime add table public.reviews;

-- Vérification finale
select
  (select column_name from information_schema.columns where table_name='spots'    and column_name='free_at')    as col_free_at,
  (select column_name from information_schema.columns where table_name='spots'    and column_name='is_paid')    as col_is_paid,
  (select column_name from information_schema.columns where table_name='profiles' and column_name='avatar_url') as col_avatar,
  (select count(*) from public.reviews) as reviews_count;
