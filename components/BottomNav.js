'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Calendar, Star, Camera, ShoppingBag, User, Shield } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import styles from './BottomNav.module.css';

export default function BottomNav() {
    const pathname = usePathname();
    const [role, setRole] = useState(null);

    useEffect(() => {
        let mounted = true;
        async function getRole() {
            try {
                // use getSession which is usually faster/cached
                const { data: { session } } = await supabase.auth.getSession();
                if (session && session.user && mounted) {
                    const { data } = await supabase.from('profiles').select('role').eq('id', session.user.id).single();
                    if (mounted) setRole(data?.role);
                }
            } catch (err) {
                console.warn('Auth lock handled gracefully');
            }
        }
        getRole();
        return () => { mounted = false; };
    }, []);

    const navItems = [
        { href: '/dashboard', icon: Home, label: 'Home' },
        { href: '/schedule', icon: Calendar, label: 'Schedule' },
        { href: '/opportunities', icon: Star, label: 'Castings' },
        { href: '/creators', icon: Camera, label: 'Creators' },
        { href: '/shop', icon: ShoppingBag, label: 'Shop' },
        { href: '/profile', icon: User, label: 'Profile' },
    ];

    // Add Agency tab if user is agency or admin
    if (role === 'agency' || role === 'admin') {
        navItems.splice(3, 0, { href: '/agency', icon: Shield, label: 'Agency' });
    }

    return (
        <nav className={styles.nav}>
            <div className={styles.blob} />
            <div className={styles.navInner}>
                {navItems.map(({ href, icon: Icon, label }) => {
                    const active = pathname === href;
                    return (
                        <Link key={href} href={href} className={`${styles.item} ${active ? styles.active : ''}`}>
                            <span className={styles.iconWrap}>
                                <Icon size={20} strokeWidth={active ? 2.5 : 1.8} />
                                {active && <span className={styles.glow} />}
                            </span>
                            <span className={styles.label}>{label}</span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
