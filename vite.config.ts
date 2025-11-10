import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'url';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    
    // Google Client ID para autenticación OAuth
    const googleClientId = '733176529717-ibb0oaaigqm28gp1fvnlitjeemi1brd5.apps.googleusercontent.com';

    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      define: {
        // APIs de Gemini (si las usas)
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        
        // Google APIs
        'process.env.GOOGLE_API_KEY': JSON.stringify(env.GOOGLE_API_KEY),
        'process.env.GOOGLE_CLIENT_ID': JSON.stringify(googleClientId),
        
        // ID de carpeta de Drive (opcional, se configura en la app)
        'process.env.GOOGLE_DRIVE_FOLDER_ID': JSON.stringify(env.GOOGLE_DRIVE_FOLDER_ID || ''), 
      },
      resolve: {
        alias: {
          '@': path.resolve(path.dirname(fileURLToPath(import.meta.url)), '.'),
        }
      }
    };
});