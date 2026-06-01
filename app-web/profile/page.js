'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AppShell from '@/components/AppShell';
import { Link2, MapPin, Star, CreditCard, Calendar, Edit3, ChevronRight, Shield, BadgeCheck, Bell, Lock, HelpCircle, LogOut, Settings } from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import PortfolioGallery from '@/components/PortfolioGallery';
import styles from './page.module.css';

const STATUS_BADGE = {
    active:    'badge-green',
    pending:   'badge-gold',
    suspended: 'badge-red',
    rejected:  'badge-red',
};

const EXPERIENCE_LABEL = {
    talent:  'Talent',
    creator: 'Creator',
    agent:   'Casting Agent',
    agency:  'Agency',
    admin:   'Admin',
};

const settingsMenu = [
    { label: 'Verification Center', icon: BadgeCheck, href: '/verification', color: 'var(--accent-pink)' },
    { label: 'Account Settings',    icon: Settings,   href: '/settings/account',       color: 'var(--text-secondary)' },
    { label: 'Notifications',       icon: Bell,        href: '/settings/notifications', color: 'var(--text-secondary)' },
    { label: 'Privacy & Security',  icon: Lock,        href: '/settings/privacy',       color: 'var(--text-secondary)' },
    { label: 'Help & Support',      icon: HelpCircle,  href: '/settings/help',          color: 'var(--text-secondary)' },
];

export default function ProfilePage() {
    const router = useRouter();
    const [profile,     setProfile]     = useState(null);
    const [transactions,setTransactions]= useState([]);
    const [shifts,      setShifts]      = useState([]);
    const [signingOut,  setSigningOut]  = useState(false);
    const [loading,     setLoading]     = useState(true);

    useEffect(() => {
        const load = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const [profileRes, txRes, shiftsRes] = await Promise.all([
                supabase.from('profiles').select('*').eq('id', user.id).single(),
                supabase.from('transactions').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(10),
                supabase.from('shifts').select('id, confirmed').eq('talent_id', user.id),
            ]);

            if (profileRes.data) setProfile(profileRes.data);
            if (txRes.data)      setTransactions(txRes.data);
            if (shiftsRes.data)  setShifts(shiftsRes.data);

            setLoading(false);
        };

        load();
    }, []);

    const handleSignOut = async () => {
        setSigningOut(true);
        await supabase.auth.signOut();
        router.push('/login');
    };

    const initials     = getInitials(profile?.full_name);
    const totalShifts  = shifts.length;
    const attended     = shifts.filter(s => s.confirmed).length;
    const attendancePct = totalShifts > 0 ? Math.round((attended / totalShifts) * 100) : null;
    const joinedDate   = profile?.created_at
        ? new Date(profile.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
        : '—';

    return (
        <AppShell>
            <div className={styles.profileHero}>
                <div className={styles.heroBg} />
                <div className={styles.heroContent}>
                    <div className={styles.avatarWrap}>
                        <div className={styles.avatar}>{loading ? '…' : initials}</div>
                        <div className={styles.avatarGlow} />
                    </div>
                    <div className={styles.nameBlock}>
                        <h1 className={styles.name}>{profile?.full_name || '—'}</h1>
                        {profile?.instagram && (
                            <p className={styles.instagram}><Link2 size={12} /> {profile.instagram}</p>
                        )}
                        {profile?.city && (
                            <p className={styles.city}><MapPin size={12} /> {profile.city}</p>
                        )}
                    </div>
                    <span className={`badge ${STATUS_BADGE[profile?.status] || 'badge-purple'}`}>
                        {profile?.status ? profile.status.charAt(0).toUpperCase() + profile.status.slice(1) : '—'}
                    </span>
                </div>
                <button className={styles.editBtn} id="btn-edit-profile"><Edit3 size={16} /></button>
            </div>

            <div className={styles.content}>
                {/* Stats */}
                <div className={styles.statsRow}>
                    <div className={styles.stat}>
                        <p className={styles.statNum}>{profile?.shifts_worked ?? totalShifts}</p>
                        <p className={styles.statLabel}>Shifts</p>
                    </div>
                    <div className={styles.statDivider} />
                    <div className={styles.stat}>
                        <p className={styles.statNum}>
                            {profile?.rating > 0
                                ? <><Star size={13} fill="var(--accent-gold)" color="var(--accent-gold)" /> {profile.rating}</>
                                : '—'}
                        </p>
                        <p className={styles.statLabel}>Rating</p>
                    </div>
                    <div className={styles.statDivider} />
                    <div className={styles.stat}>
                        <p className={styles.statNum}>{joinedDate}</p>
                        <p className={styles.statLabel}>Member Since</p>
                    </div>
                </div>

                {/* Role badge */}
                {profile?.role && (
                    <section className={styles.section}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)' }}>
                            <Shield size={16} color="var(--accent-pink)" />
                            <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>
                                {EXPERIENCE_LABEL[profile.role] || profile.role}
                            </span>
                            {profile.specialty && (
                                <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>· {profile.specialty}</span>
                            )}
                        </div>
                    </section>
                )}

                {/* Attendance — shown only if shifts exist */}
                {totalShifts > 0 && (
                    <section className={styles.section}>
                        <div className="section-header">
                            <span className="section-title"><Calendar size={14} /> Attendance</span>
                        </div>
                        <div className={styles.attendanceGrid}>
                            {shifts.map((s, i) => (
                                <div key={s.id} className={`${styles.dot} ${s.confirmed ? styles.attended : styles.missed}`} />
                            ))}
                        </div>
                        {attendancePct !== null && (
                            <p className={styles.attendanceNote}>
                                {attended} / {totalShifts} shifts attended · {attendancePct}% attendance rate
                            </p>
                        )}
                    </section>
                )}

                {/* Payment History */}
                <section className={styles.section}>
                    <div className="section-header">
                        <span className="section-title"><CreditCard size={14} /> Payment History</span>
                    </div>
                    {transactions.length > 0 ? (
                        <div className={styles.paymentList}>
                            {transactions.map((t) => (
                                <div key={t.id} className={styles.paymentRow}>
                                    <div>
                                        <p className={styles.payLabel}>{t.label}</p>
                                        <p className={styles.payDate}>
                                            {t.paid_at
                                                ? new Date(t.paid_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                                                : t.due_date || '—'}
                                        </p>
                                    </div>
                                    <div className={styles.payRight}>
                                        <p className={styles.payAmount}>${Math.abs(t.amount)}</p>
                                        <span className={`badge ${t.status === 'paid' ? 'badge-green' : t.status === 'overdue' ? 'badge-red' : 'badge-gold'}`}>
                                            {t.status.charAt(0).toUpperCase() + t.status.slice(1)}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', padding: '12px 0' }}>
                            No payment history yet.
                        </p>
                    )}
                </section>

                {/* Portfolio Media */}
                {profile?.role === 'talent' && (
                    <section className={styles.section}>
                        <div className="section-header">
                            <span className="section-title">✨ Media Portfolio</span>
                            <span className="section-link">Max 20 of each</span>
                        </div>
                        <PortfolioGallery profileId={profile.id} editable={true} isTalent={true} />
                    </section>
                )}

                {/* Settings Menu */}
                <section className={styles.section}>
                    <div className={styles.settingsList}>
                        {settingsMenu.map(({ label, icon: Icon, href, color }) => (
                            <Link key={label} href={href} className={styles.settingRow} id={`btn-setting-${label.replace(/\s+/g, '-').toLowerCase()}`}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                                    <div className={styles.settingIcon}><Icon size={17} color={color} /></div>
                                    <span>{label}</span>
                                </div>
                                <ChevronRight size={16} color="var(--text-muted)" />
                            </Link>
                        ))}
                        <button
                            id="btn-sign-out"
                            className={`${styles.settingRow} ${styles.signOut}`}
                            onClick={handleSignOut}
                            disabled={signingOut}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                                <div className={styles.settingIcon}><LogOut size={17} color="#ff3c3c" /></div>
                                <span>{signingOut ? 'Signing out…' : 'Sign Out'}</span>
                            </div>
                            <ChevronRight size={16} color="var(--text-muted)" />
                        </button>
                    </div>
                </section>
            </div>
        </AppShell>
    );
}

function getInitials(name) {
    if (!name) return '?';
    return name.trim().split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}
