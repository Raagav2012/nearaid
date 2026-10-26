-- Run in Supabase: SQL Editor > New query > paste > Run
-- Tracks which tutorial videos each person has watched, and makes the two
-- required videos a rule the database enforces before a CPR card can be sent.

create table video_progress (
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  video_id text not null,
  completed_at timestamptz not null default now(),
  primary key (user_id, video_id)
);

alter table video_progress enable row level security;
create policy "read own progress"   on video_progress for select to authenticated using (user_id = auth.uid());
create policy "add own progress"    on video_progress for insert to authenticated with check (user_id = auth.uid());
create policy "remove own progress" on video_progress for delete to authenticated using (user_id = auth.uid());

-- A CPR card can only be submitted after BOTH required videos are marked watched.
-- (If you change the ids in videos.js, change them here too.)
drop policy "add own scan" on certifications;
create policy "add own scan" on certifications for insert to authenticated
  with check (
    user_id = auth.uid() and status = 'pending'
    and (select count(*) from video_progress
         where user_id = auth.uid() and video_id in ('required-1', 'required-2')) = 2
  );
