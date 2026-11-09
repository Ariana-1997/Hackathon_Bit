import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const backendTarget = env.VITE_BACKEND_URL || env.BACKEND_URL || 'https://hackathon-bit-uc0e.onrender.com';

  return {
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
  };
});
