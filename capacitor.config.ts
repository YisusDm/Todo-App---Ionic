import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.accenture.todoapp',
  appName: 'To Do App',
  webDir: 'www',
  server: {
    androidScheme: 'https',
  },
};

export default config;
