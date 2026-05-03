const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL     = 'https://pefaveyeqymfyqpncngq.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBlZmF2ZXllcXltZnlxcG5jbmdxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjMwNTQ2MiwiZXhwIjoyMDkxODgxNDYyfQ.0TkmkFRtHbzbkM4ZIoq4DpEdqhWpfwyvYdww4uCIwsM';
const DEMO_PASSWORD    = 'Baddie2024!';

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const DEMO_USERS = [
  { email: 'talent@baddiecastings.com',  role: 'talent',  full_name: 'Tasha Talent'  },
  { email: 'agent@baddiecastings.com',   role: 'agent',   full_name: 'Alex Agent'    },
  { email: 'creator@baddiecastings.com', role: 'creator', full_name: 'Chris Creator' },
  { email: 'agency@baddiecastings.com',  role: 'agency',  full_name: 'Aria Agency'   },
  { email: 'admin@baddiecastings.com',   role: 'admin',   full_name: 'Admin User'    },
];

async function run() {
  console.log('Seeding demo users...\n');

  for (const u of DEMO_USERS) {
    let userId;

    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email:         u.email,
      password:      DEMO_PASSWORD,
      email_confirm: true,
      user_metadata: { full_name: u.full_name, role: u.role },
    });

    if (createErr) {
      if (createErr.message?.includes('already been registered') || createErr.code === 'email_exists') {
        const { data: list } = await admin.auth.admin.listUsers();
        const existing = list?.users?.find(usr => usr.email === u.email);
        if (!existing) {
          console.error(`  x ${u.email} — could not find existing user: ${createErr.message}`);
          continue;
        }
        userId = existing.id;
        console.log(`  ~ ${u.email} — already exists, updating profile`);
      } else {
        console.error(`  x ${u.email} — ${createErr.message}`);
        continue;
      }
    } else {
      userId = created.user.id;
      console.log(`  + ${u.email} — created (id: ${userId})`);
    }

    const { error: profErr } = await admin.from('profiles').upsert({
      id:        userId,
      email:     u.email,
      full_name: u.full_name,
      role:      u.role,
      status:    'active',
    }, { onConflict: 'id' });

    if (profErr) {
      console.error(`  x profile upsert for ${u.email} — ${profErr.message}`);
    } else {
      console.log(`  v profile set  role=${u.role} status=active`);
    }
  }

  console.log('\nDone!');
  console.log('--------------------------------------------');
  console.log('Demo credentials (shared password):');
  console.log('Password: Baddie2024!\n');
  DEMO_USERS.forEach(u =>
    console.log(`  ${u.role.padEnd(8)} => ${u.email}`)
  );
  console.log('--------------------------------------------');
}

run().catch(console.error);
