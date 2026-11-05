import { AsyncLocalStorage } from 'node:async_hooks'
import { readFile } from 'node:fs/promises'

// Static repository SQL only; there is no user-supplied SQL endpoint.
export function postgresSql(sql) {
  let count = 0
  sql = sql.replaceAll('?', () => `$${++count}`)
  if (sql.startsWith('INSERT OR IGNORE INTO ')) sql = sql.replace('INSERT OR IGNORE INTO ', 'INSERT INTO ') + ' ON CONFLICT DO NOTHING'
  return sql.replace(/\b(FROM|INTO|UPDATE|JOIN)\s+(schema_version|subjects|products|orders|claims|query_attempts|events|print_slots|print_orders|print_events|print_query_attempts|public_demo_checkouts)\b/gi, '$1 railway_payment_stage.$2')
}
const normalize = row => row && Object.fromEntries(Object.entries(row).map(([key, value]) => [key, ['expires_at','created_at','attempted_at','received_at'].includes(key) && value !== null ? Number(value) : value]))
export function createPgAdapter(pool) {
  const context = new AsyncLocalStorage()
  const execute = async (sql, args) => (context.getStore() || pool).query(postgresSql(sql), args)
  return {
    prepare(sql) {
      return {
        async get(...args) { return normalize((await execute(sql,args)).rows[0]) },
        async all(...args) { return (await execute(sql,args)).rows.map(normalize) },
        async run(...args) { const result = await execute(sql,args); return { changes: result.rowCount ?? result.affectedRows } },
      }
    },
    async transaction(fn) {
      if (context.getStore()) throw new Error('nested-transaction-not-supported')
      const client = await pool.connect()
      try {
        await client.query('BEGIN')
        await client.query('SET LOCAL search_path=railway_payment_stage,pg_catalog')
        // STAGE is low throughput. One database-wide transaction lock prevents
        // cross-worker order/claim/expiry races, including request-key retries.
        await client.query('SELECT pg_advisory_xact_lock(904230041)')
        const result = await context.run(client, fn)
        await client.query('COMMIT')
        return result
      } catch (error) {
        await client.query('ROLLBACK')
        throw error
      } finally { client.release() }
    },
    async migrate() {
      const sql = await readFile(new URL('./postgres/001-stage.sql', import.meta.url), 'utf8')
      await this.transaction(async () => { await context.getStore().query(sql) })
    },
    async migratePrints() { const sql=await readFile(new URL('./postgres/002-print-stage.sql',import.meta.url),'utf8'); await this.transaction(async()=>{await context.getStore().query(sql)}) },
    async migratePublic() { const sql=await readFile(new URL('./postgres/003-public-demo.sql',import.meta.url),'utf8'); await this.transaction(async()=>{await context.getStore().query(sql)}) },
    async readyPublic() { await this.prepare('SELECT request_hash FROM public_demo_checkouts LIMIT 0').all() },
    async readyPrints() { await this.prepare('SELECT id FROM print_orders LIMIT 0').all() },
    async ready() { await this.prepare('SELECT version FROM schema_version WHERE version=1').get().then(row => { if (!row) throw new Error('database-migration-required') }) },
    close: () => pool.end(),
  }
}
export function neonPoolOptions(connectionString) {
  let url
  try { url = new URL(connectionString) } catch { throw new Error('stage-database-url-required') }
  if (!['postgres:','postgresql:'].includes(url.protocol) || !url.username || !url.password || !url.pathname.slice(1) || !/^[a-z0-9.-]+\.neon\.tech$/.test(url.hostname) || url.port && url.port !== '5432' || url.hash) throw new Error('dedicated-neon-stage-database-required')
  // pg connection-string SSL flags can override ssl options. Disallow weakening,
  // then remove all parameters and enforce CA/hostname verification ourselves.
  for (const key of url.searchParams.keys()) if (!['sslmode','channel_binding'].includes(key)) throw new Error('unsupported-database-url-option')
  if (url.searchParams.has('sslmode') && !['require','verify-full'].includes(url.searchParams.get('sslmode'))) throw new Error('database-tls-required')
  if (url.searchParams.has('channel_binding') && url.searchParams.get('channel_binding') !== 'require') throw new Error('database-channel-binding-required')
  url.search = ''
  return { connectionString: url.href, ssl: { rejectUnauthorized: true }, enableChannelBinding: true, max: 3, connectionTimeoutMillis: 15000, idleTimeoutMillis: 10000, statement_timeout: 15000 }
}
export async function openPostgres(connectionString) {
  const { Pool } = await import('pg')
  const pool = new Pool(neonPoolOptions(connectionString))
  pool.on('error', () => { /* No connection strings, credentials or query parameters in logs. */ })
  return createPgAdapter(pool)
}
