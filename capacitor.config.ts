import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.example.whereismybus',
  appName: 'whereismybus',
  webDir: 'build',
  server: {
    androidScheme: 'https',
    allowNavigation: ['*.razorpay.com', 'api.razorpay.com']
  },
  plugins: {
    CapacitorHttp: {
      enabled: true
    }
  }
};

export default config;
