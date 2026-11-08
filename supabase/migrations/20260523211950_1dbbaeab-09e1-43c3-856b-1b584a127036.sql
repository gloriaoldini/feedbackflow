
-- Enums
create type public.app_role as enum ('admin', 'member');
create type public.subscription_tier as enum ('trial', 'starter', 'pro', 'business');
create type public.source_type as enum ('slack', 'intercom', 'gmail');
create type public.sentiment as enum ('positive', 'neutral', 'negative');
create type public.topic as enum ('pricing','bug','feature_request','ux','docs','performance','billing','security','other');
create type public.urgency as enum ('low','medium','high');

-- Organizations
create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  subscription_tier public.subscription_tier not null default 'trial',
  trial_ends_at timestamptz not null default (now() + interval '14 days'),
  logo_url text,
  stripe_customer_id text,
  created_at timestamptz not null default now()
);
alter table public.organizations enable row level security;

-- Profiles
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  avatar_url text,
  current_org_id uuid references public.organizations(id) on delete set null,
  last_active_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
alter table public.profiles enable row level security;

-- User roles (separate table for security)
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  org_id uuid not null references public.organizations(id) on delete cascade,
  role public.app_role not null default 'member',
  created_at timestamptz not null default now(),
  unique(user_id, org_id, role)
);
alter table public.user_roles enable row level security;

-- Security definer helpers (avoid RLS recursion)
create or replace function public.has_role(_user_id uuid, _org_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists(select 1 from public.user_roles where user_id=_user_id and org_id=_org_id and role=_role);
$$;

create or replace function public.is_org_member(_user_id uuid, _org_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists(select 1 from public.user_roles where user_id=_user_id and org_id=_org_id);
$$;

-- Sources
create table public.sources (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  type public.source_type not null,
  is_active boolean not null default true,
  config jsonb not null default '{}'::jsonb,
  connected_at timestamptz not null default now()
);
alter table public.sources enable row level security;

-- Selected topics
create table public.selected_topics (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  topic public.topic not null,
  created_at timestamptz not null default now(),
  unique(org_id, topic)
);
alter table public.selected_topics enable row level security;

-- Feedback items
create table public.feedback_items (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  source public.source_type not null,
  author text,
  original_text text not null,
  summary text,
  sentiment public.sentiment,
  topic public.topic,
  urgency public.urgency not null default 'low',
  is_feature_request boolean not null default false,
  is_addressed boolean not null default false,
  created_at timestamptz not null default now()
);
alter table public.feedback_items enable row level security;
create index on public.feedback_items(org_id, created_at desc);

-- Aggregated feature requests
create table public.feature_requests_aggregated (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  topic_name text not null,
  mention_count int not null default 1,
  last_mentioned_at timestamptz not null default now(),
  jira_ticket_url text,
  created_at timestamptz not null default now(),
  unique(org_id, topic_name)
);
alter table public.feature_requests_aggregated enable row level security;

-- ============ RLS POLICIES ============
-- Profiles
create policy "Users view own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users update own profile" on public.profiles for update using (auth.uid() = id);
create policy "Users insert own profile" on public.profiles for insert with check (auth.uid() = id);

-- Organizations
create policy "Members view org" on public.organizations for select using (public.is_org_member(auth.uid(), id));
create policy "Admins update org" on public.organizations for update using (public.has_role(auth.uid(), id, 'admin'));
create policy "Authenticated create org" on public.organizations for insert with check (auth.uid() is not null);

-- User roles
create policy "Users view roles in their orgs" on public.user_roles for select using (public.is_org_member(auth.uid(), org_id));
create policy "Admins manage roles" on public.user_roles for all using (public.has_role(auth.uid(), org_id, 'admin'));
create policy "User insert own role" on public.user_roles for insert with check (auth.uid() = user_id);

-- Sources
create policy "Members view sources" on public.sources for select using (public.is_org_member(auth.uid(), org_id));
create policy "Admins manage sources" on public.sources for all using (public.has_role(auth.uid(), org_id, 'admin'));

-- Selected topics
create policy "Members view topics" on public.selected_topics for select using (public.is_org_member(auth.uid(), org_id));
create policy "Admins manage topics" on public.selected_topics for all using (public.has_role(auth.uid(), org_id, 'admin'));

-- Feedback
create policy "Members view feedback" on public.feedback_items for select using (public.is_org_member(auth.uid(), org_id));
create policy "Members update feedback" on public.feedback_items for update using (public.is_org_member(auth.uid(), org_id));
create policy "Admins insert feedback" on public.feedback_items for insert with check (public.is_org_member(auth.uid(), org_id));

-- Feature requests
create policy "Members view feature requests" on public.feature_requests_aggregated for select using (public.is_org_member(auth.uid(), org_id));
create policy "Members manage feature requests" on public.feature_requests_aggregated for all using (public.is_org_member(auth.uid(), org_id));

-- ============ NEW USER TRIGGER ============
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  new_org_id uuid;
  base_slug text;
  display_name text;
  i int := 0;
  mock_messages jsonb := '[
    {"src":"slack","author":"Sarah Chen","text":"Would absolutely love a dark mode option, my eyes are dying at night.","sent":"positive","topic":"feature_request","urg":"low","fr":true,"sum":"Requests dark mode for late-night usage"},
    {"src":"intercom","author":"Marcus Wong","text":"The API rate limit is killing our integration. We hit 429s constantly. Can you bump it?","sent":"negative","topic":"feature_request","urg":"high","fr":true,"sum":"Needs higher API rate limit to avoid 429s"},
    {"src":"gmail","author":"Priya Sharma","text":"Slack notifications when a customer leaves negative feedback would be huge.","sent":"positive","topic":"feature_request","urg":"medium","fr":true,"sum":"Wants Slack alerts on negative feedback"},
    {"src":"slack","author":"Diego Torres","text":"Dashboard is crashing on Safari 17. Blocking our QA team.","sent":"negative","topic":"bug","urg":"high","fr":false,"sum":"Safari 17 dashboard crash blocking QA"},
    {"src":"intercom","author":"Anna Volkov","text":"Loving the new sentiment analysis, really helps prioritize.","sent":"positive","topic":"ux","urg":"low","fr":false,"sum":"Praises sentiment analysis feature"},
    {"src":"gmail","author":"Tom Becker","text":"Pricing page is confusing. What''s the difference between Pro and Business?","sent":"neutral","topic":"pricing","urg":"low","fr":false,"sum":"Confused about Pro vs Business tiers"},
    {"src":"slack","author":"Yuki Tanaka","text":"Dark mode please! Working nights and the white is brutal.","sent":"neutral","topic":"feature_request","urg":"low","fr":true,"sum":"Another dark mode request"},
    {"src":"intercom","author":"James OConnor","text":"Export to Jira would save us 2 hours a week. Please.","sent":"positive","topic":"feature_request","urg":"medium","fr":true,"sum":"Wants Jira export integration"},
    {"src":"slack","author":"Fatima Al-Hassan","text":"Performance is awful on the feedback list page when we have >500 items.","sent":"negative","topic":"performance","urg":"medium","fr":false,"sum":"Slow feedback list at scale"},
    {"src":"gmail","author":"Robert Kim","text":"Billing charged me twice this month. Need a refund ASAP.","sent":"negative","topic":"billing","urg":"high","fr":false,"sum":"Double charge — needs urgent refund"},
    {"src":"slack","author":"Eva Lindqvist","text":"The new docs are 10x better. Found what I needed in 30 seconds.","sent":"positive","topic":"docs","urg":"low","fr":false,"sum":"Loves the new documentation"},
    {"src":"intercom","author":"Hassan Mehta","text":"Two-factor auth is a must-have for our enterprise rollout.","sent":"neutral","topic":"security","urg":"medium","fr":true,"sum":"Needs 2FA for enterprise"},
    {"src":"slack","author":"Linda Park","text":"API rate limits — same issue. We''re a paying customer, can''t work like this.","sent":"negative","topic":"feature_request","urg":"high","fr":true,"sum":"Paying customer blocked by rate limits"},
    {"src":"gmail","author":"Carlos Mendez","text":"UI feels cluttered, especially the dashboard. Less is more?","sent":"negative","topic":"ux","urg":"low","fr":false,"sum":"Dashboard feels cluttered"},
    {"src":"intercom","author":"Olivia Brown","text":"Dark mode would be game-changing. Third time asking!","sent":"negative","topic":"feature_request","urg":"medium","fr":true,"sum":"Repeated dark mode request"},
    {"src":"slack","author":"Akira Nakamura","text":"Slack integration for alerts is what would push us to Pro.","sent":"positive","topic":"feature_request","urg":"medium","fr":true,"sum":"Slack alerts would drive upgrade"},
    {"src":"gmail","author":"Sophie Laurent","text":"Search filters are clunky. Add date range plz.","sent":"neutral","topic":"ux","urg":"low","fr":false,"sum":"Wants date range filters in search"},
    {"src":"intercom","author":"David Cohen","text":"Quick question — does the Pro plan include API access?","sent":"neutral","topic":"pricing","urg":"low","fr":false,"sum":"Asks about Pro plan API access"},
    {"src":"slack","author":"Mei Lin","text":"Feature requests view is gold. Knowing top asks is helping us roadmap.","sent":"positive","topic":"ux","urg":"low","fr":false,"sum":"Loves feature request aggregation"},
    {"src":"gmail","author":"Noah Williams","text":"Crashed when uploading CSV >10MB. Lost our import.","sent":"negative","topic":"bug","urg":"high","fr":false,"sum":"CSV upload crashes on large files"},
    {"src":"slack","author":"Isabel Rodriguez","text":"Slack notifications for feature requests would be SO useful.","sent":"positive","topic":"feature_request","urg":"low","fr":true,"sum":"Slack alerts for feature requests"},
    {"src":"intercom","author":"Lucas Schmidt","text":"Onboarding was smooth, got value in 5 min. Well done.","sent":"positive","topic":"ux","urg":"low","fr":false,"sum":"Praises quick onboarding"},
    {"src":"slack","author":"Aisha Patel","text":"API limit blocking our nightly sync. ASAP fix needed.","sent":"negative","topic":"feature_request","urg":"high","fr":true,"sum":"API limit blocks nightly sync"},
    {"src":"gmail","author":"Ethan Carter","text":"Could we get a webhook when sentiment drops below 50%?","sent":"neutral","topic":"feature_request","urg":"low","fr":true,"sum":"Wants sentiment-drop webhook"},
    {"src":"intercom","author":"Grace Hu","text":"Mobile app when??","sent":"neutral","topic":"feature_request","urg":"low","fr":true,"sum":"Asks about mobile app"},
    {"src":"slack","author":"Ben Foster","text":"Annual plan discount would seal the deal for us.","sent":"neutral","topic":"pricing","urg":"low","fr":false,"sum":"Asks about annual discount"},
    {"src":"gmail","author":"Chloe Martin","text":"Page load on dashboard takes 4-5s. Too slow.","sent":"negative","topic":"performance","urg":"medium","fr":false,"sum":"Slow dashboard load times"},
    {"src":"intercom","author":"Ravi Iyer","text":"Loving this tool. Replaced 3 spreadsheets already.","sent":"positive","topic":"ux","urg":"low","fr":false,"sum":"Replaced multiple spreadsheets"},
    {"src":"slack","author":"Hannah Schultz","text":"SSO via SAML is a hard requirement for our security team.","sent":"neutral","topic":"security","urg":"high","fr":true,"sum":"SAML SSO required for security"},
    {"src":"gmail","author":"Felix Andersson","text":"Just upgraded to Pro. Worth every penny so far!","sent":"positive","topic":"pricing","urg":"low","fr":false,"sum":"Happy customer after Pro upgrade"}
  ]'::jsonb;
  item jsonb;
begin
  display_name := coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email,'@',1));
  base_slug := lower(regexp_replace(coalesce(new.raw_user_meta_data->>'company', display_name), '[^a-z0-9]+', '-', 'g')) || '-' || substr(new.id::text,1,6);

  insert into public.profiles (id, email, full_name, avatar_url)
  values (new.id, new.email, display_name, new.raw_user_meta_data->>'avatar_url');

  insert into public.organizations (name, slug)
  values (coalesce(new.raw_user_meta_data->>'company', display_name || '''s Workspace'), base_slug)
  returning id into new_org_id;

  update public.profiles set current_org_id = new_org_id where id = new.id;

  insert into public.user_roles (user_id, org_id, role) values (new.id, new_org_id, 'admin');

  -- Seed mock feedback so dashboard isn't empty
  for item in select * from jsonb_array_elements(mock_messages) loop
    insert into public.feedback_items (org_id, source, author, original_text, summary, sentiment, topic, urgency, is_feature_request, created_at)
    values (
      new_org_id,
      (item->>'src')::public.source_type,
      item->>'author',
      item->>'text',
      item->>'sum',
      (item->>'sent')::public.sentiment,
      (item->>'topic')::public.topic,
      (item->>'urg')::public.urgency,
      (item->>'fr')::boolean,
      now() - (i || ' hours')::interval - (random()*30 || ' minutes')::interval
    );
    i := i + 1;
  end loop;

  -- Aggregate top features
  insert into public.feature_requests_aggregated (org_id, topic_name, mention_count, last_mentioned_at)
  values
    (new_org_id, 'Dark mode', 12, now() - interval '2 hours'),
    (new_org_id, 'API rate limit increase', 9, now() - interval '4 hours'),
    (new_org_id, 'Slack notifications', 7, now() - interval '6 hours'),
    (new_org_id, 'Jira export', 5, now() - interval '1 day'),
    (new_org_id, 'SAML SSO', 4, now() - interval '2 days'),
    (new_org_id, 'Mobile app', 3, now() - interval '3 days');

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
