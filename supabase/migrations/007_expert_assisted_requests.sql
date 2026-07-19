-- 007_expert_assisted_requests.sql
-- Expert-assisted requests: a signed-in customer asks for specialist
-- guidance before (or instead of) filing a formal service request.
-- Deliberately NOT a `services` row — nothing has been scoped yet, so it
-- must not appear in the sidebar tree or on the Overview. The row is the
-- durable record; email notification is a separate, best-effort step
-- (see the send-expert-request-email edge function).

create table public.expert_assisted_requests (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),

  -- Who filed it. Defaults to the caller; kept when the profile goes away
  -- so the request history survives account deletion.
  requested_by uuid default auth.uid() references public.profiles (id)
    on delete set null,

  -- Contact details as typed into the form (the signed-in profile may
  -- differ from who should actually be contacted).
  name text not null,
  email text not null,
  organization text not null default 'Not provided',

  -- What they need: the chosen support topic (or a general fallback) and
  -- their free-text message.
  project_area_description text not null,
  project_objective text not null,
  preferred_output_format text not null default 'Both',

  -- Synthesized extras (phone number, routing hints).
  comments text
);

alter table public.expert_assisted_requests enable row level security;

-- Customers create requests as themselves and can read their own;
-- admins see everything. No customer update/delete — the record is an
-- immutable inbox item handled by the team.
create policy "expert_requests_insert_own"
  on public.expert_assisted_requests for insert
  with check (requested_by = auth.uid());

create policy "expert_requests_select_own"
  on public.expert_assisted_requests for select
  using (requested_by = auth.uid() or public.is_admin());
