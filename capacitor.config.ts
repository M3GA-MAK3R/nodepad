import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.prolificwebcraft.nodepad',
  appName: 'Nodepad',
  webDir: 'out',
  server: {
    // Allow loading local files in the webview
    androidScheme: 'https',
  },
};

export default config;
