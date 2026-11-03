import { isAbsolute } from 'node:path'

export function runtimeOptions(env) {
  const freeStage = env.PAYMENT_DEPLOYMENT === 'render-free-stage'
  if (freeStage && (env.PAYMENT_DATABASE !== 'postgres' || !env.DATABASE_URL)) throw new Error('free-postgres-adapter-required; DATABASE_URL and postgres mode required')
  const hosted = freeStage || env.PAYMENT_DEPLOYMENT === 'render-stage'
  if (env.PAYMENT_DEPLOYMENT && !hosted && env.PAYMENT_DEPLOYMENT !== 'local') throw new Error('unsupported-deployment')
  const origin = env.PAYMENT_ALLOWED_ORIGIN || 'http://localhost:5179'
  if (new URL(origin).origin !== origin || (!origin.startsWith('https://') && !/^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin))) throw new Error('invalid-frontend-origin')
  if (!hosted) return { database: env.PAYMENT_DATABASE || 'sqlite', host: '127.0.0.1', port: Number(env.PAYMENT_PORT), publicOrigin: null, allowedOrigin: origin, returnUrl: env.ECPAY_RETURN_URL }
  if (env.RENDER !== 'true' || !/^https:\/\/[a-z0-9-]+\.onrender\.com$/.test(env.RENDER_EXTERNAL_URL || '')) throw new Error('render-public-origin-required')
  if (!freeStage && (!isAbsolute(env.PAYMENT_DB_PATH || '') || !env.PAYMENT_DB_PATH.startsWith('/var/data/'))) throw new Error('render-persistent-db-path-required')
  const callback = `${env.RENDER_EXTERNAL_URL}/api/payment/ecpay/notify`
  if (env.ECPAY_RETURN_URL && env.ECPAY_RETURN_URL !== callback) throw new Error('render-callback-mismatch')
  return { database: freeStage ? 'postgres' : 'sqlite', host: '0.0.0.0', port: Number(env.PORT), publicOrigin: env.RENDER_EXTERNAL_URL, allowedOrigin: origin, returnUrl: callback }
}
