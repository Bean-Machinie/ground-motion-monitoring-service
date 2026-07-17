-- 002_row_level_security.sql
-- Enables RLS on all application tables and defines access policies.
-- Customers may only read their own records; admins may access everything.
-- Customers cannot create, update, or delete projects, results, or orders.

-- ---------------------------------------------------------------------------
-- Admin helper.
-- SECURITY DEFINER so the role check does not recurse through the
-- profiles RLS policies.
-- ---------------------------------------------------------------------------

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
  );
$$;

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;

create policy "profiles_select_own"
  on public.profiles for select
  using (id = auth.uid() or public.is_admin());

create policy "profiles_update_own"
  on public.profiles for update
  using (id = auth.uid() or public.is_admin())
  with check (id = auth.uid() or public.is_admin());

-- Prevent non-admins from changing their own role.
create or replace function public.prevent_role_escalation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role is distinct from old.role and not public.is_admin() then
    raise exception 'Changing role is not permitted';
  end if;
  return new;
end;
$$;

create trigger profiles_prevent_role_escalation
  before update on public.profiles
  for each row execute function public.prevent_role_escalation();

-- ---------------------------------------------------------------------------
-- projects: customers read their own; only admins write.
-- ---------------------------------------------------------------------------

alter table public.projects enable row level security;

create policy "projects_select_own"
  on public.projects for select
  using (customer_id = auth.uid() or public.is_admin());

create policy "projects_admin_insert"
  on public.projects for insert
  with check (public.is_admin());

create policy "projects_admin_update"
  on public.projects for update
  using (public.is_admin())
  with check (public.is_admin());

create policy "projects_admin_delete"
  on public.projects for delete
  using (public.is_admin());

-- ---------------------------------------------------------------------------
-- results: customers read results of their own projects; only admins write.
-- ---------------------------------------------------------------------------

alter table public.results enable row level security;

create policy "results_select_own_project"
  on public.results for select
  using (
    public.is_admin()
    or exists (
      select 1
      from public.projects p
      where p.id = results.project_id
        and p.customer_id = auth.uid()
    )
  );

create policy "results_admin_insert"
  on public.results for insert
  with check (public.is_admin());

create policy "results_admin_update"
  on public.results for update
  using (public.is_admin())
  with check (public.is_admin());

create policy "results_admin_delete"
  on public.results for delete
  using (public.is_admin());

-- ---------------------------------------------------------------------------
-- service_orders: customers read their own; only admins write.
-- ---------------------------------------------------------------------------

alter table public.service_orders enable row level security;

create policy "service_orders_select_own"
  on public.service_orders for select
  using (customer_id = auth.uid() or public.is_admin());

create policy "service_orders_admin_insert"
  on public.service_orders for insert
  with check (public.is_admin());

create policy "service_orders_admin_update"
  on public.service_orders for update
  using (public.is_admin())
  with check (public.is_admin());

create policy "service_orders_admin_delete"
  on public.service_orders for delete
  using (public.is_admin());
