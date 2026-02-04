interface ProjectOptions {
  name: string
  pusher: boolean
  logger: boolean
  example: boolean
}

export function getProjectFiles(options: ProjectOptions): Record<string, string> {
  const files: Record<string, string> = {}

  // Core config files
  files['nitro.config.ts'] = `import { defineNitroConfig } from 'nitro/config'

export default defineNitroConfig({
  serverDir: './',
})
`

  files['tsconfig.json'] = `{
  "extends": ["nitro/tsconfig"],
  "compilerOptions": {
    "paths": {
      "~/*": ["./*"]
    }
  }
}
`

  files['eslint.config.js'] = `import antfu from '@antfu/eslint-config'

export default antfu({
  ignores: ['**/*.md'],
  rules: {
    'node/prefer-global/process': 'off',
    'node/prefer-global/buffer': 'off',
    'no-console': 'off',
  },
})
`

  files['.gitignore'] = `node_modules
dist
.data
.nitro
.cache
.output
.env
.env.local
*.db
*.db-shm
*.db-wal
data/*.db
*.sqlite
.DS_Store
`

  // Server config
  files['server/config/index.ts'] = generateConfigIndex(options)
  files['server/config/database.ts'] = `export const databaseConfig = {
  databasePath: process.env.NITRO_DATABASE_PATH || './data/${options.name}.db',
}
`
  files['server/config/cors.ts'] = getCorsConfig()

  // Database
  files['server/database/index.ts'] = getDatabaseIndex()
  files['server/database/schema.ts'] = generateSchema(options)
  files['server/database/types.ts'] = generateDatabaseTypes(options)

  // Utils
  files['server/utils/secure-compare.ts'] = getSecureCompare()
  files['server/utils/rate-limiter.ts'] = getRateLimiter()

  // CORS middleware
  files['middleware/00-cors.ts'] = getCorsMiddleware()

  // Conditional services
  if (options.pusher) {
    Object.assign(files, getPusherFiles())
  }

  if (options.logger) {
    Object.assign(files, getLoggerFiles())
  }

  if (options.example) {
    Object.assign(files, getExampleFiles())
  }

  // README
  files['README.md'] = generateReadme(options)

  return files
}

function generateConfigIndex(options: ProjectOptions): string {
  const exports: string[] = [
    `export { databaseConfig } from './database'`,
    `export { corsConfig } from './cors'`,
  ]

  if (options.pusher) {
    exports.push(`export { pusherConfig } from './pusher'`)
  }
  if (options.logger) {
    exports.push(`export { loggerConfig } from './logger'`)
  }

  return exports.join('\n') + '\n'
}

function generateSchema(options: ProjectOptions): string {
  let tables = ''

  if (options.pusher) {
    tables += `
  // Subscriptions table
  db.exec(\`
    CREATE TABLE IF NOT EXISTS subscriptions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      endpoint TEXT UNIQUE NOT NULL,
      keys TEXT NOT NULL,
      device_id TEXT NOT NULL,
      expiration_time TEXT,
      metadata TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_subscriptions_device_id ON subscriptions(device_id);
  \`)
`
  }

  if (options.logger) {
    tables += `
  // Logs table
  db.exec(\`
    CREATE TABLE IF NOT EXISTS logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      level TEXT NOT NULL,
      message TEXT NOT NULL,
      source TEXT NOT NULL,
      client_id TEXT,
      user_agent TEXT,
      ip_address TEXT,
      metadata TEXT,
      timestamp TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_logs_level ON logs(level);
    CREATE INDEX IF NOT EXISTS idx_logs_timestamp ON logs(timestamp);
  \`)
`
  }

  if (options.example) {
    tables += `
  // Example items table
  db.exec(\`
    CREATE TABLE IF NOT EXISTS example_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      content TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );
  \`)
`
  }

  return `import { mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import Database from 'better-sqlite3'
import { databaseConfig } from '~/server/config/database'

export function createDatabase(): Database.Database {
  const dbPath = databaseConfig.databasePath.startsWith('/')
    ? databaseConfig.databasePath
    : resolve(process.cwd(), databaseConfig.databasePath)

  const dbDir = dirname(dbPath)
  mkdirSync(dbDir, { recursive: true })

  const db = new Database(dbPath)
  db.pragma('foreign_keys = ON')
${tables}
  return db
}
`
}

function generateDatabaseTypes(options: ProjectOptions): string {
  let types = ''

  if (options.pusher) {
    types += `export interface SubscriptionRow {
  id?: number
  endpoint: string
  keys: { p256dh: string; auth: string }
  device_id: string
  expiration_time: string | null
  metadata: Record<string, any> | null
  created_at: string
}

`
  }

  if (options.logger) {
    types += `export interface LogRow {
  id?: number
  level: string
  message: string
  source: string
  client_id: string | null
  user_agent: string | null
  ip_address: string | null
  metadata: Record<string, any> | null
  timestamp: string
}

`
  }

  if (options.example) {
    types += `export interface ExampleItemRow {
  id?: number
  title: string
  content: string | null
  created_at: string
  updated_at: string
}
`
  }

  return types || '// Add your database types here\n'
}

function generateReadme(options: ProjectOptions): string {
  return `# ${options.name}

Built with [BackStack](https://github.com/DannyVogel/backstack).

## Quick Start

\`\`\`bash
cp .env.example .env
npm run dev
\`\`\`

## Services

${options.pusher ? '- Push Notifications (`/pusher/*`)\n' : ''}${options.logger ? '- Logging (`/logger/*`)\n' : ''}${options.example ? '- Example CRUD (`/example/*`)\n' : ''}

## Documentation

See the [BackStack docs](https://github.com/DannyVogel/backstack/tree/main/docs) for more information.
`
}

// Helper functions for file content
function getCorsConfig(): string {
  return `const envOrigins = process.env.NITRO_ALLOWED_ORIGINS || ''
const configuredOrigins = envOrigins.split(',').map(o => o.trim()).filter(Boolean)
const devOrigins = process.env.NODE_ENV !== 'production'
  ? ['http://localhost:3000', 'http://localhost:5173']
  : []

export const corsConfig = {
  allowedOrigins: [...configuredOrigins, ...devOrigins],
  isOriginAllowed(origin: string | null): boolean {
    return origin ? this.allowedOrigins.includes(origin) : false
  },
  getHeaders(origin: string | null): Record<string, string> {
    const allow = this.isOriginAllowed(origin) ? origin! : ''
    return {
      'Access-Control-Allow-Origin': allow,
      'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
      'Access-Control-Allow-Headers': 'x-api-key, Content-Type',
      'Access-Control-Allow-Credentials': allow ? 'true' : 'false',
    }
  },
}
`
}

function getDatabaseIndex(): string {
  return `import type Database from 'better-sqlite3'
import { createDatabase } from './schema'

let dbInstance: Database.Database | null = null

export function getDatabase(): Database.Database {
  if (!dbInstance) dbInstance = createDatabase()
  return dbInstance
}

export function resetDatabase(): void {
  if (dbInstance) {
    dbInstance.close()
    dbInstance = null
  }
}
`
}

function getSecureCompare(): string {
  return `import { timingSafeEqual } from 'node:crypto'

export function secureCompare(a: string | null | undefined, b: string | null | undefined): boolean {
  if (!a || !b) return false
  if (a.length !== b.length) {
    timingSafeEqual(Buffer.from(a), Buffer.from(a))
    return false
  }
  return timingSafeEqual(Buffer.from(a), Buffer.from(b))
}
`
}

function getRateLimiter(): string {
  return `import type { H3Event } from 'nitro/deps/h3'
import { HTTPError } from 'h3'

const store = new Map<string, { count: number; resetAt: number }>()

export function createRateLimiter(max: number, windowMs: number) {
  return {
    check(event: H3Event, prefix: string): void {
      const ip = event.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
      const key = \`\${prefix}:\${ip}\`
      const now = Date.now()
      let entry = store.get(key)
      if (!entry || entry.resetAt < now) entry = { count: 0, resetAt: now + windowMs }
      entry.count++
      if (entry.count > max) throw HTTPError.status(429, 'Rate limit exceeded')
      store.set(key, entry)
    },
  }
}

export const rateLimiters = {
  api: createRateLimiter(100, 60000),
  auth: createRateLimiter(10, 60000),
}
`
}

function getCorsMiddleware(): string {
  return `import type { H3Event } from 'nitro/deps/h3'
import { defineEventHandler } from 'nitro/h3'
import { corsConfig } from '~/server/config/cors'

export default defineEventHandler((event: H3Event) => {
  const origin = event.headers.get('origin')
  const headers = corsConfig.getHeaders(origin)
  for (const [key, value] of Object.entries(headers)) {
    if (value) event.res.headers.set(key, value)
  }
  if (event.req.method === 'OPTIONS') {
    event.res.status = 204
    return ''
  }
})
`
}

function getPusherFiles(): Record<string, string> {
  return {
    'server/config/pusher.ts': `export const pusherConfig = {
  apiKey: process.env.NITRO_PUSHER_API_KEY || '',
  vapidPrivateKey: process.env.NITRO_VAPID_PRIVATE_KEY || '',
  vapidPublicKey: process.env.NITRO_VAPID_PUBLIC_KEY || '',
  vapidEmail: process.env.NITRO_VAPID_EMAIL || '',
}
`,
    'middleware/pusher.ts': `import { defineHandler } from 'nitro/h3'
import { HTTPError } from 'h3'
import { pusherConfig } from '~/server/config/pusher'
import { secureCompare } from '~/server/utils/secure-compare'
import { corsConfig } from '~/server/config/cors'

export default defineHandler((event) => {
  if (!event.req.url?.includes('/pusher/') || event.req.method === 'OPTIONS') return
  const apiKey = event.headers.get('x-api-key')
  const origin = event.headers.get('origin')
  if (secureCompare(apiKey, pusherConfig.apiKey) || corsConfig.isOriginAllowed(origin)) return
  throw HTTPError.status(403, 'Forbidden')
})
`,
    'routes/pusher/subscribe.post.ts': `import { defineHandler, readBody } from 'nitro/h3'
import { HTTPError } from 'h3'
import { getDatabase } from '~/server/database/index'

export default defineHandler(async (event) => {
  const body = await readBody(event)
  if (!body?.subscription?.endpoint || !body?.device_id) {
    throw HTTPError.status(400, 'Missing required fields')
  }
  const db = getDatabase()
  const stmt = db.prepare(\`
    INSERT INTO subscriptions (endpoint, keys, device_id, created_at)
    VALUES (?, ?, ?, datetime('now'))
    ON CONFLICT(endpoint) DO UPDATE SET keys = excluded.keys, device_id = excluded.device_id
    RETURNING *
  \`)
  const result = stmt.get(body.subscription.endpoint, JSON.stringify(body.subscription.keys), body.device_id)
  return { success: true, data: result }
})
`,
  }
}

function getLoggerFiles(): Record<string, string> {
  return {
    'server/config/logger.ts': `export const loggerConfig = {
  apiKey: process.env.NITRO_LOGGER_API_KEY || '',
  viewerKey: process.env.NITRO_LOGGER_VIEWER_KEY || '',
}
`,
    'middleware/logger.ts': `import { defineHandler } from 'nitro/h3'
import { HTTPError } from 'h3'
import { loggerConfig } from '~/server/config/logger'
import { secureCompare } from '~/server/utils/secure-compare'

export default defineHandler((event) => {
  if (!event.req.url?.includes('/logger/') || event.req.method === 'OPTIONS') return
  const apiKey = event.headers.get('x-api-key')
  if (secureCompare(apiKey, loggerConfig.apiKey)) return
  throw HTTPError.status(403, 'Forbidden')
})
`,
    'routes/logger/index.post.ts': `import { defineHandler, readBody } from 'nitro/h3'
import { HTTPError } from 'h3'
import { getDatabase } from '~/server/database/index'

export default defineHandler(async (event) => {
  const body = await readBody(event)
  if (!body?.level || !body?.message || !body?.source) {
    throw HTTPError.status(400, 'Missing required fields')
  }
  const db = getDatabase()
  const stmt = db.prepare(\`
    INSERT INTO logs (level, message, source, client_id, user_agent, ip_address, metadata, timestamp)
    VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
  \`)
  const result = stmt.run(
    body.level, body.message, body.source,
    body.client_id || null,
    event.headers.get('user-agent'),
    event.headers.get('x-forwarded-for'),
    body.metadata ? JSON.stringify(body.metadata) : null
  )
  return { success: true, log_id: result.lastInsertRowid }
})
`,
  }
}

function getExampleFiles(): Record<string, string> {
  return {
    'routes/example/items.get.ts': `import { defineHandler } from 'nitro/h3'
import { getDatabase } from '~/server/database/index'

export default defineHandler(() => {
  const db = getDatabase()
  const items = db.prepare('SELECT * FROM example_items ORDER BY created_at DESC').all()
  return { success: true, data: items }
})
`,
    'routes/example/items.post.ts': `import { defineHandler, readBody } from 'nitro/h3'
import { HTTPError } from 'h3'
import { getDatabase } from '~/server/database/index'

export default defineHandler(async (event) => {
  const body = await readBody(event)
  if (!body?.title) throw HTTPError.status(400, 'title is required')
  const db = getDatabase()
  const stmt = db.prepare(\`
    INSERT INTO example_items (title, content, created_at, updated_at)
    VALUES (?, ?, datetime('now'), datetime('now'))
    RETURNING *
  \`)
  const item = stmt.get(body.title, body.content || null)
  return { success: true, data: item }
})
`,
    'routes/example/[id].get.ts': `import { defineHandler, getRouterParam } from 'nitro/h3'
import { HTTPError } from 'h3'
import { getDatabase } from '~/server/database/index'

export default defineHandler((event) => {
  const id = getRouterParam(event, 'id')
  if (!id) throw HTTPError.status(400, 'Invalid ID')
  const db = getDatabase()
  const item = db.prepare('SELECT * FROM example_items WHERE id = ?').get(id)
  if (!item) throw HTTPError.status(404, 'Not found')
  return { success: true, data: item }
})
`,
    'routes/example/[id].delete.ts': `import { defineHandler, getRouterParam } from 'nitro/h3'
import { HTTPError } from 'h3'
import { getDatabase } from '~/server/database/index'

export default defineHandler((event) => {
  const id = getRouterParam(event, 'id')
  if (!id) throw HTTPError.status(400, 'Invalid ID')
  const db = getDatabase()
  const result = db.prepare('DELETE FROM example_items WHERE id = ?').run(id)
  if (result.changes === 0) throw HTTPError.status(404, 'Not found')
  return { success: true, message: 'Deleted' }
})
`,
  }
}
