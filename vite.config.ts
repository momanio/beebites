import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import { menuQuery } from './src/lib/queries.js'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_SANITY_')
  const projectId = (
    process.env.VITE_SANITY_PROJECT_ID || env.VITE_SANITY_PROJECT_ID
  )?.trim()
  const dataset = (
    process.env.VITE_SANITY_DATASET || env.VITE_SANITY_DATASET
  )?.trim()
  const apiVersion = (
    process.env.VITE_SANITY_API_VERSION || env.VITE_SANITY_API_VERSION || '2026-01-01'
  ).trim()
  const hasSanity = Boolean(
    projectId && /^[a-z0-9]+$/.test(projectId) &&
    dataset && /^[a-z0-9_-]+$/.test(dataset),
  )
  const menuUrl = hasSanity
    ? new URL(mode === 'development'
      ? `/api/sanity/v${apiVersion}/data/query/${dataset}`
      : `https://${projectId}.apicdn.sanity.io/v${apiVersion}/data/query/${dataset}`,
    'https://beebites.invalid')
    : undefined
  menuUrl?.searchParams.set('query', menuQuery)
  menuUrl?.searchParams.set('returnQuery', 'false')
  menuUrl?.searchParams.set('perspective', 'published')
  const menuRequestUrl = menuUrl && (mode === 'development'
    ? `${menuUrl.pathname}${menuUrl.search}`
    : menuUrl.href)

  return {
    plugins: [
      {
        name: 'early-menu-request',
        transformIndexHtml(html: string) {
          if (!menuRequestUrl) return html.replace('<!-- early menu request -->', '')
          const script = `const menuController=new AbortController()
            const menuTimeout=setTimeout(()=>menuController.abort(),8000)
            window.__beebitesMenuPromise=fetch(${JSON.stringify(menuRequestUrl)},{signal:menuController.signal})
            .then(response=>response.ok?response.json():undefined)
            .then(data=>{
              const menu=data?.result
              const featured=menu?.products?.filter(product=>product.available&&!product.comingSoon&&
                (product.heroHighlight==='featured'||product.heroHighlight==='trend'))
                .sort((a,b)=>a.order-b.order||a._id.localeCompare(b._id))[0]
              const match=/^image-(.+)-(\\d+x\\d+)-([a-z0-9]+)$/.exec(featured?.image?.asset?._ref||'')
              if(match){
                const image='https://cdn.sanity.io/images/${projectId}/${dataset}/'+match[1]+'-'+match[2]+'.'+match[3]
                const url=width=>image+'?w='+width+'&q=85&fit=max&auto=format'
                const preload=document.createElement('link')
                preload.rel='preload'
                preload.as='image'
                preload.setAttribute('imagesrcset',url(360)+' 360w, '+url(600)+' 600w, '+url(960)+' 960w')
                preload.setAttribute('imagesizes','(min-width: 1024px) 440px, (min-width: 768px) 580px, (min-width: 480px) 424px, 70vw')
                preload.setAttribute('fetchpriority','high')
                document.head.append(preload)
              }
              return menu
            }).catch(()=>undefined).finally(()=>clearTimeout(menuTimeout))`
          const preconnect = mode === 'development'
            ? ''
            : `<link rel="preconnect" href="https://${projectId}.apicdn.sanity.io" crossorigin />`
          return html.replace('<!-- early menu request -->', `${preconnect}<script>${script}</script>`)
        },
      },
      react(),
      tailwindcss(),
    ],
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
