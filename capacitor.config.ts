import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'in.ascensions.app',
  appName: 'Ascension Protocol',
  webDir: 'dist/public',
  server: {
    androidScheme: 'https',
    cleartext: true,
  },
  plugins: {
    StatusBar: {
      backgroundColor: '#020617',
      style: 'DARK',
    },
    SplashScreen: {
      launchAutoHide: true,
      backgroundColor: '#020617',
    },
  },
};

export default config;
