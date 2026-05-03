import { Resend } from 'resend';

const resendApiKey = process.env.RESEND_API_KEY;

if (!resendApiKey && process.env.NODE_ENV !== 'production') {
  console.warn('⚠️ RESEND_API_KEY is not set in environment variables. Email sending will fail.');
}

export const resend = new Resend(resendApiKey || 'placeholder_key');
