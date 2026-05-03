# Supabase Setup

## Run the Schema

1. Go to your Supabase dashboard: https://supabase.com/dashboard
2. Select your project (the one in `.env.local`)
3. Click **SQL Editor** in the left sidebar
4. Click **New Query**
5. Paste the entire contents of `schema.sql`
6. Click **Run**

That's it. The schema will:
- Create all 10 tables with proper columns and constraints
- Enable Row Level Security on every table
- Add RLS policies so users only see their own data
- Create a trigger that auto-creates a `profiles` row whenever someone signs up via `/apply`
- Seed default settings, shop products, announcements, and sample listings

## After Running

- New users who sign up via `/apply` will automatically get a row in `profiles` with `status = 'pending'`
- Approve users by running: `update profiles set status = 'active' where email = 'user@email.com';`
- Make someone an admin: `update profiles set role = 'admin', status = 'active' where email = 'admin@email.com';`

## Tables Created

| Table | Purpose |
|-------|---------|
| `profiles` | One row per user — role, status, measurements, etc. |
| `listings` | Casting calls and opportunities |
| `applications` | Talent applications to listings |
| `shifts` | Booked/scheduled events for talent |
| `transactions` | Payment history (charges + payouts) |
| `notifications` | In-app notifications |
| `announcements` | Admin broadcast messages |
| `settings` | Key-value config (weekend colors, fees, etc.) |
| `products` | Shop items (uniforms, add-ons) |
| `orders` | Shop purchases |
