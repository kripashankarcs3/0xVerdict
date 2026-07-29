import { defineConfig, type HtmlTagDescriptor, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'

const rootDir = path.resolve(__dirname, '..')
const frontendDir = path.resolve(__dirname)

// Vite config — https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const emitSourcemaps = mode === 'development'

  return {
    base: process.env.PUBLIC_URL ? `${process.env.PUBLIC_URL}/` : '/',
    build: {
      sourcemap: emitSourcemaps ? 'inline' : false,
      minify: !emitSourcemaps,
    },
    plugins: [
      react(),
      tailwindcss(),
      siteConfiguration(),
      errorOverlayReplay(),
      reactRefreshBoundaryFallback(),
    ],
    root: frontendDir,
    publicDir: path.resolve(frontendDir, 'public'),
    resolve: {
      alias: {
        '@': path.resolve(frontendDir, 'src'),
      },
    },
    server: {
      host: '0.0.0.0',
      port: parseInt(process.env.PORT || '8443'),
      strictPort: true,
      proxy: {
        '/opencode-api': {
          target: 'https://opencode.ai/zen/v1',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/opencode-api/, ''),
        },
      },
    },
    preview: {
      host: '0.0.0.0',
      port: parseInt(process.env.PORT || '8443'),
      proxy: {
        '/opencode-api': {
          target: 'https://opencode.ai/zen/v1',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/opencode-api/, ''),
        },
      },
    },
  }
})

function siteConfiguration(): Plugin {
  return {
    name: 'site-configuration',
    transformIndexHtml: {
      order: 'pre',
      handler(html) {
        const tags: HtmlTagDescriptor[] = []
        tags.push({ tag: 'meta', attrs: { property: 'og:title', content: '0xVerdict' }, injectTo: 'head' })
        tags.push({
          tag: 'meta',
          attrs: { name: 'description', content: 'AI-Powered Web Vulnerability Analysis' },
          injectTo: 'head',
        })
        return { html, tags }
      },
    },
  }
}

function errorOverlayReplay(): Plugin {
  return {
    name: 'error-overlay-replay',
    apply: 'serve',
    configureServer(server) {
      let lastError: object | null = null

      const origSend = server.ws.send.bind(server.ws) as (...args: any[]) => void
      server.ws.send = ((...args: any[]) => {
        const payload = args[0]
        if (payload && typeof payload === 'object' && !Array.isArray(payload)) {
          const type = (payload as { type?: string }).type
          if (type === 'error') {
            lastError = payload as object
          } else if (type === 'update' || type === 'full-reload') {
            lastError = null
          }
        }
        return origSend(...args)
      }) as typeof server.ws.send

      server.ws.on('connection', (socket) => {
        if (lastError !== null) {
          socket.send(JSON.stringify(lastError))
        }
      })
    },
  }
}

function reactRefreshBoundaryFallback(): Plugin {
  const hadRefreshBoundary = new Map<string, boolean>()
  let sendFullReload: (() => void) | null = null

  return {
    name: 'react-refresh-boundary-fallback',
    apply: 'serve',
    enforce: 'post',
    configureServer(server) {
      sendFullReload = () => server.ws.send({ type: 'full-reload', path: '*' })
    },
    transform(code, id) {
      if (!/\.[jt]sx?(?:\?|$)/.test(id) || id.includes('/node_modules/')) return null

      const moduleId = id.split('?')[0] ?? id
      const hasRefreshBoundary = code.includes('registerExportsForReactRefresh')
      const previousHadRefreshBoundary = hadRefreshBoundary.get(moduleId)
      hadRefreshBoundary.set(moduleId, hasRefreshBoundary)

      if (previousHadRefreshBoundary && !hasRefreshBoundary) {
        queueMicrotask(() => sendFullReload?.())
      }

      return null
    },
  }
}
