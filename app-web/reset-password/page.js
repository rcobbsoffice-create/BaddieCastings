'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import styles from './page.module.css';

export default function ResetPasswordPage() {
    const router = useRouter();

    const [password,        setPassword]        = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword,    setShowPassword]    = useState(false);
    const [loading,         setLoading]         = useState(false);
    const [done,            setDone]            = useState(false);
    const [error,           setError]           = useState('');
    const [sessionReady,    setSessionReady]    = useState(false);

    // Supabase sends the token in the URL hash — the SDK picks it up automatically
    // via onAuthStateChange with event = 'PASSWORD_RECOVERY'
    useEffect(() => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
            if (event === 'PASSWORD_RECOVERY') {
                setSessionReady(true);
            }
        });
        return () => subscription.unsubscribe();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (password.length < 6) {
            setError('Password must be at least 6 characters.');
            return;
        }
        if (password !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }

        setLoading(true);
        const { error: updateError } = await supabase.auth.updateUser({ password });
        setLoading(false);

        if (updateError) {
            setError(updateError.message);
            return;
        }

        setDone(true);
        setTimeout(() => router.push('/login'), 2500);
    };

    // Waiting for Supabase to parse the hash token
    if (!sessionReady) {
        return (
            <div className={styles.page}>
                <div className={styles.bg} />
                <div className={styles.panel}>
                    <div className={styles.waitIcon}>🔐</div>
                    <h1 className={styles.title}>Verifying link…</h1>
                    <p className={styles.subtitle}>
                        Hang tight while we verify your reset link. This takes just a second.
                    </p>
                    <p className={styles.helpText}>
                        If nothing happens, your link may have expired.{' '}
                        <Link href="/forgot-password" className={styles.link}>Request a new one →</Link>
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.page}>
            <div className={styles.bg} />

            <div className={styles.logo}>
                <span className={styles.logoText}>Baddie Castings</span>
                <span className={styles.logoTag}>Set New Password</span>
            </div>

            <div className={styles.panel}>
                {done ? (
                    /* ── Success ── */
                    <>
                        <div className={styles.successIcon}>✓</div>
                        <h1 className={styles.title}>Password Updated!</h1>
                        <p className={styles.subtitle}>
                            Your password has been changed. Redirecting you to Sign In…
                        </p>
                        <div className={styles.redirectBar}>
                            <div className={styles.redirectFill} />
                        </div>
                    </>
                ) : (
                    /* ── Form ── */
                    <>
                        <h1 className={styles.title}>Set New Password</h1>
                        <p className={styles.subtitle}>Choose a strong password for your account.</p>

                        {error && <div className={styles.errorBox}>⚠️ {error}</div>}

                        <form className={styles.form} onSubmit={handleSubmit}>
                            <div className={styles.field}>
                                <label className={styles.label}>New Password</label>
                                <div className={styles.passwordWrap}>
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        className="input"
                                        placeholder="Min. 6 characters"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        autoFocus
                                        style={{ paddingRight: 44 }}
                                    />
                                    <button
                                        type="button"
                                        className={styles.eyeBtn}
                                        onClick={() => setShowPassword(!showPassword)}
                                    >
                                        {showPassword ? '🙈' : '👁️'}
                                    </button>
                                </div>
                                <PasswordStrength password={password} />
                            </div>

                            <div className={styles.field}>
                                <label className={styles.label}>Confirm Password</label>
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    className="input"
                                    placeholder="••••••••"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                />
                                {confirmPassword && password !== confirmPassword && (
                                    <p className={styles.mismatch}>Passwords don&apos;t match</p>
                                )}
                            </div>

                            <button
                                type="submit"
                                className="btn-primary"
                                style={{ width: '100%', opacity: loading ? 0.6 : 1 }}
                                disabled={loading}
                            >
                                {loading ? 'Updating…' : 'Update Password'}
                            </button>
                        </form>
                    </>
                )}
            </div>
        </div>
    );
}

function PasswordStrength({ password }) {
    if (!password) return null;

    const checks = [
        password.length >= 6,
        /[A-Z]/.test(password),
        /[0-9]/.test(password),
        /[^A-Za-z0-9]/.test(password),
    ];
    const score = checks.filter(Boolean).length;
    const labels = ['Weak', 'Fair', 'Good', 'Strong'];
    const colors = ['#ff3c3c', '#ff9500', '#ffd700', '#00ff88'];

    return (
        <div className={styles.strengthWrap}>
            <div className={styles.strengthBars}>
                {[0, 1, 2, 3].map((i) => (
                    <div
                        key={i}
                        className={styles.strengthBar}
                        style={{ background: i < score ? colors[score - 1] : 'var(--border)' }}
                    />
                ))}
            </div>
            <span className={styles.strengthLabel} style={{ color: colors[score - 1] }}>
                {labels[score - 1]}
            </span>
        </div>
    );
}
