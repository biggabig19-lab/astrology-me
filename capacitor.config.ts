import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.astrologyme.app',
  appName: 'Astrology Me',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
