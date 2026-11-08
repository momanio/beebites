import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_SANITY_')
  const projectId = (
    process.env.VITE_SANITY_PROJECT_ID || env.VITE_SANITY_PROJECT_ID
  )?.trim()

  return {
    plugins: [react(), tailwindcss()],
    server: {
      port: 4000,
      strictPort: true,
      proxy: projectId && /^[a-z0-9]+$/.test(projectId)
        ? {
            '/api/sanity': {
              target: `https://${projectId}.api.sanity.io`,
              changeOrigin: true,
              rewrite: (path) => path.replace(/^\/api\/sanity/, ''),
              configure: (proxy) => {
                proxy.on('proxyReq', (request) => request.removeHeader('origin'))
              },
            },
          }
        : undefined,
    },
    preview: { port: 4000, strictPort: true },
  }
})
