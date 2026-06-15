import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

async function getEmailConfig() {
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  const [keyRes, emailRes, nameRes] = await Promise.all([
    supabaseAdmin.from('settings').select('value').eq('key', 'resend_api_key').single(),
    supabaseAdmin.from('settings').select('value').eq('key', 'resend_from_email').single(),
    supabaseAdmin.from('settings').select('value').eq('key', 'resend_from_name').single(),
  ]);

  const apiKey = keyRes.data?.value || process.env.RESEND_API_KEY;
  const fromEmail = emailRes.data?.value || process.env.RESEND_FROM_EMAIL || 'noreply@baddiecastings.com';
  const fromName = nameRes.data?.value || 'Baddie Castings';

  return {
    apiKey,
    from: `${fromName} <${fromEmail}>`,
    configured: !!(keyRes.data?.value && emailRes.data?.value),
  };
}

export async function POST(request) {
  try {
    const { to, subject, html } = await request.json();

    if (!to || !subject || !html) {
      return NextResponse.json(
        { error: 'Missing required fields: to, subject, or html' },
        { status: 400 }
      );
    }

    const { apiKey, from } = await getEmailConfig();

    if (!apiKey || apiKey === 'placeholder_key') {
      return NextResponse.json({ error: 'Resend is not configured. Add your API key in Agency Settings.' }, { status: 503 });
    }

    const resend = new Resend(apiKey);
    const { data, error } = await resend.emails.send({ from, to: [to], subject, html });

    if (error) {
      console.error('[Resend Error]', error);
      return NextResponse.json({ error }, { status: 400 });
    }

    return NextResponse.json({ success: true, data, from });
  } catch (err) {
    console.error('[Send Email Error]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
