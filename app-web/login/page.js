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
        subtitle: 'Models & Performers',
        desc: 'Apply for castings, manage your schedule, and grow your career.',
        badge: 'Most Popular',
        badgeClass: 'badge-pink',
        demoEmail: 'talent@baddiecastings.com',
    },
    {
        id: 'service_industry',
        emoji: '🎪',
        title: 'Service Industry',
        subtitle: 'Bottle Girls, Bartenders & More',
        desc: 'Work events, venues, and clubs across the city.',
        badge: 'Nightlife',
        badgeClass: 'badge-gold',
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

const SERVICE_INDUSTRY_ROLES = [
    {
        id: 'bottle_girl',
        emoji: '🍾',
        title: 'Bottle Girl',
        subtitle: 'Nightclub & Event Service',
        desc: 'Work bottle service at top venues, clubs, and private events.',
        badge: 'Service',
        badgeClass: 'badge-pink',
        demoEmail: 'bottlegirl@baddiecastings.com',
    },
    {
        id: 'bartender',
        emoji: '🍸',
        title: 'Bartender',
        subtitle: 'Bar & Event Service',
        desc: 'Craft cocktails and work bar service at premier venues and events.',
        badge: 'Service',
        badgeClass: 'badge-gold',
        demoEmail: 'bartender@baddiecastings.com',
    },
    {
        id: 'hookah_girl',
        emoji: '💨',
        title: 'Hookah Girl',
        subtitle: 'Hookah & Lounge Service',
        desc: 'Provide hookah service at lounges, clubs, and private events.',
        badge: 'Service',
        badgeClass: 'badge-purple',
        demoEmail: 'hookah@baddiecastings.com',
    },
    {
        id: 'dj',
        emoji: '🎧',
        title: 'DJ',
        subtitle: 'Music & Entertainment',
        desc: 'Perform at clubs, private bookings, and events across the city.',
        badge: 'No Fee',
        badgeClass: 'badge-gold',
        demoEmail: 'dj@baddiecastings.com',
    },
];

export default function LoginPage() {
    const [selected, setSelected] = useState(null);
    const [serviceSelected, setServiceSelected] = useState(null);
    const [step, setStep] = useState('role'); // 'role' | 'service_industry' | 'credentials'
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const router = useRouter();

    const selectedRole = roles.find(r => r.id === selected);
    const selectedServiceRole = SERVICE_INDUSTRY_ROLES.find(r => r.id === serviceSelected);
    const activeRole = step === 'credentials' && serviceSelected ? selectedServiceRole : selectedRole;

    const handleContinue = () => {
        if (!selected) return;
        if (selected === 'service_industry') {
            setStep('service_industry');
            setError('');
            return;
        }
        setEmail(selectedRole?.demoEmail || '');
        setStep('credentials');
        setError('');
    };

    const handleServiceContinue = () => {
        if (!serviceSelected) return;
        setEmail(selectedServiceRole?.demoEmail || '');
        setStep('credentials');
        setError('');
    };

    const handleBackFromCredentials = () => {
        setError('');
        if (serviceSelected) {
            setStep('service_industry');
        } else {
            setStep('role');
        }
    };

    const handleGoogleLogin = async () => {
        await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: { redirectTo: `${window.location.origin}/dashboard` },
        });
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

            const routes = {
                admin: '/admin',
                talent: '/dashboard',
                agent: '/opportunities',
                creator: '/creators',
                agency: '/agency',
                bottle_girl: '/dashboard',
                bartender: '/dashboard',
                hookah_girl: '/dashboard',
                dj: '/dashboard',
            };

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

            {/* ── Step: Role ── */}
            {step === 'role' && (
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
            )}

            {/* ── Step: Service Industry Sub-roles ── */}
            {step === 'service_industry' && (
                <div className={styles.panel}>
                    <button className={styles.back} onClick={() => { setStep('role'); setServiceSelected(null); setError(''); }}>← Back</button>
                    <div className={styles.selectedRole}>
                        <span>🎪</span>
                        <span>Service Industry</span>
                    </div>
                    <h1 className={styles.title}>What's your role?</h1>
                    <p className={styles.subtitle}>Choose your specific position to sign in</p>
                    <div className={styles.roleGrid}>
                        {SERVICE_INDUSTRY_ROLES.map((r) => (
                            <button
                                key={r.id}
                                id={`role-${r.id}`}
                                className={`${styles.roleCard} ${serviceSelected === r.id ? styles.roleSelected : ''}`}
                                onClick={() => setServiceSelected(r.id)}
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
                                {serviceSelected === r.id && <span className={styles.checkmark}>✓</span>}
                            </button>
                        ))}
                    </div>
                    <button
                        className="btn-primary"
                        onClick={handleServiceContinue}
                        disabled={!serviceSelected}
                        style={{ width: '100%', marginTop: 8, opacity: serviceSelected ? 1 : 0.4 }}
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
            )}

            {/* ── Step: Credentials ── */}
            {step === 'credentials' && (
                <div className={styles.panel}>
                    <button className={styles.back} onClick={handleBackFromCredentials}>← Back</button>
                    <div className={styles.selectedRole}>
                        <span>{activeRole?.emoji}</span>
                        <span>{activeRole?.title}</span>
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

                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '16px 0 8px' }}>
                            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
                            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>or continue with</span>
                            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
                        </div>
                        <button type="button" className="btn-secondary" onClick={handleGoogleLogin} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                            <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                            Google
                        </button>
                    </form>
                </div>
            )}
        </div>
    );
}
