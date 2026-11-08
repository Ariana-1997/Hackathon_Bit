import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const backendTarget = process.env.VITE_BACKEND_URL || 'http://localhost:8080';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: true,
    allowedHosts: true,
    proxy: {
      '/api/v1': { target: backendTarget, changeOrigin: true },
      '/actuator': { target: backendTarget, changeOrigin: true },
      '/v3/api-docs': { target: backendTarget, changeOrigin: true },
      '/swagger-ui': { target: backendTarget, changeOrigin: true },
    },
  },
  preview: {
    port: 3000,
    host: true,
    allowedHosts: true,
    proxy: {
      '/api/v1': { target: backendTarget, changeOrigin: true },
      '/actuator': { target: backendTarget, changeOrigin: true },
      '/v3/api-docs': { target: backendTarget, changeOrigin: true },
      '/swagger-ui': { target: backendTarget, changeOrigin: true },
    },
  },
});
