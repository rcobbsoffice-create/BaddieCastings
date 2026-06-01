import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const { form_name, email, fields } = await request.json();

    if (!form_name || !fields) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const { error } = await supabaseAdmin.from('form_submissions').insert([{
      form_name,
      email: email || null,
      fields,
      status: 'new',
    }]);

    if (error) {
      console.error('[Form Submit Error]', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[Form Submit Exception]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
