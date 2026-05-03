'use client';

import { useState, useEffect } from 'react';
import AppShell from '@/components/AppShell';
import Link from 'next/link';
import { Bell, ChevronRight, Clock, Zap, ShoppingBag, Camera, TrendingUp, UserCheck, Calendar, X, Sparkles, Info } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import styles from './dashboard.module.css';

const FALLBACK_COLORS = {
    saturday: { name: 'Pink Glaze', hex: '#FF007A' },
    sunday: { name: 'Sapphire Night', hex: '#0055FF' }
};

const quickActions = [
    { label: 'Pay Now',       icon: Zap,       href: '/shop',      className: 'btn-primary' },
    { label: 'View Schedule', icon: Clock,     href: '/schedule',  className: 'btn-secondary' },
    { label: 'Shop Add-Ons',  icon: ShoppingBag, href: '/shop',   className: 'btn-secondary' },
    { label: 'Book Creator',  icon: Camera,    href: '/creators',  className: 'btn-outline-pink' },
];

function AnnouncementModal({ announcement, onClose }) {
    return (
        <div className={styles.overlay} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
            <div className={styles.modal}>
                <button className={styles.modalClose} onClick={onClose}>
                    <X size={18} />
                </button>
                <div className={styles.modalHeader}>
                    <div className={styles.announcementIconLarge}>{announcement.icon}</div>
                    <h2 className={styles.modalTitle}>{announcement.title}</h2>
                    <p className={styles.modalSub}>{announcement.author} · {announcement.time}</p>
                </div>
                <div className={styles.modalContent}>
                    <p>{announcement.full_text || announcement.body}</p>
                    {announcement.pinned && (
                        <div className={styles.infoBox}>
                            <Info size={16} />
                            <span>Pinned by Admin</span>
                        </div>
                    )}
                </div>
                <button className="btn-primary" style={{ width: '100%', marginTop: 24 }} onClick={onClose}>
                    Got it!
                </button>
            </div>
        </div>
    );
}

export default function DashboardPage() {
    const [profile,             setProfile]             = useState(null);
    const [weekColors,          setWeekColors]          = useState(FALLBACK_COLORS);
    const [announcements,       setAnnouncements]       = useState([]);
    const [shifts,              setShifts]              = useState([]);
    const [hasPaidOnboarding,   setHasPaidOnboarding]   = useState(true);
    const [unpaidTransactions,  setUnpaidTransactions]  = useState([]);
    const [selectedAnnouncement,setSelectedAnnouncement]= useState(null);
    const [loading,             setLoading]             = useState(true);

    useEffect(() => {
        const load = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // Run all fetches in parallel
            const [
                profileRes,
                colorRes,
                announcementsRes,
                shiftsRes,
                transactionsRes,
            ] = await Promise.all([
                supabase.from('profiles').select('*').eq('id', user.id).single(),
                supabase.from('settings').select('value').eq('key', 'currentWeekendColors').single(),
                supabase.from('announcements').select('*').order('pinned', { ascending: false }).order('created_at', { ascending: false }).limit(5),
                supabase.from('shifts').select('*').eq('talent_id', user.id).order('created_at', { ascending: false }).limit(4),
                supabase.from('transactions').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
            ]);

            if (profileRes.data)      setProfile(profileRes.data);
            if (colorRes.data?.value) setWeekColors(colorRes.data.value);

            if (announcementsRes.data?.length) {
                setAnnouncements(announcementsRes.data.map(a => ({
                    ...a,
                    time: formatTime(a.created_at),
                })));
            }

            if (shiftsRes.data?.length) setShifts(shiftsRes.data);

            if (transactionsRes.data) {
                const txns = transactionsRes.data;
                const onboarding = txns.find(t => t.label?.toLowerCase().includes('onboarding'));
                setHasPaidOnboarding(onboarding ? onboarding.status === 'paid' : false);
                setUnpaidTransactions(txns.filter(t => t.status === 'pending' || t.status === 'overdue'));
            }

            setLoading(false);
        };

        load();
    }, []);

    const hour     = new Date().getHours();
    const greeting = hour < 12 ? 'Good Morning' : hour < 18 ? 'Good Afternoon' : 'Good Evening';
    const firstName = profile?.full_name?.split(' ')[0] || '';
    const initials  = getInitials(profile?.full_name);
    const statusBadge = profile?.status === 'active' ? 'Active' : profile?.status === 'pending' ? 'Pending Approval' : 'Active';

    return (
        <AppShell>
            {/* Hero */}
            <div className={styles.hero}>
                <div className={styles.heroBg} />
                <div className={styles.heroContent}>
                    <div className={styles.topRow}>
                        <div>
                            <p className={styles.greeting}>{greeting} {firstName ? `${firstName} 👋` : '👋'}</p>
                            <h1 className={styles.heroTitle}>Baddie Castings</h1>
                        </div>
                        <Link href="/notifications" className={styles.bellBtn}>
                            <Bell size={20} />
                            <span className={styles.bellDot} />
                        </Link>
                    </div>
                    <div className={styles.statusCard}>
                        <TrendingUp size={14} />
                        <span>{statusBadge} Talent</span>
                        {profile?.rating > 0 && (
                            <>
                                <span className={styles.separator}>·</span>
                                <span className="status-paid">★ {profile.rating}</span>
                            </>
                        )}
                    </div>
                </div>
            </div>

            <div className={styles.content}>
                {/* Onboarding pay-wall */}
                {!hasPaidOnboarding && (
                    <section className={styles.section} style={{ marginTop: -20, position: 'relative', zIndex: 10 }}>
                        <div className={styles.onboardingCard}>
                            <div className={styles.onboardingText}>
                                <div className={styles.onboardingIcon}>🛡️</div>
                                <div>
                                    <h2 className={styles.onboardingTitle}>Onboarding Required</h2>
                                    <p className={styles.onboardingSub}>Pay your onboarding fee to access full castings and schedule.</p>
                                </div>
                            </div>
                            <Link href="/shop" className="btn-gold" style={{ width: '100%', marginTop: 12 }}>
                                Pay Onboarding Fee ($180)
                            </Link>
                        </div>
                    </section>
                )}

                {/* Weekend Colors */}
                <section className={styles.section}>
                    <div className="section-header">
                        <span className="section-title">🎨 This Weekend&apos;s Colors</span>
                        <Link href="/schedule" className="section-link">Details <ChevronRight size={12} /></Link>
                    </div>
                    <div className="grid-2">
                        {Object.entries(weekColors).map(([day, color]) => (
                            <Link key={day} href="/schedule" className={styles.colorCard} style={{ '--color': color.hex }}>
                                <div className={styles.colorSwatch} style={{ background: color.hex }} />
                                <div>
                                    <p className={styles.colorDay}>{day.charAt(0).toUpperCase() + day.slice(1)}</p>
                                    <p className={styles.colorName}>{color.name}</p>
                                </div>
                            </Link>
                        ))}
                    </div>
                </section>

                {/* Unpaid transactions */}
                {unpaidTransactions.length > 0 && (
                    <section className={styles.section}>
                        <div className="section-header">
                            <span className="section-title">⏰ Payments Due</span>
                        </div>
                        <div className={styles.deadlineList}>
                            {unpaidTransactions.map((t) => (
                                <Link key={t.id} href="/shop" className={`${styles.deadlineItem} ${t.status === 'overdue' ? styles.urgent : ''}`}>
                                    <div>
                                        <p className={styles.deadlineLabel}>{t.label}</p>
                                        <p className={styles.deadlineTime}>{t.due_date ? `Due ${t.due_date}` : 'Due soon'}</p>
                                    </div>
                                    <span className={`badge ${t.status === 'overdue' ? 'badge-red' : 'badge-gold'}`}>
                                        ${Math.abs(t.amount)}
                                    </span>
                                </Link>
                            ))}
                        </div>
                    </section>
                )}

                {/* Quick Actions */}
                <section className={styles.section}>
                    <div className="section-header">
                        <span className="section-title">⚡ Quick Actions</span>
                    </div>
                    <div className={styles.quickGrid}>
                        {quickActions.map(({ label, icon: Icon, href, className }) => (
                            <Link key={label} href={href} className={className}>
                                <Icon size={15} />
                                {label}
                            </Link>
                        ))}
                    </div>
                </section>

                {/* This Weekend — from shifts table */}
                <section className={styles.section}>
                    <div className="section-header">
                        <span className="section-title">📅 This Weekend</span>
                        <Link href="/schedule" className="section-link">Full Schedule <ChevronRight size={12} /></Link>
                    </div>
                    {shifts.length > 0 ? (
                        <div className={styles.shiftList}>
                            {shifts.slice(0, 2).map((shift) => (
                                <Link key={shift.id} href="/schedule" className={`card ${styles.shiftCard}`}>
                                    <div className={styles.shiftDay}>
                                        <span className={styles.shiftDayLabel}>{shift.day}</span>
                                        <span className="badge badge-pink">{shift.start_time}{shift.end_time ? ` – ${shift.end_time}` : ''}</span>
                                    </div>
                                    <div className={styles.shiftVenue}>{shift.venue}</div>
                                    {shift.color && (
                                        <div className={styles.shiftColorRow}>
                                            <div className={styles.shiftColorDot} style={{ background: shift.color }} />
                                            <span>Color: {shift.color}</span>
                                        </div>
                                    )}
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <div className={styles.emptyState}>
                            <Calendar size={28} color="var(--text-muted)" />
                            <p>No shifts scheduled yet.<br />Check back after your application is approved.</p>
                        </div>
                    )}
                </section>

                {/* Announcements */}
                <section className={styles.section}>
                    <div className="section-header">
                        <span className="section-title"><Sparkles size={14} /> Announcements</span>
                    </div>
                    {announcements.length > 0 ? announcements.map((a) => (
                        <button
                            key={a.id}
                            className={styles.announcementCard}
                            onClick={() => setSelectedAnnouncement(a)}
                        >
                            <div className={styles.announcementIcon}>{a.icon || '📣'}</div>
                            <div style={{ textAlign: 'left' }}>
                                <p className={styles.announcementTitle}>{a.title}</p>
                                <p className={styles.announcementBody}>{a.body}</p>
                                <p className={styles.announcementTime}>{a.time} · {a.author}</p>
                            </div>
                        </button>
                    )) : (
                        <div className={styles.emptyState}>
                            <Sparkles size={24} color="var(--text-muted)" />
                            <p>No announcements yet.</p>
                        </div>
                    )}
                </section>
            </div>

            {selectedAnnouncement && (
                <AnnouncementModal
                    announcement={selectedAnnouncement}
                    onClose={() => setSelectedAnnouncement(null)}
                />
            )}
        </AppShell>
    );
}

function getInitials(name) {
    if (!name) return '?';
    return name.trim().split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

function formatTime(iso) {
    if (!iso) return '';
    const date = new Date(iso);
    const now  = new Date();
    const diff = Math.floor((now - date) / 1000);
    if (diff < 60)   return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return date.toLocaleDateString();
}
