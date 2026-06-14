'use client';

import { useState, useEffect } from 'react';
import AppShell from '@/components/AppShell';
import Link from 'next/link';
import {
    Bell, ChevronRight, Clock, Zap, ShoppingBag, Camera, TrendingUp,
    Calendar, X, Sparkles, Info, CheckCircle2, AlertCircle, DollarSign,
    Users, Star, Briefcase, ImageIcon, Send, Shield,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import styles from './dashboard.module.css';

const SERVICE_ROLES  = ['bottle_girl', 'bartender', 'hookah_girl', 'dj'];
const TALENT_ROLES   = ['talent', ...SERVICE_ROLES];
const MGMT_ROLES     = ['agency', 'admin'];
const FEE_MAP        = { bottle_girl: 180, bartender: 120, hookah_girl: 120, dj: 0 };
const ROLE_LABEL     = {
    talent: 'Talent', bottle_girl: 'Bottle Girl', bartender: 'Bartender',
    hookah_girl: 'Hookah Girl', dj: 'DJ', creator: 'Creator',
    agent: 'Casting Agent', agency: 'Agency', admin: 'Admin',
};
const ROLE_EMOJI = {
    talent: '👑', bottle_girl: '🍾', bartender: '🍸',
    hookah_girl: '💨', dj: '🎧', creator: '📸',
    agent: '🎯', agency: '🏢', admin: '⚙️',
};
const FALLBACK_COLORS = {
    saturday: { name: 'Pink Glaze', hex: '#FF007A' },
    sunday:   { name: 'Sapphire Night', hex: '#9B59FF' },
};

function formatTime(iso) {
    if (!iso) return '';
    const diff = Math.floor((Date.now() - new Date(iso)) / 1000);
    if (diff < 60)    return 'Just now';
    if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return new Date(iso).toLocaleDateString();
}

// ── Shared: Announcement Modal ───────────────────────────────────────────────

function AnnouncementModal({ a, onClose }) {
    return (
        <div className={styles.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
            <div className={styles.modal}>
                <button className={styles.modalClose} onClick={onClose}><X size={18} /></button>
                <div className={styles.modalHeader}>
                    <div className={styles.announcementIconLarge}>{a.icon || '📣'}</div>
                    <h2 className={styles.modalTitle}>{a.title}</h2>
                    <p className={styles.modalSub}>{a.author} · {formatTime(a.created_at)}</p>
                </div>
                <div className={styles.modalContent}><p>{a.full_text || a.body}</p>
                    {a.pinned && <div className={styles.infoBox}><Info size={16} /><span>Pinned by Admin</span></div>}
                </div>
                <button className="btn-primary" style={{ width: '100%', marginTop: 24 }} onClick={onClose}>Got it!</button>
            </div>
        </div>
    );
}

// ── Shared: Hero ─────────────────────────────────────────────────────────────

function DashboardHero({ profile }) {
    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Good Morning' : hour < 18 ? 'Good Afternoon' : 'Good Evening';
    const firstName = profile.full_name?.split(' ')[0] || '';
    const role = profile.role;

    return (
        <div className={styles.hero}>
            <div className={styles.heroBg} />
            <div className={styles.heroContent}>
                <div className={styles.topRow}>
                    <div>
                        <p className={styles.greeting}>{greeting}{firstName ? `, ${firstName}` : ''} 👋</p>
                        <h1 className={styles.heroTitle}>Baddie Castings</h1>
                    </div>
                    <Link href="/notifications" className={styles.bellBtn}>
                        <Bell size={20} />
                        <span className={styles.bellDot} />
                    </Link>
                </div>
                <div className={styles.rolePill}>
                    <span>{ROLE_EMOJI[role]}</span>
                    <span>{ROLE_LABEL[role] || role}</span>
                    <span className={`badge ${profile.status === 'active' ? 'badge-green' : 'badge-gold'}`}>
                        {profile.status === 'active' ? 'Active' : 'Pending'}
                    </span>
                </div>
            </div>
        </div>
    );
}

// ── Shared: Announcements ────────────────────────────────────────────────────

function AnnouncementsSection({ announcements, onSelect }) {
    if (!announcements.length) return null;
    return (
        <section className={styles.section}>
            <div className="section-header">
                <span className="section-title"><Sparkles size={14} /> Announcements</span>
            </div>
            <div className={styles.announcementList}>
                {announcements.map(a => (
                    <button key={a.id} className={styles.announcementCard} onClick={() => onSelect(a)}>
                        <div className={styles.announcementIcon}>{a.icon || '📣'}</div>
                        <div style={{ textAlign: 'left', flex: 1 }}>
                            <p className={styles.announcementTitle}>{a.title}</p>
                            <p className={styles.announcementBody}>{a.body}</p>
                            <p className={styles.announcementTime}>{formatTime(a.created_at)} · {a.author}</p>
                        </div>
                        {a.pinned && <span className={styles.pinBadge}>📌</span>}
                    </button>
                ))}
            </div>
        </section>
    );
}

// ── Payout Request ───────────────────────────────────────────────────────────

function PayoutSection({ profile }) {
    const [open, setOpen] = useState(false);
    const [form, setForm] = useState({ amount: '', method: 'cashapp', handle: '' });
    const [status, setStatus] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.amount || !form.handle) return;
        setStatus('sending');
        const { error } = await supabase.from('transactions').insert({
            user_id: profile.id,
            label: `Payout Request — ${form.method === 'cashapp' ? 'Cash App' : form.method === 'zelle' ? 'Zelle' : 'PayPal'} ${form.handle}`,
            amount: parseFloat(form.amount),
            type: 'payout',
            status: 'pending',
        });
        if (error) { setStatus('error'); }
        else { setStatus('ok'); setTimeout(() => { setOpen(false); setStatus(null); setForm({ amount: '', method: 'cashapp', handle: '' }); }, 2500); }
    };

    return (
        <section className={styles.section}>
            <div className="section-header"><span className="section-title">💸 Earnings</span></div>
            <div className={`card ${styles.feeCard}`} style={{ background: 'rgba(0,255,136,0.05)', border: '1px solid rgba(0,255,136,0.2)' }}>
                <DollarSign size={22} color="#00ff88" />
                <div style={{ flex: 1 }}>
                    <p className={styles.feeTitle}>${Number(profile.total_earned).toFixed(0)} Total Earned</p>
                    <p className={styles.feeSub}>Request a payout to your Cash App, Zelle, or PayPal.</p>
                </div>
                <button className="btn-primary" style={{ padding: '10px 18px', fontSize: '0.82rem', flexShrink: 0 }} onClick={() => setOpen(true)}>
                    Request Payout
                </button>
            </div>

            {open && (
                <div className={styles.overlay} onClick={e => e.target === e.currentTarget && setOpen(false)}>
                    <div className={styles.modal}>
                        <button className={styles.modalClose} onClick={() => setOpen(false)}><X size={18} /></button>
                        {status === 'ok' ? (
                            <div style={{ textAlign: 'center', padding: '20px 0' }}>
                                <div className={styles.successIcon} style={{ margin: '0 auto 16px' }}>✓</div>
                                <h2 className={styles.modalTitle}>Request Submitted!</h2>
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Admin will process your payout within 1–2 business days.</p>
                            </div>
                        ) : (
                            <>
                                <h2 className={styles.modalTitle}>Request Payout</h2>
                                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 16 }}>
                                    <div>
                                        <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Amount ($)</label>
                                        <input className="input" type="number" min="1" max={profile.total_earned} placeholder="0.00" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} required />
                                    </div>
                                    <div>
                                        <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Payment Method</label>
                                        <select className="input" value={form.method} onChange={e => setForm(f => ({ ...f, method: e.target.value }))}>
                                            <option value="cashapp">Cash App</option>
                                            <option value="zelle">Zelle</option>
                                            <option value="paypal">PayPal</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>
                                            {form.method === 'cashapp' ? 'Cash App $Tag' : form.method === 'zelle' ? 'Zelle Phone/Email' : 'PayPal Email'}
                                        </label>
                                        <input className="input" placeholder={form.method === 'cashapp' ? '$YourCashTag' : form.method === 'zelle' ? 'phone or email' : 'your@paypal.com'} value={form.handle} onChange={e => setForm(f => ({ ...f, handle: e.target.value }))} required />
                                    </div>
                                    <button type="submit" className="btn-primary" style={{ width: '100%' }} disabled={status === 'sending'}>
                                        {status === 'sending' ? 'Submitting…' : <><Send size={14} /> Submit Request</>}
                                    </button>
                                </form>
                            </>
                        )}
                    </div>
                </div>
            )}
        </section>
    );
}

// ── Talent / Service Industry View ───────────────────────────────────────────

function TalentView({ profile, shifts, weekColors, announcements, onSelectAnnouncement }) {
    const role = profile.role;
    const isService = SERVICE_ROLES.includes(role);
    const fee = FEE_MAP[role] ?? 0;
    const hasFee = isService && fee > 0;

    const [onboardingTxn, setOnboardingTxn]   = useState(null);
    const [cashHandle,    setCashHandle]       = useState('$BaddieCastings');
    const [submitting,    setSubmitting]       = useState(false);
    const [submitted,     setSubmitted]        = useState(false);

    useEffect(() => {
        if (!hasFee) return;
        Promise.all([
            supabase.from('transactions')
                .select('*')
                .eq('user_id', profile.id)
                .ilike('label', '%onboarding%')
                .order('created_at', { ascending: false })
                .limit(1),
            supabase.from('settings').select('value').eq('key', 'cashapp_handle').single(),
        ]).then(([txnRes, settingRes]) => {
            if (txnRes.data?.[0]) setOnboardingTxn(txnRes.data[0]);
            if (settingRes.data?.value) setCashHandle(JSON.parse(settingRes.data.value));
        });
    }, [profile.id, hasFee]);

    const handleSubmitPayment = async () => {
        setSubmitting(true);
        const { data, error } = await supabase.from('transactions').insert({
            user_id: profile.id,
            label:   `Onboarding Fee — ${ROLE_LABEL[role]}`,
            amount:  -fee,
            type:    'charge',
            status:  'pending',
        }).select().single();
        if (!error && data) {
            setOnboardingTxn(data);
            setSubmitted(true);
        }
        setSubmitting(false);
    };

    const feeStatus = !onboardingTxn ? 'unpaid'
        : onboardingTxn.status === 'paid' ? 'paid'
        : 'pending';

    return (
        <>
            {/* Stats */}
            <div className={styles.content}>
                <div className={styles.statsRow}>
                    <div className={styles.statBox}>
                        <p className={styles.statNum}>{profile.shifts_worked ?? 0}</p>
                        <p className={styles.statLbl}>Shifts</p>
                    </div>
                    <div className={styles.statDivider} />
                    <div className={styles.statBox}>
                        <p className={styles.statNum}>{profile.rating > 0 ? `★ ${profile.rating}` : '—'}</p>
                        <p className={styles.statLbl}>Rating</p>
                    </div>
                    <div className={styles.statDivider} />
                    <div className={styles.statBox}>
                        <p className={styles.statNum}>${Number(profile.total_earned ?? 0).toFixed(0)}</p>
                        <p className={styles.statLbl}>Earned</p>
                    </div>
                </div>

                {/* ID Verification nudge */}
                {!profile.id_verified && (
                    <section className={styles.section}>
                        <div className={`${styles.nudgeCard} ${styles.nudgeId}`}>
                            <Shield size={18} color="var(--accent-purple)" />
                            <div className={styles.nudgeBody}>
                                <p className={styles.nudgeTitle}>ID Verification Pending</p>
                                <p className={styles.nudgeSub}>Our team is reviewing your ID. Full access unlocks once verified.</p>
                            </div>
                        </div>
                    </section>
                )}

                {/* Onboarding fee — service industry only */}
                {hasFee && (
                    <section className={styles.section}>
                        <div className="section-header">
                            <span className="section-title">💳 Onboarding Fee</span>
                        </div>

                        {feeStatus === 'paid' && (
                            <div className={`${styles.feeCard} ${styles.feeCardPaid}`}>
                                <CheckCircle2 size={22} color="#00ff88" />
                                <div>
                                    <p className={styles.feeTitle}>Fee Paid</p>
                                    <p className={styles.feeSub}>Your onboarding fee has been verified. Welcome aboard!</p>
                                </div>
                            </div>
                        )}

                        {feeStatus === 'pending' && (
                            <div className={`${styles.feeCard} ${styles.feeCardPending}`}>
                                <Clock size={22} color="var(--accent-gold)" />
                                <div>
                                    <p className={styles.feeTitle}>Payment Submitted</p>
                                    <p className={styles.feeSub}>Awaiting admin verification — usually within 24 hours.</p>
                                </div>
                            </div>
                        )}

                        {feeStatus === 'unpaid' && (
                            <div className={`${styles.feeCard} ${styles.feeCardUnpaid}`}>
                                <DollarSign size={22} color="var(--accent-pink)" />
                                <div className={styles.feeUnpaidBody}>
                                    <div className={styles.feeRow}>
                                        <p className={styles.feeTitle}>Onboarding Fee Required</p>
                                        <span className={styles.feeAmount}>${fee}</span>
                                    </div>
                                    <p className={styles.feeSub}>Send via Cash App to unlock full access.</p>
                                    <div className={styles.cashTag}>
                                        <span className={styles.cashTagLabel}>Cash App</span>
                                        <span className={styles.cashTagHandle}>{cashHandle}</span>
                                    </div>
                                    <button
                                        className="btn-primary"
                                        style={{ width: '100%', marginTop: 12 }}
                                        onClick={handleSubmitPayment}
                                        disabled={submitting}
                                    >
                                        {submitting ? 'Submitting…' : <><Send size={14} /> I&apos;ve Sent Payment</>}
                                    </button>
                                </div>
                            </div>
                        )}
                    </section>
                )}

                {/* Weekend Colors — service industry */}
                {isService && (
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
                )}

                {/* Castings / Opportunities — non-service talent */}
                {!isService && (
                    <section className={styles.section}>
                        <div className="section-header">
                            <span className="section-title">✨ Open Castings</span>
                            <Link href="/opportunities" className="section-link">View All <ChevronRight size={12} /></Link>
                        </div>
                        <Link href="/opportunities" className={styles.ctaBanner}>
                            <div>
                                <p className={styles.ctaTitle}>Browse Casting Calls</p>
                                <p className={styles.ctaSub}>New opportunities updated weekly</p>
                            </div>
                            <ChevronRight size={20} color="var(--accent-pink)" />
                        </Link>
                    </section>
                )}

                {/* Upcoming Shifts */}
                <section className={styles.section}>
                    <div className="section-header">
                        <span className="section-title">📅 Upcoming Shifts</span>
                        <Link href="/schedule" className="section-link">Full Schedule <ChevronRight size={12} /></Link>
                    </div>
                    {shifts.length > 0 ? (
                        <div className={styles.shiftList}>
                            {shifts.slice(0, 2).map(s => (
                                <Link key={s.id} href="/schedule" className={`card ${styles.shiftCard}`}>
                                    <div className={styles.shiftDay}>
                                        <span className={styles.shiftDayLabel}>{s.day}</span>
                                        <span className="badge badge-pink">{s.start_time}{s.end_time ? ` – ${s.end_time}` : ''}</span>
                                    </div>
                                    <div className={styles.shiftVenue}>{s.venue}</div>
                                    {s.color && (
                                        <div className={styles.shiftColorRow}>
                                            <div className={styles.shiftColorDot} style={{ background: s.color }} />
                                            <span>Color: {s.color}</span>
                                        </div>
                                    )}
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <div className={styles.emptyState}>
                            <Calendar size={28} color="var(--text-muted)" />
                            <p>No shifts yet. Check back after approval.</p>
                        </div>
                    )}
                </section>

                {/* Payout Request */}
                {profile.total_earned > 0 && (
                    <PayoutSection profile={profile} />
                )}

                {/* Quick Actions */}
                <section className={styles.section}>
                    <div className="section-header"><span className="section-title">⚡ Quick Actions</span></div>
                    <div className={styles.quickGrid}>
                        {isService ? (
                            <>
                                <Link href="/schedule"     className="btn-secondary"><Clock size={14} /> Schedule</Link>
                                <Link href="/shop"         className="btn-secondary"><ShoppingBag size={14} /> Shop</Link>
                                <Link href="/profile"      className="btn-outline-pink"><Camera size={14} /> My Profile</Link>
                                <Link href="/opportunities" className="btn-outline-pink"><Zap size={14} /> Castings</Link>
                            </>
                        ) : (
                            <>
                                <Link href="/opportunities" className="btn-primary"><Zap size={14} /> Browse Castings</Link>
                                <Link href="/schedule"      className="btn-secondary"><Clock size={14} /> Schedule</Link>
                                <Link href="/creators"      className="btn-secondary"><Camera size={14} /> Book Creator</Link>
                                <Link href="/shop"          className="btn-outline-pink"><ShoppingBag size={14} /> Shop</Link>
                            </>
                        )}
                    </div>
                </section>

                <AnnouncementsSection announcements={announcements} onSelect={onSelectAnnouncement} />
            </div>
        </>
    );
}

// ── Creator View ─────────────────────────────────────────────────────────────

function CreatorView({ profile, announcements, onSelectAnnouncement }) {
    return (
        <div className={styles.content}>
            <div className={styles.statsRow}>
                <div className={styles.statBox}>
                    <p className={styles.statNum}>{profile.shifts_worked ?? 0}</p>
                    <p className={styles.statLbl}>Bookings</p>
                </div>
                <div className={styles.statDivider} />
                <div className={styles.statBox}>
                    <p className={styles.statNum}>{profile.rating > 0 ? `★ ${profile.rating}` : '—'}</p>
                    <p className={styles.statLbl}>Rating</p>
                </div>
                <div className={styles.statDivider} />
                <div className={styles.statBox}>
                    <p className={styles.statNum}>${Number(profile.total_earned ?? 0).toFixed(0)}</p>
                    <p className={styles.statLbl}>Earned</p>
                </div>
            </div>

            <section className={styles.section}>
                <div className="section-header">
                    <span className="section-title">📸 Your Portfolio</span>
                    <Link href="/profile" className="section-link">Edit <ChevronRight size={12} /></Link>
                </div>
                <Link href="/profile" className={styles.ctaBanner}>
                    <div>
                        <p className={styles.ctaTitle}>Manage Portfolio & Rates</p>
                        <p className={styles.ctaSub}>Keep your work updated to attract more bookings</p>
                    </div>
                    <ChevronRight size={20} color="var(--accent-purple)" />
                </Link>
            </section>

            <section className={styles.section}>
                <div className="section-header">
                    <span className="section-title">🎯 Booking Leads</span>
                    <Link href="/opportunities" className="section-link">View All <ChevronRight size={12} /></Link>
                </div>
                <Link href="/opportunities" className={styles.ctaBanner}>
                    <div>
                        <p className={styles.ctaTitle}>Browse Open Opportunities</p>
                        <p className={styles.ctaSub}>Brands and agents looking for creators</p>
                    </div>
                    <ChevronRight size={20} color="var(--accent-purple)" />
                </Link>
            </section>

            <section className={styles.section}>
                <div className="section-header"><span className="section-title">⚡ Quick Actions</span></div>
                <div className={styles.quickGrid}>
                    <Link href="/profile"      className="btn-primary"><ImageIcon size={14} /> Edit Portfolio</Link>
                    <Link href="/opportunities" className="btn-secondary"><Briefcase size={14} /> Browse Jobs</Link>
                    <Link href="/schedule"     className="btn-secondary"><Clock size={14} /> Schedule</Link>
                    <Link href="/settings/account" className="btn-outline-pink"><Star size={14} /> Settings</Link>
                </div>
            </section>

            <AnnouncementsSection announcements={announcements} onSelect={onSelectAnnouncement} />
        </div>
    );
}

// ── Agent View ───────────────────────────────────────────────────────────────

function AgentView({ profile, announcements, onSelectAnnouncement }) {
    const [listings, setListings] = useState([]);
    const [appCount, setAppCount] = useState(0);

    useEffect(() => {
        Promise.all([
            supabase.from('listings').select('*').eq('posted_by', profile.id).eq('status', 'active').limit(3),
            supabase.from('applications').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
        ]).then(([listRes, appRes]) => {
            if (listRes.data) setListings(listRes.data);
            if (appRes.count != null) setAppCount(appRes.count);
        });
    }, [profile.id]);

    return (
        <div className={styles.content}>
            <div className={styles.statsRow}>
                <div className={styles.statBox}>
                    <p className={styles.statNum}>{listings.length}</p>
                    <p className={styles.statLbl}>Active Castings</p>
                </div>
                <div className={styles.statDivider} />
                <div className={styles.statBox}>
                    <p className={styles.statNum}>{appCount}</p>
                    <p className={styles.statLbl}>Pending Apps</p>
                </div>
                <div className={styles.statDivider} />
                <div className={styles.statBox}>
                    <p className={styles.statNum}><Briefcase size={18} color="var(--accent-gold)" /></p>
                    <p className={styles.statLbl}>Agent</p>
                </div>
            </div>

            <section className={styles.section}>
                <div className="section-header">
                    <span className="section-title">🎯 Your Castings</span>
                    <Link href="/agency" className="section-link">Manage <ChevronRight size={12} /></Link>
                </div>
                {listings.length > 0 ? (
                    <div className={styles.listingList}>
                        {listings.map(l => (
                            <Link key={l.id} href="/agency" className={`card ${styles.listingCard}`}>
                                <div className={styles.listingTop}>
                                    <p className={styles.listingTitle}>{l.title}</p>
                                    <span className="badge badge-pink">{l.pay}</span>
                                </div>
                                <p className={styles.listingMeta}>{l.venue} · {l.location}</p>
                                <p className={styles.listingDate}>{l.date}</p>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <Link href="/agency" className={styles.ctaBanner}>
                        <div>
                            <p className={styles.ctaTitle}>Post Your First Casting</p>
                            <p className={styles.ctaSub}>Reach Atlanta&apos;s top talent</p>
                        </div>
                        <ChevronRight size={20} color="var(--accent-gold)" />
                    </Link>
                )}
            </section>

            <section className={styles.section}>
                <div className="section-header"><span className="section-title">⚡ Quick Actions</span></div>
                <div className={styles.quickGrid}>
                    <Link href="/agency"       className="btn-gold"><Zap size={14} /> Post Casting</Link>
                    <Link href="/creators"     className="btn-secondary"><Camera size={14} /> Browse Creators</Link>
                    <Link href="/opportunities" className="btn-secondary"><Users size={14} /> Browse Talent</Link>
                    <Link href="/schedule"     className="btn-outline-pink"><Clock size={14} /> Schedule</Link>
                </div>
            </section>

            <AnnouncementsSection announcements={announcements} onSelect={onSelectAnnouncement} />
        </div>
    );
}

// ── Management (Agency / Admin) View ─────────────────────────────────────────

function ManagementView({ profile, announcements, onSelectAnnouncement }) {
    const [payments, setPayments]   = useState([]);
    const [txnIds,   setTxnIds]     = useState({});
    const [approving, setApproving] = useState(null);

    useEffect(() => { loadPayments(); }, []);

    const loadPayments = async () => {
        const { data } = await supabase
            .from('transactions')
            .select('*, profiles!transactions_user_id_fkey(full_name, role, email)')
            .eq('status', 'pending')
            .order('created_at', { ascending: false });
        setPayments(data || []);
    };

    const handleApprove = async (txn) => {
        setApproving(txn.id);
        const notes = txnIds[txn.id] ? `Cash App TXN: ${txnIds[txn.id]}` : 'Manually approved';
        await supabase.from('transactions').update({
            status: 'paid',
            paid_at: new Date().toISOString(),
            notes,
        }).eq('id', txn.id);
        setPayments(prev => prev.filter(p => p.id !== txn.id));
        setApproving(null);
    };

    return (
        <div className={styles.content}>

            {/* Payment Queue */}
            <section className={styles.section}>
                <div className="section-header">
                    <span className="section-title">💳 Payment Verification</span>
                    <span className={styles.queueBadge}>{payments.length} pending</span>
                </div>

                {payments.length === 0 ? (
                    <div className={`card ${styles.emptyState}`}>
                        <CheckCircle2 size={28} color="#00ff88" />
                        <p>All payments verified</p>
                    </div>
                ) : (
                    <div className={styles.paymentList}>
                        {payments.map(txn => (
                            <div key={txn.id} className={styles.paymentCard}>
                                <div className={styles.paymentHeader}>
                                    <div className={styles.paymentAvatar}>
                                        {txn.profiles?.full_name?.[0] || '?'}
                                    </div>
                                    <div className={styles.paymentInfo}>
                                        <p className={styles.paymentName}>{txn.profiles?.full_name || 'Unknown'}</p>
                                        <p className={styles.paymentMeta}>
                                            {ROLE_LABEL[txn.profiles?.role] || txn.profiles?.role} · {txn.label}
                                        </p>
                                    </div>
                                    <div className={styles.paymentAmount}>${Math.abs(txn.amount)}</div>
                                </div>

                                <p className={styles.paymentDate}>Submitted {formatTime(txn.created_at)}</p>

                                <div className={styles.paymentApproveRow}>
                                    <input
                                        type="text"
                                        className="input"
                                        placeholder="Cash App transaction ID (optional)"
                                        value={txnIds[txn.id] || ''}
                                        onChange={e => setTxnIds(prev => ({ ...prev, [txn.id]: e.target.value }))}
                                        style={{ flex: 1, fontSize: '0.8rem', padding: '8px 12px' }}
                                    />
                                    <button
                                        className={styles.approveBtn}
                                        onClick={() => handleApprove(txn)}
                                        disabled={approving === txn.id}
                                    >
                                        <CheckCircle2 size={14} />
                                        {approving === txn.id ? 'Approving…' : 'Approve'}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>

            {/* Quick Links */}
            <section className={styles.section}>
                <div className="section-header"><span className="section-title">⚡ Quick Actions</span></div>
                <div className={styles.quickGrid}>
                    <Link href="/admin"    className="btn-primary"><Shield size={14} /> Admin Panel</Link>
                    <Link href="/agency"   className="btn-secondary"><Briefcase size={14} /> Agency Panel</Link>
                    <Link href="/schedule" className="btn-secondary"><Calendar size={14} /> Schedule</Link>
                    <Link href="/opportunities" className="btn-outline-pink"><Users size={14} /> Talent</Link>
                </div>
            </section>

            <AnnouncementsSection announcements={announcements} onSelect={onSelectAnnouncement} />
        </div>
    );
}

// ── Main Export ──────────────────────────────────────────────────────────────

export default function DashboardPage() {
    const [profile,       setProfile]       = useState(null);
    const [shifts,        setShifts]        = useState([]);
    const [weekColors,    setWeekColors]    = useState(FALLBACK_COLORS);
    const [announcements, setAnnouncements] = useState([]);
    const [selected,      setSelected]      = useState(null);
    const [loading,       setLoading]       = useState(true);

    useEffect(() => {
        (async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) { setLoading(false); return; }

            const [profileRes, colorRes, announcementsRes, shiftsRes] = await Promise.all([
                supabase.from('profiles').select('*').eq('id', user.id).single(),
                supabase.from('settings').select('value').eq('key', 'currentWeekendColors').single(),
                supabase.from('announcements').select('*').order('pinned', { ascending: false }).order('created_at', { ascending: false }).limit(5),
                supabase.from('shifts').select('*').eq('talent_id', user.id).order('created_at', { ascending: false }).limit(4),
            ]);

            if (profileRes.data)       setProfile(profileRes.data);
            if (colorRes.data?.value)  { try { setWeekColors(JSON.parse(colorRes.data.value)); } catch {} }
            if (announcementsRes.data) setAnnouncements(announcementsRes.data);
            if (shiftsRes.data)        setShifts(shiftsRes.data);
            setLoading(false);
        })();
    }, []);

    if (loading) return (
        <AppShell>
            <div className={styles.loadingHero}>
                <div className={styles.loadingPill} />
                <div className={styles.loadingTitle} />
            </div>
            <div style={{ padding: '0 16px' }}>
                {[1,2,3].map(i => <div key={i} className={styles.loadingSkeleton} style={{ animationDelay: `${i * 0.1}s` }} />)}
            </div>
        </AppShell>
    );

    if (!profile) return (
        <AppShell>
            <div className={styles.content} style={{ paddingTop: 60, textAlign: 'center' }}>
                <p style={{ color: 'var(--text-muted)', marginBottom: 16 }}>Not signed in.</p>
                <Link href="/login" className="btn-primary">Sign In</Link>
            </div>
        </AppShell>
    );

    const role = profile.role;

    return (
        <AppShell>
            <DashboardHero profile={profile} />

            {MGMT_ROLES.includes(role) && (
                <ManagementView profile={profile} announcements={announcements} onSelectAnnouncement={setSelected} />
            )}
            {role === 'agent' && (
                <AgentView profile={profile} announcements={announcements} onSelectAnnouncement={setSelected} />
            )}
            {role === 'creator' && (
                <CreatorView profile={profile} announcements={announcements} onSelectAnnouncement={setSelected} />
            )}
            {TALENT_ROLES.includes(role) && (
                <TalentView
                    profile={profile}
                    shifts={shifts}
                    weekColors={weekColors}
                    announcements={announcements}
                    onSelectAnnouncement={setSelected}
                />
            )}

            {selected && <AnnouncementModal a={selected} onClose={() => setSelected(null)} />}
        </AppShell>
    );
}
