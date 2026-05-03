'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import styles from './page.module.css';

const roles = [
    {
        id: 'talent',
        emoji: '👑',
        title: 'Talent',
        subtitle: 'Bottle Girls & Models',
        desc: 'Apply for castings, manage your schedule, and grow your career.',
        badge: 'Most Popular',
        badgeClass: 'badge-pink',
        demoEmail: 'talent@baddiecastings.com',
    },
    {
        id: 'agent',
        emoji: '🎯',
        title: 'Casting Agent / Brand',
        subtitle: 'Post & Manage Opportunities',
        desc: 'Post casting calls, manage applicants, and book top talent.',
        badge: 'Verified Only',
        badgeClass: 'badge-purple',
        demoEmail: 'agent@baddiecastings.com',
    },
    {
        id: 'creator',
        emoji: '📸',
        title: 'Creator',
        subtitle: 'Photographers & Videographers',
        desc: 'Build your profile, list your services, and get booked.',
        badge: 'Verified Only',
        badgeClass: 'badge-gold',
        demoEmail: 'creator@baddiecastings.com',
    },
    {
        id: 'agency',
        emoji: '🏢',
        title: 'Agency',
        subtitle: 'Executive Management',
        desc: 'Orchestrate talent, manage castings, and control ecosystem settings.',
        badge: 'MANAGEMENT',
        badgeClass: 'badge-purple',
        demoEmail: 'agency@baddiecastings.com',
    },
    {
        id: 'admin',
        emoji: '🛡️',
        title: 'Admin',
        subtitle: 'Platform Management',
        desc: 'Full platform control — users, payments, analytics.',
        badge: 'Restricted',
        badgeClass: 'badge-red',
        demoEmail: 'admin@baddiecastings.com',
    },
];

export default function LoginPage() {
    const [selected, setSelected] = useState(null);
    const [step, setStep] = useState('role'); // 'role' | 'credentials'
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const router = useRouter();

    const selectedRole = roles.find(r => r.id === selected);

    const handleContinue = () => {
        if (!selected) return;
        setEmail(selectedRole?.demoEmail || '');
        setStep('credentials');
        setError('');
    };

    const handleSignIn = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const { data, error: authError } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (authError) {
                setError(authError.message);
                setLoading(false);
                return;
            }

            // Read real role from profiles table
            const routes = { admin: '/admin', talent: '/dashboard', agent: '/opportunities', creator: '/creators', agency: '/agency' };
            const { data: profile } = await supabase
                .from('profiles')
                .select('role, status')
                .eq('id', data.user.id)
                .single();

            if (profile?.status === 'pending') {
                await supabase.auth.signOut();
                setError('Your account is pending approval. We\'ll email you once it\'s active.');
                setLoading(false);
                return;
            }
            if (profile?.status === 'suspended') {
                await supabase.auth.signOut();
                setError('Your account has been suspended. Contact support.');
                setLoading(false);
                return;
            }

            router.push(routes[profile?.role] || '/dashboard');
        } catch (err) {
            setError('An unexpected error occurred. Please try again.');
            setLoading(false);
        }
    };

    return (
        <div className={styles.page}>
            <div className={styles.bg} />

            <div className={styles.logo}>
                <Link href="/" style={{ textDecoration: 'none' }}>
                    <span className={styles.logoText}>Baddie Castings</span>
                </Link>
                <span className={styles.logoTag}>The Platform</span>
            </div>

            {step === 'role' ? (
                <div className={styles.panel}>
                    <h1 className={styles.title}>Who are you?</h1>
                    <p className={styles.subtitle}>Select your role to get started</p>
                    <div className={styles.roleGrid}>
                        {roles.map((r) => (
                            <button
                                key={r.id}
                                id={`role-${r.id}`}
                                className={`${styles.roleCard} ${selected === r.id ? styles.roleSelected : ''}`}
                                onClick={() => setSelected(r.id)}
                            >
                                <span className={styles.roleEmoji}>{r.emoji}</span>
                                <div className={styles.roleBody}>
                                    <div className={styles.roleTitleRow}>
                                        <p className={styles.roleTitle}>{r.title}</p>
                                        <span className={`badge ${r.badgeClass}`}>{r.badge}</span>
                                    </div>
                                    <p className={styles.roleSub}>{r.subtitle}</p>
                                    <p className={styles.roleDesc}>{r.desc}</p>
                                </div>
                                {selected === r.id && <span className={styles.checkmark}>✓</span>}
                            </button>
                        ))}
                    </div>
                    <button
                        className="btn-primary"
                        id="btn-continue-role"
                        onClick={handleContinue}
                        disabled={!selected}
                        style={{ width: '100%', marginTop: 8, opacity: selected ? 1 : 0.4 }}
                    >
                        Continue →
                    </button>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
                        <p className={styles.signupLink}>
                            New here? <a href="/apply" className={styles.link}>Apply →</a>
                        </p>
                        <a href="/forgot-password" className={styles.link} style={{ fontSize: '0.8rem' }}>
                            Forgot password?
                        </a>
                    </div>
                </div>
            ) : (
                <div className={styles.panel}>
                    <button className={styles.back} onClick={() => { setStep('role'); setError(''); }}>← Back</button>
                    <div className={styles.selectedRole}>
                        <span>{selectedRole?.emoji}</span>
                        <span>{selectedRole?.title}</span>
                    </div>
                    <h1 className={styles.title}>Sign In</h1>
                    <p className={styles.subtitle}>Welcome back to Baddie Castings</p>

                    {error && (
                        <div style={{
                            background: 'rgba(255,7,107,0.1)',
                            border: '1px solid rgba(255,7,107,0.3)',
                            borderRadius: 8,
                            padding: '10px 14px',
                            color: '#ff6b6b',
                            fontSize: 13,
                            marginBottom: 12,
                        }}>
                            ⚠️ {error}
                        </div>
                    )}

                    <form className={styles.form} onSubmit={handleSignIn}>
                        <div className={styles.field}>
                            <label className={styles.label}>Email</label>
                            <input
                                id="input-email"
                                type="email"
                                className="input"
                                placeholder="your@email.com"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                required
                            />
                        </div>
                        <div className={styles.field}>
                            <label className={styles.label}>Password</label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    id="input-password"
                                    type={showPassword ? 'text' : 'password'}
                                    className="input"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    required
                                    style={{ paddingRight: 44 }}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    style={{
                                        position: 'absolute',
                                        right: 12,
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        background: 'none',
                                        border: 'none',
                                        cursor: 'pointer',
                                        fontSize: 16,
                                        color: 'var(--text-muted)',
                                    }}
                                >
                                    {showPassword ? '🙈' : '👁️'}
                                </button>
                            </div>
                        </div>
                        <button
                            type="submit"
                            className="btn-primary"
                            id="btn-sign-in"
                            style={{ width: '100%', opacity: loading ? 0.6 : 1 }}
                            disabled={loading}
                        >
                            {loading ? 'Signing in...' : 'Sign In'}
                        </button>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <p className={styles.signupLink}>
                                New here? <a href="/apply" className={styles.link}>Apply →</a>
                            </p>
                            <a href="/forgot-password" className={styles.link} style={{ fontSize: '0.8rem' }}>
                                Forgot password?
                            </a>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}
