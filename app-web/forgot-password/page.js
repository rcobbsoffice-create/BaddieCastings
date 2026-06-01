'use client';

import { useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import styles from './page.module.css';

export default function ForgotPasswordPage() {
    const [email,   setEmail]   = useState('');
    const [loading, setLoading] = useState(false);
    const [sent,    setSent]    = useState(false);
    const [error,   setError]   = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const redirectTo = `${window.location.origin}/reset-password`;

        const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo,
        });

        setLoading(false);

        if (resetError) {
            setError(resetError.message);
            return;
        }

        setSent(true);
    };

    return (
        <div className={styles.page}>
            <div className={styles.bg} />

            <div className={styles.logo}>
                <Link href="/" style={{ textDecoration: 'none' }}>
                    <span className={styles.logoText}>Baddie Castings</span>
                </Link>
                <span className={styles.logoTag}>Reset Password</span>
            </div>

            <div className={styles.panel}>
                {sent ? (
                    /* ── Success state ── */
                    <>
                        <div className={styles.successIcon}>✉️</div>
                        <h1 className={styles.title}>Check Your Email</h1>
                        <p className={styles.subtitle}>
                            We sent a password reset link to{' '}
                            <strong style={{ color: 'var(--accent-pink)' }}>{email}</strong>.
                            Open it to set a new password.
                        </p>

                        <div className={styles.infoBox}>
                            <span>⏱</span>
                            <span>The link expires in 60 minutes. Check your spam folder if you don&apos;t see it.</span>
                        </div>

                        <button
                            className={styles.resendBtn}
                            onClick={() => { setSent(false); setEmail(''); }}
                        >
                            Use a different email
                        </button>

                        <Link href="/login" className="btn-primary" style={{ width: '100%', display: 'flex', marginTop: 16 }}>
                            Back to Sign In
                        </Link>
                    </>
                ) : (
                    /* ── Request form ── */
                    <>
                        <h1 className={styles.title}>Forgot Password?</h1>
                        <p className={styles.subtitle}>
                            Enter the email you signed up with and we&apos;ll send you a reset link.
                        </p>

                        {error && <div className={styles.errorBox}>⚠️ {error}</div>}

                        <form className={styles.form} onSubmit={handleSubmit}>
                            <div className={styles.field}>
                                <label className={styles.label}>Email Address</label>
                                <input
                                    type="email"
                                    className="input"
                                    placeholder="you@email.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    autoFocus
                                />
                            </div>

                            <button
                                type="submit"
                                className="btn-primary"
                                style={{ width: '100%', opacity: loading ? 0.6 : 1 }}
                                disabled={loading}
                            >
                                {loading ? 'Sending…' : 'Send Reset Link'}
                            </button>
                        </form>

                        <p className={styles.backLink}>
                            <Link href="/login" className={styles.link}>← Back to Sign In</Link>
                        </p>
                    </>
                )}
            </div>
        </div>
    );
}
