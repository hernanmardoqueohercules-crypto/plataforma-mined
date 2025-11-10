import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'url';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    // Configurar explícitamente el Google Client ID solicitado por el usuario para solucionar problemas de permisos.
    const googleClientId = '733176529717-ibb0oaaigqm28gp1fvnlitjeemi1brd5.apps.googleusercontent.com';
    // El nombre del bucket ahora se configura en la aplicación. Dejarlo vacío aquí.
    const gcsBucketName = ''; 

    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GOOGLE_API_KEY': JSON.stringify(env.GOOGLE_API_KEY),
        'process.env.GOOGLE_CLIENT_ID': JSON.stringify(googleClientId),
        'process.env.GOOGLE_CLOUD_STORAGE_BUCKET': JSON.stringify(gcsBucketName),
        // Se mantiene la variable de Drive por si alguna lógica residual la necesita, aunque ya no es el método principal.
        'process.env.GOOGLE_DRIVE_FOLDER_ID': JSON.stringify(''), 
      },
      resolve: {
        alias: {
          // Fix: __dirname is not available in ES modules. Use import.meta.url to get the current directory path.
          '@': path.resolve(path.dirname(fileURLToPath(import.meta.url)), '.'),
        }
      }
    };
});