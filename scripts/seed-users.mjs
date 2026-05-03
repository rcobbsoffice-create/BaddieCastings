import { createClient } from '@supabase/supabase-js/dist/index.cjs';

const SUPABASE_URL       = 'https://pefaveyeqymfyqpncngq.supabase.co';
const SERVICE_ROLE_KEY   = 'sb_secret_2YeNFw8h6onqn6EGDI1C0w_JvDeDTtX';
const DEMO_PASSWORD      = 'Baddie2024!';

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
    // Try to create; if it already exists, just fetch the existing user.
    let userId;

    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email:         u.email,
      password:      DEMO_PASSWORD,
      email_confirm: true,
      user_metadata: { full_name: u.full_name, role: u.role },
    });

    if (createErr) {
      if (createErr.message?.includes('already been registered') || createErr.code === 'email_exists') {
        // User exists — look it up
        const { data: list } = await admin.auth.admin.listUsers();
        const existing = list?.users?.find(usr => usr.email === u.email);
        if (!existing) {
          console.error(`  ✗ ${u.email} — could not find existing user: ${createErr.message}`);
          continue;
        }
        userId = existing.id;
        console.log(`  ~ ${u.email} — already exists, updating profile`);
      } else {
        console.error(`  ✗ ${u.email} — ${createErr.message}`);
        continue;
      }
    } else {
      userId = created.user.id;
      console.log(`  + ${u.email} — created (id: ${userId})`);
    }

    // Upsert profile with active status and correct role
    const { error: profErr } = await admin.from('profiles').upsert({
      id:        userId,
      email:     u.email,
      full_name: u.full_name,
      role:      u.role,
      status:    'active',
    }, { onConflict: 'id' });

    if (profErr) {
      console.error(`  ✗ profile upsert for ${u.email} — ${profErr.message}`);
    } else {
      console.log(`  ✓ profile set  role=${u.role} status=active`);

      // Seed media for talent
      if (u.role === 'talent') {
        const sampleMedia = [
          { profile_id: userId, type: 'image', url: 'https://picsum.photos/seed/talent1/800/1000', sort_order: 0, is_primary: true },
          { profile_id: userId, type: 'image', url: 'https://picsum.photos/seed/talent2/800/1000', sort_order: 1 },
          { profile_id: userId, type: 'video', url: '/Pink-ink.mp4', sort_order: 2 },
        ];
        await admin.from('profile_media').delete().eq('profile_id', userId);
        await admin.from('profile_media').insert(sampleMedia);
        console.log(`  ✓ seeded ${sampleMedia.length} media items`);
      }
    }
  }

  console.log('\nDone!\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Demo credentials (all share the same password)');
  console.log('Password: Baddie2024!\n');
  DEMO_USERS.forEach(u =>
    console.log(`  ${u.role.padEnd(8)} → ${u.email}`)
  );
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

run();
