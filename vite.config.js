import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base './' lets the built site run from any folder (and from a Capacitor/Android WebView)
export default defineConfig({ plugins: [react()], base: './' });
