'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import AppShell from '@/components/AppShell';
import {
    DollarSign, Users, TrendingUp, ShoppingBag, CheckCircle2, XCircle,
    AlertTriangle, BarChart2, Star, ChevronRight, Bell
} from 'lucide-react';
import Link from 'next/link';
import styles from './page.module.css';

const stats = [
    { label: 'Total Revenue', value: '$12,480', sub: '+18% this month', icon: DollarSign, color: 'var(--accent-gold)', bg: 'rgba(255,215,0,0.1)' },
    { label: 'Active Talent', value: '38', sub: '4 new this week', icon: Users, color: 'var(--accent-pink)', bg: 'var(--accent-pink-dim)' },
    { label: 'Uniforms Sold', value: '74', sub: 'This month', icon: ShoppingBag, color: 'var(--accent-purple)', bg: 'var(--accent-purple-dim)' },
    { label: 'Bookings', value: '21', sub: '3 pending', icon: BarChart2, color: '#00ff88', bg: 'rgba(0,255,136,0.1)' },
];

const pendingUsers = [
    { name: 'Kayla Brooks', role: 'Talent', time: '2h ago', ig: '@kaylabrooks' },
    { name: 'Nova Ray Studio', role: 'Creator', time: '5h ago', ig: '@novaraystudio' },
    { name: 'Club Kingdom', role: 'Casting Agent', time: '1d ago', ig: '@clubkingdom' },
];

const unpaidGirls = [
    { name: 'Amber James', amount: '$180', due: 'Onboarding', overdue: true },
    { name: 'Nia Williams', amount: '$65', due: 'Uniform', overdue: false },
    { name: 'Destiny M.', amount: '$65', due: 'Uniform', overdue: true },
];

const topPerformers = [
    { name: 'Jasmine Carter', shifts: 24, rating: 4.9, status: 'Elite' },
    { name: 'Priya Singh', shifts: 20, rating: 4.8, status: 'Elite' },
    { name: 'Kiera Davis', shifts: 18, rating: 4.7, status: 'Active' },
];

const recentRevenue = [
    { label: 'Onboarding Fee × 2', amount: '+$360', date: 'Today' },
    { label: 'Uniform × 4', amount: '+$260', date: 'Today' },
    { label: 'Creator Booking', amount: '+$75', date: 'Yesterday' },
    { label: 'VIP Bundle × 1', amount: '+$135', date: 'Yesterday' },
];

const ROLE_LABEL = {
    talent: 'Talent', bottle_girl: 'Bottle Girl', bartender: 'Bartender',
    hookah_girl: 'Hookah Girl', dj: 'DJ',
};

export default function AdminPage() {
    const [announcementText, setAnnouncementText] = useState('');
    const [colors, setColors] = useState({
        saturday: { name: 'Hot Pink', hex: '#FF007A' },
        sunday: { name: 'Royal Purple', hex: '#9B59FF' }
    });
    const [loading, setLoading] = useState(false);

    // ID verification
    const [idProfiles, setIdProfiles] = useState([]);
    const [idSignedUrls, setIdSignedUrls] = useState({});
    const [idLoadError, setIdLoadError] = useState(null);
    const [expandedId, setExpandedId] = useState(null);

    useEffect(() => {
        const storedColors = localStorage.getItem('currentWeekendColors');
        if (storedColors) setColors(JSON.parse(storedColors));
        loadIdProfiles();
    }, []);

    const loadIdProfiles = async () => {
        const { data, error } = await supabase
            .from('profiles')
            .select('id, full_name, role, status, id_front_url, id_back_url, id_verified, created_at')
            .not('id_front_url', 'is', null)
            .order('created_at', { ascending: false });

        if (error) { setIdLoadError(error.message); return; }
        setIdProfiles(data || []);
    };

    const getSignedUrls = async (profile) => {
        if (idSignedUrls[profile.id]) { setExpandedId(profile.id); return; }
        const [{ data: f }, { data: b }] = await Promise.all([
            supabase.storage.from('ids').createSignedUrl(profile.id_front_url, 3600),
            supabase.storage.from('ids').createSignedUrl(profile.id_back_url, 3600),
        ]);
        setIdSignedUrls(prev => ({
            ...prev,
            [profile.id]: { front: f?.signedUrl, back: b?.signedUrl },
        }));
        setExpandedId(profile.id);
    };

    const handleVerify = async (profileId, verified) => {
        await supabase.from('profiles').update({ id_verified: verified }).eq('id', profileId);
        setIdProfiles(prev => prev.map(p => p.id === profileId ? { ...p, id_verified: verified } : p));
    };

    const handlePostAnnouncement = async () => {
        if (!announcementText.trim()) return;
        setLoading(true);

        const newAnnouncement = {
            title: 'Admin Update 📣',
            body: announcementText.substring(0, 100) + (announcementText.length > 100 ? '...' : ''),
            full_text: announcementText,
            author: 'Admin',
            icon: '📣'
        };

        try {
            // Attempt to write to Supabase
            const { error: sbError } = await supabase.from('announcements').insert([newAnnouncement]);

            if (sbError) {
                console.warn('Supabase Insert Error (likely table missing):', sbError);
                // Fallback to localStorage
                const stored = JSON.parse(localStorage.getItem('dashboardAnnouncements') || '[]');
                localStorage.setItem('dashboardAnnouncements', JSON.stringify([{ ...newAnnouncement, id: Date.now(), time: 'Just now' }, ...stored]));
            }

            // Notifications
            const newNotif = {
                type: 'admin',
                title: 'New Admin Message',
                body: announcementText.substring(0, 60) + '...',
                unread: true,
                icon: 'Bell',
                color: 'var(--accent-pink)'
            };
            await supabase.from('notifications').insert([newNotif]);

            const storedNotifs = JSON.parse(localStorage.getItem('talentNotifications') || '[]');
            localStorage.setItem('talentNotifications', JSON.stringify([{ ...newNotif, id: Date.now(), time: 'Just now' }, ...storedNotifs]));

            setAnnouncementText('');
            alert('Announcement posted! (Syncing with database)');
        } catch (err) {
            console.error('Final Posting Error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveColors = async () => {
        try {
            const { error: sbError } = await supabase
                .from('settings')
                .upsert({ key: 'currentWeekendColors', value: colors });

            if (sbError) throw sbError;

            localStorage.setItem('currentWeekendColors', JSON.stringify(colors));

            // Push notification for color drop
            const newNotif = {
                type: 'color',
                title: 'New Weekend Color Drop! 🎨',
                body: `The new color codes are live: ${Object.values(colors).map(c => c.name).join(', ')}. Check the schedule!`,
                unread: true,
                icon: 'Zap',
                color: 'var(--accent-gold)'
            };
            await supabase.from('notifications').insert([newNotif]);

            alert('Weekend Colors updated and synced globally!');
        } catch (err) {
            console.error('Color Save Error:', err);
            localStorage.setItem('currentWeekendColors', JSON.stringify(colors));
            alert('Updated locally (Supabase table not found yet).');
        }
    };

    return (
        <AppShell>
            <div className="page-header" style={{ paddingBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h1 className="page-title">Admin Dashboard</h1>
                        <p className="page-subtitle">Platform overview · Week of Apr 14</p>
                    </div>
                    <Link href="/notifications" className={styles.notifBtn} id="btn-admin-notifications">
                        <Bell size={18} />
                        <span className={styles.notifDot} />
                    </Link>
                </div>
            </div>

            <div className={styles.content}>

                {/* Weekend Color Drop */}
                <section className={styles.section}>
                    <div className="section-header">
                        <span className="section-title">🎨 Weekend Color Drop</span>
                    </div>
                    <div className={`card ${styles.colorDropCard}`}>
                        <div className={styles.colorDropGrid}>
                            <div className={styles.colorDropField}>
                                <label>Saturday Name</label>
                                <input
                                    type="text"
                                    className="input"
                                    value={colors.saturday.name}
                                    onChange={e => setColors({ ...colors, saturday: { ...colors.saturday, name: e.target.value } })}
                                />
                                <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                                    <input
                                        type="color"
                                        value={colors.saturday.hex}
                                        onChange={e => setColors({ ...colors, saturday: { ...colors.saturday, hex: e.target.value } })}
                                        style={{ width: 40, height: 40, border: 'none', background: 'none' }}
                                    />
                                    <input
                                        type="text"
                                        className="input"
                                        value={colors.saturday.hex}
                                        onChange={e => setColors({ ...colors, saturday: { ...colors.saturday, hex: e.target.value } })}
                                    />
                                </div>
                            </div>
                            <div className={styles.colorDropField}>
                                <label>Sunday Name</label>
                                <input
                                    type="text"
                                    className="input"
                                    value={colors.sunday.name}
                                    onChange={e => setColors({ ...colors, sunday: { ...colors.sunday, name: e.target.value } })}
                                />
                                <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                                    <input
                                        type="color"
                                        value={colors.sunday.hex}
                                        onChange={e => setColors({ ...colors, sunday: { ...colors.sunday, hex: e.target.value } })}
                                        style={{ width: 40, height: 40, border: 'none', background: 'none' }}
                                    />
                                    <input
                                        type="text"
                                        className="input"
                                        value={colors.sunday.hex}
                                        onChange={e => setColors({ ...colors, sunday: { ...colors.sunday, hex: e.target.value } })}
                                    />
                                </div>
                            </div>
                        </div>
                        <button className="btn-gold" style={{ width: '100%', marginTop: 16 }} onClick={handleSaveColors}>
                            Update Weekend Colors
                        </button>
                    </div>
                </section>

                {/* Stats Grid */}
                <div className={styles.statsGrid}>
                    {stats.map((s) => (
                        <div key={s.label} className={`card ${styles.statCard}`}>
                            <div className={styles.statIcon} style={{ background: s.bg, color: s.color }}>
                                <s.icon size={18} />
                            </div>
                            <p className={styles.statValue}>{s.value}</p>
                            <p className={styles.statLabel}>{s.label}</p>
                            <p className={styles.statSub}>{s.sub}</p>
                        </div>
                    ))}
                </div>

                {/* ID Verification Review */}
                <section className={styles.section}>
                    <div className="section-header">
                        <span className="section-title">🪪 ID Verification</span>
                        <span className={styles.idBadge}>{idProfiles.filter(p => !p.id_verified).length} pending</span>
                    </div>

                    {idLoadError && (
                        <p className={styles.idError}>Could not load IDs: {idLoadError}</p>
                    )}

                    {!idLoadError && idProfiles.length === 0 && (
                        <div className={`card ${styles.idEmpty}`}>No ID submissions yet.</div>
                    )}

                    <div className={styles.idList}>
                        {idProfiles.map(profile => {
                            const isExpanded = expandedId === profile.id;
                            const urls = idSignedUrls[profile.id];
                            return (
                                <div key={profile.id} className={`${styles.idCard} ${profile.id_verified ? styles.idCardVerified : ''}`}>
                                    <div className={styles.idCardHeader} onClick={() => isExpanded ? setExpandedId(null) : getSignedUrls(profile)}>
                                        <div className={styles.idCardAvatar}>
                                            {profile.full_name?.[0] || '?'}
                                        </div>
                                        <div className={styles.idCardInfo}>
                                            <p className={styles.idCardName}>{profile.full_name}</p>
                                            <p className={styles.idCardMeta}>
                                                {ROLE_LABEL[profile.role] || profile.role} · {profile.status}
                                            </p>
                                        </div>
                                        <div className={styles.idCardStatus}>
                                            {profile.id_verified
                                                ? <span className={styles.idVerifiedBadge}>✓ Verified</span>
                                                : <span className={styles.idPendingBadge}>Pending</span>
                                            }
                                            <span className={styles.idChevron}>{isExpanded ? '▲' : '▼'}</span>
                                        </div>
                                    </div>

                                    {isExpanded && (
                                        <div className={styles.idCardBody}>
                                            {!urls && <p className={styles.idLoading}>Loading images…</p>}
                                            {urls && (
                                                <>
                                                    <div className={styles.idImagesRow}>
                                                        <div className={styles.idImageBox}>
                                                            <p className={styles.idImageLabel}>Front</p>
                                                            {urls.front
                                                                ? <img src={urls.front} alt="ID Front" className={styles.idImage} />
                                                                : <div className={styles.idImageMissing}>No image</div>
                                                            }
                                                        </div>
                                                        <div className={styles.idImageBox}>
                                                            <p className={styles.idImageLabel}>Back</p>
                                                            {urls.back
                                                                ? <img src={urls.back} alt="ID Back" className={styles.idImage} />
                                                                : <div className={styles.idImageMissing}>No image</div>
                                                            }
                                                        </div>
                                                    </div>
                                                    <div className={styles.idActions}>
                                                        {!profile.id_verified && (
                                                            <button className={styles.idApproveBtn} onClick={() => handleVerify(profile.id, true)}>
                                                                <CheckCircle2 size={14} /> Verify ID
                                                            </button>
                                                        )}
                                                        {profile.id_verified && (
                                                            <button className={styles.idRevokeBtn} onClick={() => handleVerify(profile.id, false)}>
                                                                <XCircle size={14} /> Revoke
                                                            </button>
                                                        )}
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </section>

                {/* Announcement Composer */}
                <section className={styles.section}>
                    <div className="section-header">
                        <span className="section-title">📣 Post Announcement</span>
                    </div>
                    <div className={styles.announceBox}>
                        <textarea
                            id="input-announcement"
                            className="input"
                            placeholder="Write an announcement for all talent…"
                            rows={3}
                            value={announcementText}
                            onChange={e => setAnnouncementText(e.target.value)}
                            style={{ resize: 'none', height: 'auto' }}
                        />
                        <button
                            className="btn-primary"
                            id="btn-post-announcement"
                            style={{ marginTop: 10, width: '100%', opacity: loading ? 0.7 : 1 }}
                            onClick={handlePostAnnouncement}
                            disabled={loading}
                        >
                            {loading ? 'Posting...' : <><Bell size={14} /> Post to All Talent</>}
                        </button>
                    </div>
                </section>

            </div>
        </AppShell>
    );
}
