'use client';

import { useState } from 'react';
import AppShell from '@/components/AppShell';
import { useRouter } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import styles from '../settings.module.css';

const notifGroups = [
    {
        group: 'Activity',
        items: [
            { id: 'new_casting', label: 'New Casting Opportunities', desc: 'Get notified when new castings are posted', defaultOn: true },
            { id: 'schedule', label: 'Schedule Updates', desc: 'Reminders for upcoming shifts', defaultOn: true },
            { id: 'payment_due', label: 'Payment Deadlines', desc: 'Alerts before payments are due', defaultOn: true },
        ],
    },
    {
        group: 'Admin',
        items: [
            { id: 'admin_msg', label: 'Admin Messages', desc: 'Direct messages from platform admins', defaultOn: true },
            { id: 'announcements', label: 'Announcements', desc: 'Platform-wide news and updates', defaultOn: false },
        ],
    },
    {
        group: 'Marketing',
        items: [
            { id: 'promo', label: 'Promotions & Deals', desc: 'Special discounts on uniforms and add-ons', defaultOn: false },
        ],
    },
];

export default function NotificationsPage() {
    const router = useRouter();
    const [toggles, setToggles] = useState(
        Object.fromEntries(
            notifGroups.flatMap(g => g.items).map(item => [item.id, item.defaultOn])
        )
    );

    const toggle = (id) => setToggles(prev => ({ ...prev, [id]: !prev[id] }));

    return (
        <AppShell>
            <div className={styles.page}>
                <div className={styles.header}>
                    <button className={styles.back} onClick={() => router.back()}>
                        <ChevronLeft size={20} />
                    </button>
                    <h1 className={styles.title}>Notifications</h1>
                    <div style={{ width: 36 }} />
                </div>

                {notifGroups.map(({ group, items }) => (
                    <section key={group} className={styles.section}>
                        <p className={styles.groupLabel}>{group}</p>
                        <div className={styles.settingsList}>
                            {items.map(({ id, label, desc }) => (
                                <div key={id} className={styles.toggleRow}>
                                    <div>
                                        <p className={styles.toggleLabel}>{label}</p>
                                        <p className={styles.toggleDesc}>{desc}</p>
                                    </div>
                                    <button
                                        className={`${styles.toggle} ${toggles[id] ? styles.toggleOn : ''}`}
                                        onClick={() => toggle(id)}
                                        id={`toggle-${id}`}
                                        aria-label={label}
                                    >
                                        <span className={styles.toggleThumb} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </section>
                ))}
            </div>
        </AppShell>
    );
}
