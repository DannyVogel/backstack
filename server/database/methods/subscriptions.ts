import type { H3Event } from 'nitro/h3'
import type { SubscriptionRow } from '../types'
import { getDatabase } from '../index'

export function addSubscription(
  event: H3Event,
  subscription: {
    endpoint: string
    keys: { p256dh: string, auth: string }
    device_id: string
    expiration_time?: string | null
    metadata?: Record<string, any> | null
  },
): SubscriptionRow[] {
  const db = getDatabase()

  const stmt = db.prepare(`
    INSERT INTO subscriptions (endpoint, keys, device_id, expiration_time, metadata, created_at)
    VALUES (?, ?, ?, ?, ?, datetime('now'))
    ON CONFLICT(endpoint) DO UPDATE SET
      keys = excluded.keys,
      device_id = excluded.device_id,
      expiration_time = excluded.expiration_time,
      metadata = excluded.metadata
    RETURNING *
  `)

  const result = stmt.get(
    subscription.endpoint,
    JSON.stringify(subscription.keys),
    subscription.device_id,
    subscription.expiration_time || null,
    subscription.metadata ? JSON.stringify(subscription.metadata) : null,
  ) as SubscriptionRow

  // Parse JSON fields
  if (result.keys && typeof result.keys === 'string') {
    result.keys = JSON.parse(result.keys)
  }
  if (result.metadata && typeof result.metadata === 'string') {
    result.metadata = JSON.parse(result.metadata)
  }

  return [result]
}

export function removeSubscriptions(
  event: H3Event,
  deviceIds: string[],
): SubscriptionRow[] {
  const db = getDatabase()

  if (deviceIds.length === 0) {
    return []
  }

  const placeholders = deviceIds.map(() => '?').join(',')
  const stmt = db.prepare(`
    DELETE FROM subscriptions
    WHERE device_id IN (${placeholders})
    RETURNING *
  `)

  const results = stmt.all(...deviceIds) as SubscriptionRow[]

  // Parse JSON fields
  return results.map(result => ({
    ...result,
    keys: typeof result.keys === 'string' ? JSON.parse(result.keys) : result.keys,
    metadata: result.metadata && typeof result.metadata === 'string'
      ? JSON.parse(result.metadata)
      : result.metadata,
  }))
}

export function getSubscriptions(
  event: H3Event,
  metadataFilter?: Record<string, any>,
): SubscriptionRow[] {
  const db = getDatabase()

  const query = 'SELECT * FROM subscriptions'
  const params: any[] = []

  if (metadataFilter) {
    // SQLite doesn't have great JSON support, so we'll filter in memory
    // For now, just get all and filter
  }

  const stmt = db.prepare(query)
  const results = stmt.all(...params) as SubscriptionRow[]

  // Parse JSON fields
  let parsed = results.map(result => ({
    ...result,
    keys: typeof result.keys === 'string' ? JSON.parse(result.keys) : result.keys,
    metadata: result.metadata && typeof result.metadata === 'string'
      ? JSON.parse(result.metadata)
      : result.metadata,
  }))

  // Apply metadata filter if provided
  if (metadataFilter) {
    parsed = parsed.filter((sub) => {
      if (!sub.metadata)
        return false
      for (const [key, value] of Object.entries(metadataFilter)) {
        if (sub.metadata[key] !== value)
          return false
      }
      return true
    })
  }

  return parsed
}

export function getDeviceSubscription(
  event: H3Event,
  deviceId: string,
): SubscriptionRow | null {
  const db = getDatabase()

  const stmt = db.prepare('SELECT * FROM subscriptions WHERE device_id = ? LIMIT 1')
  const result = stmt.get(deviceId) as SubscriptionRow | undefined

  if (!result) {
    return null
  }

  // Parse JSON fields
  return {
    ...result,
    keys: typeof result.keys === 'string' ? JSON.parse(result.keys) : result.keys,
    metadata: result.metadata && typeof result.metadata === 'string'
      ? JSON.parse(result.metadata)
      : result.metadata,
  }
}

export function removeSubscriptionByEndpoint(
  endpoint: string,
): boolean {
  const db = getDatabase()

  const stmt = db.prepare('DELETE FROM subscriptions WHERE endpoint = ?')
  const result = stmt.run(endpoint)

  return result.changes > 0
}

export function removeExpiredSubscriptions(): number {
  const db = getDatabase()

  const stmt = db.prepare(`
    DELETE FROM subscriptions
    WHERE expiration_time IS NOT NULL
      AND datetime(expiration_time) < datetime('now')
  `)
  const result = stmt.run()

  return result.changes
}
