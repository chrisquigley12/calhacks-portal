-- ============================================================================
-- Reconciles the EXISTING public.applications table with the application
-- code, and adds the organizer review layer.
--
-- Safe to run against the live table: it only adds columns, constraints,
-- functions, a view, privileges, and policies. It never drops the table or
-- touches existing rows except to backfill NULL responses with '{}' and to
-- make submitted_at consistent with status.
-- Re-runnable: every statement is idempotent or drops-then-creates its own
-- object.
--
-- Existing remote columns (as created manually):
--   id, user_id → profiles.id, application_type, responses jsonb, status,
--   score int4, reviewer_notes text, created_at, updated_at
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Columns, defaults, constraints
-- ---------------------------------------------------------------------------
alter table public.applications
  add column if not exists submitted_at timestamptz;

update public.applications set responses = '{}'::jsonb where responses is null;

-- submitted_at is derived from status: null for drafts, set for everything
-- else. Backfill existing rows before the constraint below requires it.
update public.applications
set submitted_at = coalesce(submitted_at, updated_at, created_at, now())
where status <> 'draft' and submitted_at is null;

update public.applications
set submitted_at = null
where status = 'draft' and submitted_at is not null;

alter table public.applications
  alter column responses set default '{}'::jsonb,
  alter column responses set not null,
  alter column status set default 'draft',
  alter column status set not null,
  alter column application_type set not null,
  alter column user_id set not null,
  alter column created_at set default now(),
  alter column updated_at set default now();

-- One application per applicant.
create unique index if not exists applications_user_id_key
  on public.applications (user_id);

-- Replace any existing CHECK constraints on status/application_type so the
-- allowed values match the app exactly (whatever they were named before).
do $$
declare constraint_row record;
begin
  for constraint_row in
    select conname
    from pg_constraint
    where conrelid = 'public.applications'::regclass
      and contype = 'c'
      and (pg_get_constraintdef(oid) ilike '%status%'
        or pg_get_constraintdef(oid) ilike '%application_type%'
        or pg_get_constraintdef(oid) ilike '%score%'
        or pg_get_constraintdef(oid) ilike '%submitted_at%')
  loop
    execute format('alter table public.applications drop constraint %I', constraint_row.conname);
  end loop;
end $$;

alter table public.applications
  add constraint applications_application_type_check
    check (application_type in ('hacker', 'volunteer')),
  -- draft/submitted are applicant-side; the rest are set by organizers.
  add constraint applications_status_check
    check (status in ('draft', 'submitted', 'reviewed', 'accepted', 'rejected')),
  add constraint applications_score_check
    check (score is null or (score >= 1 and score <= 10)),
  -- A draft has no submission time; anything past draft always has one.
  add constraint applications_submitted_at_matches_status_check
    check ((status = 'draft') = (submitted_at is null));

-- One before-update trigger owns the timestamp columns:
--   * updated_at is always refreshed;
--   * submitted_at is stamped exactly once, on the draft → submitted
--     transition, and otherwise carried over from the old row. Callers
--     (applicant or organizer) can never set or clear it themselves.
create or replace function public.applications_before_update()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();

  if old.status = 'draft' and new.status <> 'draft' then
    new.submitted_at = now();
  elsif new.status = 'draft' then
    new.submitted_at = null;
  else
    new.submitted_at = old.submitted_at;
  end if;

  return new;
end;
$$;

-- Supersedes the earlier updated_at-only trigger, if it was ever created.
-- (The set_updated_at() function itself is left alone in case another
-- table uses it.)
drop trigger if exists applications_set_updated_at on public.applications;

drop trigger if exists applications_before_update on public.applications;
create trigger applications_before_update
  before update on public.applications
  for each row
  execute function public.applications_before_update();

-- ---------------------------------------------------------------------------
-- 2. Applicant privileges (column-level)
--
-- score and reviewer_notes are organizer-only. Column privileges keep them
-- out of reach for the shared `authenticated` role entirely: applicants can
-- neither read nor write them through the table, even with a hand-crafted
-- API call. Organizers reach them through the SECURITY DEFINER view and
-- function in section 4 instead.
-- ---------------------------------------------------------------------------
revoke all on table public.applications from anon;
revoke all on table public.applications from authenticated;

grant select (id, user_id, application_type, responses, status, created_at, updated_at, submitted_at)
  on public.applications to authenticated;
grant insert (user_id, application_type, responses, status)
  on public.applications to authenticated;
-- submitted_at is database-owned (see the before-update trigger), so it is
-- deliberately absent from both the INSERT and UPDATE grants.
grant update (responses, status)
  on public.applications to authenticated;

-- ---------------------------------------------------------------------------
-- 3. Applicant Row Level Security
--
-- Identity always comes from the verified JWT via auth.uid(); nothing an
-- applicant sends can widen what they can touch. (select auth.uid()) lets
-- Postgres evaluate the function once per query.
-- ---------------------------------------------------------------------------
alter table public.applications enable row level security;

drop policy if exists "Applicants can read their own application" on public.applications;
create policy "Applicants can read their own application"
  on public.applications
  for select
  to authenticated
  using (user_id = (select auth.uid()));

-- An applicant may create only their own draft, and only with the applicant
-- type recorded on their profile. Organizers have no applicant type, so the
-- profile lookup fails for them and the insert is denied.
drop policy if exists "Applicants can create their own draft" on public.applications;
create policy "Applicants can create their own draft"
  on public.applications
  for insert
  to authenticated
  with check (
    user_id = (select auth.uid())
    and status = 'draft'
    and exists (
      select 1
      from public.profiles as profile
      where profile.id = (select auth.uid())
        and profile.account_type in ('hacker', 'volunteer')
        and profile.account_type = applications.application_type
    )
  );

-- Only a draft can be edited (USING). The edited row must still be the
-- applicant's own and end up as draft or submitted (WITH CHECK). Once status
-- is 'submitted', USING no longer matches, so the row is frozen.
drop policy if exists "Applicants can update their own draft" on public.applications;
create policy "Applicants can update their own draft"
  on public.applications
  for update
  to authenticated
  using (
    user_id = (select auth.uid())
    and status = 'draft'
  )
  with check (
    user_id = (select auth.uid())
    and status in ('draft', 'submitted')
  );

-- No DELETE policy: applicants cannot remove applications.

-- ---------------------------------------------------------------------------
-- 4. Organizer access
--
-- Organizers are identified by profiles.account_type = 'organizer', which is
-- only ever set by an administrator. Rather than widening the applicant
-- table privileges, organizer reads go through a view and organizer writes
-- through a function; both run with the owner's privileges (SECURITY
-- DEFINER) and check is_organizer() themselves.
-- ---------------------------------------------------------------------------
create or replace function public.is_organizer()
returns boolean
language sql
stable
security definer
-- Empty search_path: every reference below is schema-qualified, so a
-- malicious object in another schema can never be picked up.
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and account_type = 'organizer'
  );
$$;

revoke all on function public.is_organizer() from public, anon;
grant execute on function public.is_organizer() to authenticated;

-- Exactly the columns the organizer UI needs, nothing more (no auth user
-- ids). Drafts are excluded: organizers only see applications the
-- applicant chose to submit.
drop view if exists public.organizer_applications;
create view public.organizer_applications
  with (security_invoker = false)
as
  select
    application.id,
    application.application_type,
    application.responses,
    application.status,
    application.score,
    application.reviewer_notes,
    application.submitted_at,
    profile.full_name as applicant_name
  from public.applications as application
  join public.profiles as profile on profile.id = application.user_id
  where application.status <> 'draft'
    and public.is_organizer();

revoke all on public.organizer_applications from anon;
grant select on public.organizer_applications to authenticated;

-- The single write path for grading. Validates inputs and refuses to touch
-- drafts, so an organizer can only act on what an applicant submitted.
create or replace function public.review_application(
  application_id uuid,
  new_status text,
  new_score integer,
  new_notes text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_organizer() then
    raise exception 'Only organizers can review applications';
  end if;

  if new_status not in ('submitted', 'reviewed', 'accepted', 'rejected') then
    raise exception 'Invalid review status: %', new_status;
  end if;

  if new_score is not null and (new_score < 1 or new_score > 10) then
    raise exception 'Score must be between 1 and 10';
  end if;

  update public.applications
  set status = new_status,
      score = new_score,
      reviewer_notes = new_notes
  where id = application_id
    and status <> 'draft';

  if not found then
    raise exception 'Application not found or not yet submitted';
  end if;
end;
$$;

revoke all on function public.review_application(uuid, text, integer, text) from public, anon;
grant execute on function public.review_application(uuid, text, integer, text) to authenticated;

-- ---------------------------------------------------------------------------
-- 5. Profiles hardening
--
-- is_organizer() trusts profiles.account_type, so that column must be
-- writable only by an administrator (SQL editor / dashboard, which run as
-- the postgres role), never through the API as the authenticated role.
-- ---------------------------------------------------------------------------

-- Even if a "users can update their own profile" policy exists now or
-- later, the API role may only change full_name. (Table-level UPDATE must
-- be revoked first; a column-level revoke alone would not override it.)
revoke update on table public.profiles from anon;
revoke update on table public.profiles from authenticated;
grant update (full_name) on table public.profiles to authenticated;

-- Belt-and-braces for INSERT, which column privileges can't value-check:
-- an API caller can never create a profile that is already an organizer.
create or replace function public.prevent_self_assigned_organizer()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.account_type = 'organizer' and current_user = 'authenticated' then
    raise exception 'Organizer accounts are assigned by an administrator';
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_prevent_self_assigned_organizer on public.profiles;
create trigger profiles_prevent_self_assigned_organizer
  before insert on public.profiles
  for each row
  execute function public.prevent_self_assigned_organizer();
