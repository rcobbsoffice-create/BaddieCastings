import Link from 'next/link';
import AppShell from '@/components/AppShell';

export default function NotFound() {
    return (
        <AppShell>
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '80px 20px',
                textAlign: 'center'
            }}>
                <h1 style={{ fontSize: '4rem', marginBottom: '20px' }}>404</h1>
                <h2 style={{ fontSize: '1.5rem', marginBottom: '40px' }}>Page Not Found</h2>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '40px' }}>
                    The page you are looking for doesn't exist or has been moved.
                </p>
                <Link href="/" className="btn-primary">
                    Back to Home
                </Link>
            </div>
        </AppShell>
    );
}
