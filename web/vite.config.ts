import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import tsconfigPaths from 'vite-tsconfig-paths'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [
      react(),
      tailwindcss(),
      tsconfigPaths(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['robots.txt', 'favicon.svg'],
        manifest: {
          name: 'Retorrent',
          short_name: 'Retorrent',
          description: 'Retorrent web client for managing your downloads.',
          theme_color: '#111827',
          background_color: '#f8fafc',
          display: 'standalone',
          scope: '/',
          start_url: '/',
          // The PNGs are generated outside the repo; see docs/pwa-icon-prompts.md for guidance.
          icons: [
            {
              src: 'pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png',
            },
            {
              src: 'pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
            },
            {
              src: 'pwa-maskable-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
          ],
        },
        devOptions: {
          enabled: true,
        },
      }),
    ],
    server: {
      proxy: {
        '/api': {
          target: env.VITE_POCKETBASE_URL,
          // changeOrigin: true,
        },
      },
    },
  }
})
