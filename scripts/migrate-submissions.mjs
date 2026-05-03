/**
 * migrate-submissions.mjs
 * Reads the exported WordPress form submissions and upserts them into Supabase.
 * Run: node scripts/migrate-submissions.mjs
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ── Supabase credentials ───────────────────────────────────────────────────
const SUPABASE_URL     = process.env.NEXT_PUBLIC_SUPABASE_URL     || process.env.SUPABASE_URL;
const SUPABASE_SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY    || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE) {
  console.error('❌  Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY env vars.');
  console.error('   Create a .env.local file or export them before running.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE);

// ── Load exported data ─────────────────────────────────────────────────────
const filePath    = join(__dirname, 'wp-submissions-export.json');
const submissions = JSON.parse(readFileSync(filePath, 'utf8'));
console.log(`📦  Loaded ${submissions.length} submissions from export file.`);

// ── Batch upsert ───────────────────────────────────────────────────────────
const BATCH = 100;
let inserted = 0, errors = 0;

for (let i = 0; i < submissions.length; i += BATCH) {
  const batch = submissions.slice(i, i + BATCH).map(s => ({
    wp_id:        s.wp_id,
    form_name:    s.form_name || 'Website Form',
    email:        s.email     || null,
    fields:       s.fields    || {},
    is_read:      s.is_read   || false,
    status:       'new',
    submitted_at: s.submitted_at
      ? new Date(s.submitted_at).toISOString()
      : new Date().toISOString(),
  }));

  const { error } = await supabase
    .from('form_submissions')
    .insert(batch);

  if (error) {
    console.error(`  ✗ Batch ${i}–${i + BATCH}:`, error.message);
    errors++;
  } else {
    inserted += batch.length;
    process.stdout.write(`  ✓ ${inserted}/${submissions.length}\r`);
  }
}

console.log(`\n✅  Done! Inserted/skipped ${inserted} rows, ${errors} batch errors.`);
