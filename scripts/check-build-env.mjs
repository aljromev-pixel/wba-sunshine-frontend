import { loadEnv } from 'vite'

const env = { ...loadEnv('production', process.cwd(), 'VITE_'), ...process.env }

try {
  if (!env.VITE_API_BASE_URL) throw new Error('Set VITE_API_BASE_URL before building.')
  const url = new URL(env.VITE_API_BASE_URL)
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.search || url.hash) {
    throw new Error('VITE_API_BASE_URL must be an HTTP(S) base URL without credentials, query, or fragment.')
  }
  if (env.VERCEL === '1' && (url.protocol !== 'https:' || ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname))) {
    throw new Error('Vercel requires a public HTTPS Laravel API URL.')
  }
  console.log('API build configuration verified.')
} catch (error) {
  console.error(`Build configuration error: ${error.message}`)
  process.exitCode = 1
}
