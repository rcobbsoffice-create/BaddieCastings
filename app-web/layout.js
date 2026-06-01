import './globals.css';
import ClientLayout from '@/components/ClientLayout';

export const metadata = {
  title: 'Baddie Castings',
  description: 'The premium marketplace for talent, creators, and opportunities.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Baddie Castings',
  },
  other: {
    'mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'black-translucent',
    'msapplication-TileColor': '#080810',
    'msapplication-tap-highlight': 'no',
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#ff007a',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="192x192" href="/icon-192.png" />
        <link rel="icon" type="image/png" sizes="512x512" href="/icon-512.png" />
      </head>
      <body>
        <ClientLayout>
          {children}
        </ClientLayout>
      </body>
    </html>
  );
}
