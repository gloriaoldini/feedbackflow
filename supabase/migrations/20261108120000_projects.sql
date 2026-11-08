-- Projects: one product per project inside a workspace (organization).
-- Each project has its own feedback, top requests, source routing and Jira/Linear destination.

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  slug text not null,
  description text,
  color text not null default 'coral',
  -- source routing: which Slack channels / Intercom tag / Gmail alias feed this project
  routing jsonb not null default '{"slackChannels": [], "intercomTag": "", "gmailAlias": ""}'::jsonb,
  default_destination text not null default 'jira' check (default_destination in ('jira', 'linear')),
  destination_key text,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  unique (org_id, slug)
);

alter table public.projects enable row level security;

create policy "Members view projects" on public.projects
  for select using (public.is_org_member(auth.uid(), org_id));
create policy "Members create projects" on public.projects
  for insert with check (public.is_org_member(auth.uid(), org_id));
create policy "Admins manage projects" on public.projects
  for update using (public.has_role(auth.uid(), org_id, 'admin'));
create policy "Admins delete projects" on public.projects
  for delete using (public.has_role(auth.uid(), org_id, 'admin'));

-- Scope existing data to a project
alter table public.feedback_items add column if not exists project_id uuid references public.projects(id) on delete cascade;
alter table public.feature_requests_aggregated add column if not exists project_id uuid references public.projects(id) on delete cascade;
alter table public.sources add column if not exists project_id uuid references public.projects(id) on delete cascade;

create index if not exists feedback_items_project_idx on public.feedback_items (project_id, created_at desc);
create index if not exists feature_requests_project_idx on public.feature_requests_aggregated (project_id, mention_count desc);

-- Backfill: one default project per existing organization
insert into public.projects (org_id, name, slug)
select o.id, 'Main product', 'main-product'
from public.organizations o
where not exists (select 1 from public.projects p where p.org_id = o.id);

update public.feedback_items f set project_id = p.id
from public.projects p where p.org_id = f.org_id and f.project_id is null;

update public.feature_requests_aggregated r set project_id = p.id
from public.projects p where p.org_id = r.org_id and r.project_id is null;

update public.sources s set project_id = p.id
from public.projects p where p.org_id = s.org_id and s.project_id is null;
