'use client';

import AuthGuard from './AuthGuard';

export default function ClientLayout({ children }) {
    return (
        <AuthGuard>
            {children}
        </AuthGuard>
    );
}
