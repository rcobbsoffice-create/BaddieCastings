import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

export async function POST(request) {
  try {
    const { to } = await request.json();

    if (!to) {
      return NextResponse.json({ error: 'Missing recipient email.' }, { status: 400 });
    }

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
    const from = `${fromName} <${fromEmail}>`;

    if (!apiKey || apiKey === 'placeholder_key') {
      return NextResponse.json({ error: 'No Resend API key configured.' }, { status: 503 });
    }

    const resend = new Resend(apiKey);

    const { data, error } = await resend.emails.send({
      from,
      to: [to],
      subject: 'Baddie Castings — Email Config Test ✅',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px; background: #080810; color: #fff; border-radius: 12px;">
          <h2 style="color: #FF007A; margin-bottom: 8px;">Email Config Test</h2>
          <p style="color: #aaa; margin-bottom: 24px;">This is a test email sent from your Baddie Castings platform.</p>
          <div style="background: #12121e; border: 1px solid #2a2a3e; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
            <p style="margin: 0 0 8px; font-size: 13px; color: #888;">Sent from:</p>
            <p style="margin: 0; font-size: 15px; color: #fff; font-weight: 700;">${from}</p>
          </div>
          <p style="color: #aaa; font-size: 13px;">If you received this, your Resend email domain is configured correctly.</p>
          <p style="color: #555; font-size: 12px; margin-top: 24px;">Baddie Castings · Atlanta, GA</p>
        </div>
      `,
    });

    if (error) {
      console.error('[Resend Test Error]', error);
      return NextResponse.json({ error: error.message || JSON.stringify(error) }, { status: 400 });
    }

    return NextResponse.json({ success: true, from, data });
  } catch (err) {
    console.error('[Test Email Error]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
