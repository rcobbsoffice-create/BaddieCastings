'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';

// Pages that never require a session
const PUBLIC_PATHS = ['/', '/login', '/register', '/apply', '/forgot-password', '/reset-password', '/book', '/hire', '/about'];

const ROLE_ROUTES = {
    admin:   '/admin',
    agency:  '/agency',
    agent:   '/opportunities',
    creator: '/creators',
    talent:  '/dashboard',
};

export default function AuthGuard({ children }) {
    const router   = useRouter();
    const rawPath  = usePathname();

    // Normalize trailing slash so /apply/ matches /apply in PUBLIC_PATHS
    const pathname = rawPath === '/' ? '/' : rawPath.replace(/\/$/, '');
    const isPublic = PUBLIC_PATHS.includes(pathname);

    // Private pages start loading; public pages render immediately
    const [checking, setChecking] = useState(!isPublic);

    useEffect(() => {
        let mounted = true;

        const check = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!mounted) return;

            // Unauthenticated on a private page → go to login
            if (!session && !isPublic) {
                router.push('/login');
                return;
            }

            // Authenticated on landing or login → redirect to their dashboard
            if (session && (pathname === '/' || pathname === '/login')) {
                const role = await fetchRole(session.user.id);
                if (!mounted) return;
                router.push(ROLE_ROUTES[role] || '/dashboard');
                return;
            }

            // Admin route — verify role (admin OR agency can access)
            if (session && pathname.startsWith('/admin')) {
                const role = await fetchRole(session.user.id);
                if (!mounted) return;
                if (role === 'agency') {
                    // Agency users get redirected to their equivalent dashboard
                    router.push('/agency');
                    return;
                }
                if (role !== 'admin') {
                    router.push(ROLE_ROUTES[role] || '/dashboard');
                    return;
                }
            }

            if (!mounted) return;
            setChecking(false);
        };

        check();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            if (!session && !isPublic) {
                router.push('/login');
            }
        });

        return () => {
            mounted = false;
            subscription.unsubscribe();
        };
    }, [pathname, router, isPublic]);

    // Public pages always render immediately — no spinner
    if (isPublic) return children;

    // Private pages: show spinner while verifying session
    if (checking) {
        return (
            <div style={{
                height: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'var(--bg-primary)',
            }}>
                <div className="loader-spin" />
            </div>
        );
    }

    return children;
}

async function fetchRole(userId) {
    try {
        const { data } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', userId)
            .single();
        return data?.role || 'talent';
    } catch {
        return 'talent';
    }
}
