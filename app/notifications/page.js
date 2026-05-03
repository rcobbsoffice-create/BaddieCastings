'use client';

import { useState, useEffect } from 'react';
import AppShell from '@/components/AppShell';
import { Bell, Zap, Calendar, Star, DollarSign, ChevronRight, Check } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import styles from './page.module.css';

const initialNotifications = [
    {
        id: 1,
        type: 'color',
        title: 'New Color Drop! 🎨',
        body: 'This weekend\'s colors are Hot Pink (Sat) and Royal Purple (Sun). Shop now to get your uniform.',
        time: '2 hours ago',
        unread: true,
        icon: Zap,
        color: 'var(--accent-pink)',
    },
    {
        id: 2,
        type: 'payment',
        title: 'Payment Due ⏰',
        body: 'Your uniform payment for this Saturday is due by Friday 11:59 PM.',
        time: '5 hours ago',
        unread: true,
        icon: DollarSign,
        color: 'var(--accent-gold)',
    },
    {
        id: 3,
        type: 'opportunity',
        title: 'New Opportunity: VIP Bottle Service 🍾',
        body: 'A new casting call has been posted for Club Onyx. Apply now!',
        time: 'Yesterday',
        unread: false,
        icon: Star,
        color: 'var(--accent-purple)',
    },
    {
        id: 4,
        type: 'booking',
        title: 'Booking Confirmed ✓',
        body: 'Your booking with Nova Ray Studio for a photoshoot has been confirmed.',
        time: '2 days ago',
        unread: false,
        icon: Calendar,
        color: '#00ff88',
    },
];

const iconMap = { Bell, Zap, Calendar, Star, DollarSign };

export default function NotificationsPage() {
    const [notifications, setNotifications] = useState(initialNotifications);

    useEffect(() => {
        const fetchNotifications = async () => {
            try {
                // Fetch from Supabase
                const { data, error } = await supabase
                    .from('notifications')
                    .select('*')
                    .order('created_at', { ascending: false });

                let finalNotifs = [...initialNotifications];

                if (data && data.length > 0) {
                    const formatted = data.map(n => ({
                        ...n,
                        icon: (typeof n.icon === 'string' && iconMap[n.icon]) ? iconMap[n.icon] : Bell
                    }));
                    finalNotifs = [...formatted, ...finalNotifs];
                }

                // Merge with localStorage
                const storedNotifs = localStorage.getItem('talentNotifications');
                if (storedNotifs) {
                    const parsed = JSON.parse(storedNotifs).map(n => ({
                        ...n,
                        icon: (typeof n.icon === 'string' && iconMap[n.icon]) ? iconMap[n.icon] : Bell
                    }));
                    finalNotifs = [...parsed, ...finalNotifs];
                }

                setNotifications(finalNotifs);
            } catch (err) {
                console.warn('Notifications fetch error:', err);
            }
        };

        fetchNotifications();
    }, []);

    const markAllRead = () => {
        setNotifications(notifications.map(n => ({ ...n, unread: false })));
    };

    const markRead = (id) => {
        setNotifications(notifications.map(n => n.id === id ? { ...n, unread: false } : n));
    };

    return (
        <AppShell>
            <div className="page-header">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h1 className="page-title">Notifications</h1>
                        <p className="page-subtitle">Stay updated with the latest drops</p>
                    </div>
                    {notifications.some(n => n.unread) && (
                        <button className={styles.markReadBtn} onClick={markAllRead}>
                            <Check size={14} /> Mark all read
                        </button>
                    )}
                </div>
            </div>

            <div className={styles.content}>
                <div className={styles.notifList}>
                    {notifications.map((n, i) => (
                        <div
                            key={n.id}
                            className={`${styles.notifItem} ${n.unread ? styles.unread : ''}`}
                            style={{ animationDelay: `${i * 0.05}s` }}
                            onClick={() => markRead(n.id)}
                        >
                            <div className={styles.iconBox} style={{ color: n.color, background: `${n.color}15` }}>
                                <n.icon size={20} />
                            </div>
                            <div className={styles.notifBody}>
                                <div className={styles.topRow}>
                                    <p className={styles.notifTitle}>{n.title}</p>
                                    <p className={styles.notifTime}>{n.time}</p>
                                </div>
                                <p className={styles.notifText}>{n.body}</p>
                            </div>
                            {n.unread && <span className={styles.unreadDot} />}
                        </div>
                    ))}
                </div>

                {notifications.length === 0 && (
                    <div className={styles.empty}>
                        <Bell size={48} color="var(--text-muted)" />
                        <p>No notifications yet</p>
                    </div>
                )}
            </div>
        </AppShell>
    );
}
