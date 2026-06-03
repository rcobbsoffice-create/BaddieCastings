-- =============================================================
-- BADDIE CASTINGS — FULL DATABASE SCHEMA
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor → New Query)
-- Safe to re-run: drops all app tables first, then recreates from scratch.
-- =============================================================


-- =============================================================
-- TEARDOWN  (drop in reverse dependency order)
-- =============================================================
drop table if exists form_submissions cascade;
drop table if exists orders        cascade;
drop table if exists products      cascade;
drop table if exists settings      cascade;
drop table if exists announcements cascade;
drop table if exists notifications cascade;
drop table if exists transactions  cascade;
drop table if exists shifts        cascade;
drop table if exists applications  cascade;
drop table if exists listings      cascade;
drop table if exists profiles      cascade;

drop function if exists handle_new_user()   cascade;
drop function if exists handle_updated_at() cascade;


-- =============================================================
-- EXTENSIONS
-- =============================================================
create extension if not exists "uuid-ossp";


-- =============================================================
-- HELPER: auto-update updated_at column
-- =============================================================
create or replace function handle_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;


-- =============================================================
-- 1. PROFILES
--    One row per auth user. Created on sign-up.
-- =============================================================
create table if not exists profiles (
  id              uuid primary key references auth.users(id) on delete cascade,
  email           text not null,
  full_name       text,
  role            text not null default 'talent'
                  check (role in ('talent','creator','agent','agency','admin','bottle_girl','bartender','hookah_girl','dj')),
  status          text not null default 'pending'
                  check (status in ('pending','active','suspended','rejected')),

  -- contact / social
  city            text,
  instagram       text,
  phone           text,
  bio             text,
  avatar_url      text,
  website         text,

  -- talent-specific
  dress_size      text,
  shoe_size       text,
  height          text,
  experience      text,

  -- creator-specific
  specialty       text,
  hourly_rate     text,
  portfolio_url   text,

  -- agent / agency-specific
  company_name    text,
  company_type    text,

  -- ID verification
  id_front_url    text,
  id_back_url     text,
  id_verified     boolean not null default false,

  -- stats (kept denormalised for fast reads)
  shifts_worked   integer not null default 0,
  rating          numeric(3,1) not null default 0.0,
  total_earned    numeric(10,2) not null default 0.0,

  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create trigger profiles_updated_at
  before update on profiles
  for each row execute procedure handle_updated_at();

-- RLS
alter table profiles enable row level security;

create policy "Public profiles are viewable by authenticated users"
  on profiles for select
  using (auth.uid() is not null);

create policy "Users can insert their own profile"
  on profiles for insert
  with check (auth.uid() = id);

create policy "Users can update their own profile"
  on profiles for update
  using (auth.uid() = id);

create policy "Admins can update any profile"
  on profiles for update
  using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );


-- =============================================================
-- 2. LISTINGS  (casting opportunities)
-- =============================================================
create table if not exists listings (
  id            uuid primary key default uuid_generate_v4(),
  posted_by     uuid references profiles(id) on delete set null,

  category      text not null default 'Nightlife'
                check (category in ('Nightlife','Photoshoots','Videoshoots','Branding','Events')),
  title         text not null,
  venue         text,
  date          text,                       -- stored as display string ("Sat Apr 19")
  location      text,
  pay           text,
  color         text,                       -- dress code
  spots         integer not null default 1,
  requirements  text,
  status        text not null default 'Open'
                check (status in ('Open','Closing Soon','Closed','Filled')),
  full_details  text,

  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index listings_status_idx on listings(status);
create index listings_category_idx on listings(category);
create index listings_created_at_idx on listings(created_at desc);

create trigger listings_updated_at
  before update on listings
  for each row execute procedure handle_updated_at();

-- RLS
alter table listings enable row level security;

create policy "Anyone authenticated can view listings"
  on listings for select
  using (auth.uid() is not null);

create policy "Agents and admins can insert listings"
  on listings for insert
  with check (
    exists (
      select 1 from profiles p
      where p.id = auth.uid()
        and p.role in ('agent','agency','admin')
        and p.status = 'active'
    )
  );

create policy "Poster or admin can update listing"
  on listings for update
  using (
    posted_by = auth.uid()
    or exists (
      select 1 from profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );


-- =============================================================
-- 3. APPLICATIONS  (talent applying to listings)
-- =============================================================
create table if not exists applications (
  id              uuid primary key default uuid_generate_v4(),
  talent_id       uuid references profiles(id) on delete cascade,
  listing_id      uuid references listings(id) on delete cascade,

  -- denormalised for quick display without joins
  listing_title   text,
  full_name       text,
  instagram       text,
  phone           text,
  portfolio       text,
  notes           text,

  status          text not null default 'pending'
                  check (status in ('pending','approved','rejected','waitlisted')),

  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),

  unique (talent_id, listing_id)
);

create index applications_talent_idx  on applications(talent_id);
create index applications_listing_idx on applications(listing_id);
create index applications_status_idx  on applications(status);

create trigger applications_updated_at
  before update on applications
  for each row execute procedure handle_updated_at();

-- RLS
alter table applications enable row level security;

create policy "Talent can view their own applications"
  on applications for select
  using (talent_id = auth.uid());

create policy "Agents and admins can view all applications"
  on applications for select
  using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid()
        and p.role in ('agent','agency','admin')
    )
  );

create policy "Authenticated talent can apply"
  on applications for insert
  with check (talent_id = auth.uid());

create policy "Agents and admins can update application status"
  on applications for update
  using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid()
        and p.role in ('agent','agency','admin')
    )
  );


-- =============================================================
-- 4. SHIFTS  (booked/scheduled events for talent)
-- =============================================================
create table if not exists shifts (
  id          uuid primary key default uuid_generate_v4(),
  talent_id   uuid references profiles(id) on delete cascade,
  assigned_by uuid references profiles(id) on delete set null,

  day         text,                   -- "Saturday"
  date        text,                   -- "Apr 19"
  venue       text not null,
  address     text,
  start_time  text,
  end_time    text,
  color       text,                   -- uniform color code
  spots       integer default 1,
  confirmed   boolean not null default false,
  notes       text,
  pay         numeric(10,2),

  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index shifts_talent_idx on shifts(talent_id);
create index shifts_date_idx   on shifts(date);

create trigger shifts_updated_at
  before update on shifts
  for each row execute procedure handle_updated_at();

-- RLS
alter table shifts enable row level security;

create policy "Talent can view their own shifts"
  on shifts for select
  using (talent_id = auth.uid());

create policy "Agents and admins can view all shifts"
  on shifts for select
  using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid()
        and p.role in ('agent','agency','admin')
    )
  );

create policy "Agents and admins can manage shifts"
  on shifts for all
  using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid()
        and p.role in ('agent','agency','admin')
    )
  );


-- =============================================================
-- 5. TRANSACTIONS  (payment history)
-- =============================================================
create table if not exists transactions (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid references profiles(id) on delete cascade,
  label       text not null,
  amount      numeric(10,2) not null,      -- negative = charge, positive = payout
  type        text not null default 'charge'
              check (type in ('charge','payout','refund')),
  status      text not null default 'pending'
              check (status in ('pending','paid','overdue','failed')),
  due_date    date,
  paid_at     timestamptz,
  notes       text,

  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index transactions_user_idx    on transactions(user_id);
create index transactions_status_idx  on transactions(status);

create trigger transactions_updated_at
  before update on transactions
  for each row execute procedure handle_updated_at();

-- RLS
alter table transactions enable row level security;

create policy "Users can view their own transactions"
  on transactions for select
  using (user_id = auth.uid());

create policy "Admins can view all transactions"
  on transactions for select
  using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

create policy "Admins can manage transactions"
  on transactions for all
  using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );


-- =============================================================
-- 6. NOTIFICATIONS
-- =============================================================
create table if not exists notifications (
  id         uuid primary key default uuid_generate_v4(),
  user_id    uuid references profiles(id) on delete cascade,
  type       text not null default 'info'
             check (type in ('info','booking','payment','alert','announcement')),
  title      text not null,
  body       text,
  icon       text,
  color      text,
  unread     boolean not null default true,
  action_url text,

  created_at timestamptz not null default now()
);

create index notifications_user_idx   on notifications(user_id);
create index notifications_unread_idx on notifications(user_id, unread) where unread = true;

-- RLS
alter table notifications enable row level security;

create policy "Users can view their own notifications"
  on notifications for select
  using (user_id = auth.uid());

create policy "Users can mark their own notifications as read"
  on notifications for update
  using (user_id = auth.uid());

create policy "Admins and agents can insert notifications"
  on notifications for insert
  with check (
    exists (
      select 1 from profiles p
      where p.id = auth.uid()
        and p.role in ('admin','agent','agency')
    )
  );


-- =============================================================
-- 7. ANNOUNCEMENTS  (admin broadcasts shown on dashboard)
-- =============================================================
create table if not exists announcements (
  id         uuid primary key default uuid_generate_v4(),
  title      text not null,
  body       text,
  full_text  text,
  author     text not null default 'Admin',
  icon       text default '📣',
  pinned     boolean not null default false,
  active     boolean not null default true,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger announcements_updated_at
  before update on announcements
  for each row execute procedure handle_updated_at();

-- RLS
alter table announcements enable row level security;

create policy "Authenticated users can read announcements"
  on announcements for select
  using (auth.uid() is not null);

create policy "Admins can manage announcements"
  on announcements for all
  using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );


-- =============================================================
-- 8. SETTINGS  (key-value config store)
-- =============================================================
create table if not exists settings (
  key        text primary key,
  value      jsonb not null,
  updated_by uuid references profiles(id) on delete set null,
  updated_at timestamptz not null default now()
);

-- RLS
alter table settings enable row level security;

create policy "Authenticated users can read settings"
  on settings for select
  using (auth.uid() is not null);

create policy "Admins can manage settings"
  on settings for all
  using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );


-- =============================================================
-- 9. PRODUCTS  (shop items: uniforms, add-ons)
-- =============================================================
create table if not exists products (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null,
  emoji       text,
  description text,
  price       numeric(10,2) not null,
  badge       text,
  badge_class text,
  active      boolean not null default true,
  stock       integer,
  sort_order  integer not null default 0,

  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create trigger products_updated_at
  before update on products
  for each row execute procedure handle_updated_at();

-- RLS
alter table products enable row level security;

create policy "Authenticated users can view products"
  on products for select
  using (auth.uid() is not null);

create policy "Admins can manage products"
  on products for all
  using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );


-- =============================================================
-- 10. ORDERS  (shop purchases)
-- =============================================================
create table if not exists orders (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid references profiles(id) on delete cascade,
  product_id  uuid references products(id) on delete set null,
  product_name text,
  quantity    integer not null default 1,
  total       numeric(10,2) not null,
  status      text not null default 'pending'
              check (status in ('pending','paid','shipped','cancelled')),
  notes       text,

  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index orders_user_idx on orders(user_id);

create trigger orders_updated_at
  before update on orders
  for each row execute procedure handle_updated_at();

-- RLS
alter table orders enable row level security;

create policy "Users can view their own orders"
  on orders for select
  using (user_id = auth.uid());

create policy "Users can place orders"
  on orders for insert
  with check (user_id = auth.uid());

create policy "Admins can view and manage all orders"
  on orders for all
  using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );


-- =============================================================
-- AUTO-CREATE PROFILE ON SIGN-UP
--   Fires after a new user is added to auth.users
-- =============================================================
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (
    id,
    email,
    full_name,
    role,
    status,
    city,
    instagram,
    dress_size,
    shoe_size,
    height,
    experience,
    specialty,
    hourly_rate,
    portfolio_url,
    company_name,
    company_type,
    website
  ) values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.raw_user_meta_data->>'role', 'talent'),
    'pending',
    new.raw_user_meta_data->>'city',
    new.raw_user_meta_data->>'instagram',
    new.raw_user_meta_data->>'dress_size',
    new.raw_user_meta_data->>'shoe_size',
    new.raw_user_meta_data->>'height',
    new.raw_user_meta_data->>'experience',
    new.raw_user_meta_data->>'specialty',
    new.raw_user_meta_data->>'hourly_rate',
    new.raw_user_meta_data->>'portfolio_url',
    new.raw_user_meta_data->>'company_name',
    new.raw_user_meta_data->>'company_type',
    new.raw_user_meta_data->>'website'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();


-- =============================================================
-- SEED DATA
-- =============================================================

-- Default settings
insert into settings (key, value) values
  ('currentWeekendColors', '{"saturday":{"name":"Hot Pink","hex":"#FF007A"},"sunday":{"name":"Royal Purple","hex":"#9B59FF"}}'),
  ('onboardingFee', '180'),
  ('uniformFee', '65'),
  ('platformName', '"Baddie Castings"'),
  ('platformCity', '"Atlanta, GA"')
on conflict (key) do nothing;

-- Seed announcements
insert into announcements (title, body, full_text, author, icon, pinned) values (
  'Welcome to Baddie Castings! 🎉',
  'The platform is live. Check the Opportunities tab for your first casting calls.',
  'Welcome to Baddie Castings — Atlanta''s premier talent and casting platform. Your profile is currently under review. Once approved by our team you''ll have full access to browse casting calls, manage your schedule, and connect with top brands and agencies. Check back soon!',
  'Admin',
  '🎉',
  true
)
on conflict do nothing;

-- Seed shop products
insert into products (name, emoji, description, price, badge, badge_class, sort_order) values
  ('Onboarding Package',   '💼', 'Required for all new talent. Includes platform access, profile setup, and first uniform.',         180.00, 'Required',    'badge-red',    1),
  ('Saturday Uniform',     '🩱', 'Hot pink uniform set for Saturday night events. Required for all booked talent.',                   65.00, 'Required',    'badge-red',    2),
  ('Sunday Uniform',       '👗', 'Royal purple uniform set for Sunday events. Required for all booked talent.',                       65.00, 'Required',    'badge-red',    3),
  ('Rhinestone Fanny Pack','✨', 'Add-on: Rhinestone fanny pack for events. Elevates your look and holds your essentials.',            65.00, 'Add-On',      'badge-gold',   4),
  ('VIP Bundle',           '👑', 'Premium bundle: both uniforms + rhinestone fanny pack. Save $15 vs buying separately.',            135.00, 'Best Value',  'badge-pink',   5),
  ('Lash Kit',             '💄', 'Professional lash kit for event-ready eyes. Optional but recommended.',                             35.00, 'Optional',    'badge-purple', 6)
on conflict do nothing;

-- Seed sample listings
insert into listings (category, title, venue, date, location, pay, color, spots, requirements, status) values
  ('Nightlife',    'Bottle Service Opening Night',      'Club Onyx VIP',              'Sat Apr 19', 'Atlanta, GA', '$200 + tips', 'All Black',    8, 'Heels, confidence, 21+',            'Open'),
  ('Photoshoots',  'Summer Collection Shoot',           'Studio Luxe ATL',            'Thu Apr 24', 'Atlanta, GA', '$350 flat',   'White',        3, 'Sizes 0–8, portfolio required',     'Open'),
  ('Branding',     'Brand Ambassador – Haus of Luxe',   'Remote / Social',            'Ongoing',    'Remote',      '$500/mo + commission', 'N/A', 5, '5k+ IG followers',                  'Open'),
  ('Videoshoots',  'Promo Video – Nightlife Capsule',   'Lounge 22',                  'Fri Apr 25', 'Atlanta, GA', '$275',        'Red',          4, 'Natural hair a plus',               'Closing Soon'),
  ('Events',       'Lifestyle Expo Brand Host',          'Atlanta Convention Center',  'Sat May 3',  'Atlanta, GA', '$150/day',    'Brand Uniform',10, 'Outgoing personality',              'Open')
on conflict do nothing;


-- =============================================================
-- 11. FORM_SUBMISSIONS  (migrated from WordPress / future web form leads)
-- =============================================================
create table if not exists form_submissions (
  id            uuid primary key default uuid_generate_v4(),
  wp_id         integer,                    -- original WordPress post ID
  form_name     text not null default 'Website Form',
  email         text,
  fields        jsonb not null default '{}',-- all captured field key/values
  is_read       boolean not null default false,
  status        text not null default 'new'
                check (status in ('new','reviewed','converted','spam')),
  notes         text,
  linked_profile uuid references profiles(id) on delete set null,
  submitted_at  timestamptz not null default now(),
  created_at    timestamptz not null default now()
);

create index form_submissions_email_idx  on form_submissions(email);
create index form_submissions_status_idx on form_submissions(status);
create index form_submissions_read_idx   on form_submissions(is_read);
create index form_submissions_date_idx   on form_submissions(submitted_at desc);

-- RLS
alter table form_submissions enable row level security;

create policy "Admins and agencies can view all form submissions"
  on form_submissions for select
  using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid()
        and p.role in ('admin','agency')
    )
  );

create policy "Admins and agencies can manage form submissions"
  on form_submissions for all
  using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid()
        and p.role in ('admin','agency')
    )
  );


-- =============================================================
-- AGENCY = ADMIN  (grant agency same data access as admin on all tables)
-- =============================================================

-- transactions: agency can view and manage
create policy "Agencies can view all transactions"
  on transactions for select
  using (
    exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'agency')
  );

create policy "Agencies can manage transactions"
  on transactions for all
  using (
    exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'agency')
  );

-- announcements: agency can manage
create policy "Agencies can manage announcements"
  on announcements for all
  using (
    exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'agency')
  );

-- products: agency can manage
create policy "Agencies can manage products"
  on products for all
  using (
    exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'agency')
  );

-- orders: agency can view and manage
create policy "Agencies can manage orders"
  on orders for all
  using (
    exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'agency')
  );

-- settings: agency can manage
create policy "Agencies can manage settings"
  on settings for all
  using (
    exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'agency')
  );

-- profiles: agency can update any profile (approve/reject talent)
create policy "Agencies can update any profile"
  on profiles for update
  using (
    exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'agency')
  );
-- =============================================================
-- 12. FEATURED_VIDEOS (Homepage portfolio slider)
-- =============================================================
create table if not exists featured_videos (
  id            uuid primary key default uuid_generate_v4(),
  youtube_id    text not null,
  title         text not null,
  subtitle      text,
  cta_text      text default 'Watch Project',
  is_active     boolean not null default true,
  sort_order    integer not null default 0,
  created_at    timestamptz not null default now()
);

create index featured_videos_active_idx on featured_videos(is_active);
create index featured_videos_sort_idx   on featured_videos(sort_order);

-- RLS
alter table featured_videos enable row level security;

create policy "Featured videos are viewable by anyone"
  on featured_videos for select
  using (true);

create policy "Admins and agencies can manage featured videos"
  on featured_videos for all
  using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid()
        and p.role in ('admin','agency')
    )
  );
-- =============================================================
-- 13. PROFILE_MEDIA (Talent portfolio images/videos)
-- =============================================================
create table if not exists profile_media (
  id            uuid primary key default uuid_generate_v4(),
  profile_id    uuid references profiles(id) on delete cascade,
  url           text not null,
  type          text not null check (type in ('image', 'video')),
  is_primary    boolean not null default false,
  sort_order    integer not null default 0,
  created_at    timestamptz not null default now()
);

create index profile_media_profile_idx on profile_media(profile_id);
create index profile_media_type_idx    on profile_media(type);

-- RLS
alter table profile_media enable row level security;

create policy "Profile media is viewable by anyone"
  on profile_media for select
  using (true);

create policy "Users can manage their own profile media"
  on profile_media for all
  using (auth.uid() = profile_id);

create policy "Admins and agencies can manage any profile media"
  on profile_media for all
  using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid()
        and p.role in ('admin', 'agency')
    )
  );
