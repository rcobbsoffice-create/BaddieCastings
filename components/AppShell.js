'use client';

import BottomNav from '@/components/BottomNav';

export default function AppShell({ children }) {
    return (
        <>
            <div className="page-wrapper">{children}</div>
            <BottomNav />
        </>
    );
}
