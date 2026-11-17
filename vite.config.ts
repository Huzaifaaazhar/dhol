import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// the config runs in Node; only this one variable is read
declare const process: { env: Record<string, string | undefined> };

export default defineConfig({
  // GitHub Pages serves the game from /dhol/; everywhere else it lives at the root
  base: process.env.BASE_PATH ?? '/',
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 1600,
    rollupOptions: {
      output: {
        manualChunks: { three: ['three'], r3f: ['@react-three/fiber', '@react-three/drei'] },
      },
    },
  },
});
