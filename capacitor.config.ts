import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
    appId: 'com.baddiecastings.app',
    appName: 'Baddie Castings',
    webDir: 'out',
    server: {
        // During development, point to the Next.js dev server so you can
        // use live reload inside the native simulator.  Comment this out for
        // production builds.
        url: 'http://localhost:3000',
        cleartext: true,
    },
    ios: {
        contentInset: 'always',
        backgroundColor: '#080810',
    },
    android: {
        backgroundColor: '#080810',
    },
};

export default config;
