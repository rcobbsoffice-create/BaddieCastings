import { NextResponse } from 'next/server';
import { resend } from '@/lib/resend';

export async function POST(request) {
  try {
    const { to, subject, html } = await request.json();

    if (!to || !subject || !html) {
      return NextResponse.json(
        { error: 'Missing required fields: to, subject, or html' },
        { status: 400 }
      );
    }

    const { data, error } = await resend.emails.send({
      from: 'onboarding@resend.dev', // Use this for testing until your domain is verified
      to: [to],
      subject: subject,
      html: html,
    });

    if (error) {
      console.error('[Resend Error]', error);
      return NextResponse.json({ error }, { status: 400 });
    }

    return NextResponse.json({ success: true, data });
  } catch (err) {
    console.error('[Send Email Error]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
