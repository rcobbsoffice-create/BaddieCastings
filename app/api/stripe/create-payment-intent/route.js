import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

export async function POST(request) {
  try {
    const { amount, items } = await request.json();

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    const [secretRes, pubRes] = await Promise.all([
      supabaseAdmin.from('settings').select('value').eq('key', 'stripe_secret_key').single(),
      supabaseAdmin.from('settings').select('value').eq('key', 'stripe_publishable_key').single(),
    ]);

    const secretKey = secretRes.data?.value;
    const publishableKey = pubRes.data?.value;

    if (!secretKey) {
      return NextResponse.json(
        { error: 'Stripe is not configured. Ask your admin to add API keys in the Agency Settings.' },
        { status: 503 }
      );
    }

    const stripe = new Stripe(secretKey);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency: 'usd',
      automatic_payment_methods: { enabled: true },
      metadata: {
        items: JSON.stringify(items || []),
        platform: 'baddie-castings',
      },
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      publishableKey,
    });
  } catch (err) {
    console.error('[Stripe] create-payment-intent error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
