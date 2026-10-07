import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  base: mode === 'desktop' ? './' : '/icube-learning/',
  build: { outDir: mode === 'desktop' ? 'dist-desktop' : 'dist' },
}));
