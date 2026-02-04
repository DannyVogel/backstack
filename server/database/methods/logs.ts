import type { H3Event } from 'nitro/h3'
import type { LogRow } from '../types'
import { getDatabase } from '../index'

export function addLog(
  event: H3Event,
  log: {
    level: string
    message: string
    source: string
    client_id?: string | null
    user_agent?: string | null
    ip_address?: string | null
    metadata?: Record<string, any> | null
    timestamp?: string
  },
): number {
  const db = getDatabase()

  const stmt = db.prepare(`
    INSERT INTO logs (level, message, source, client_id, user_agent, ip_address, metadata, timestamp)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `)

  const result = stmt.run(
    log.level,
    log.message,
    log.source,
    log.client_id || null,
    log.user_agent || null,
    log.ip_address || null,
    log.metadata ? JSON.stringify(log.metadata) : null,
    log.timestamp || new Date().toISOString(),
  )

  return result.lastInsertRowid as number
}

export function getLogs(
  event: H3Event,
  filters: {
    level?: string
    source?: string
    client_id?: string
    hours?: number
    limit?: number
    offset?: number
    search?: string
  },
): LogRow[] {
  const db = getDatabase()

  let query = 'SELECT * FROM logs WHERE 1=1'
  const params: any[] = []

  if (filters.level) {
    query += ' AND level = ?'
    params.push(filters.level)
  }

  if (filters.source) {
    query += ' AND source = ?'
    params.push(filters.source)
  }

  if (filters.client_id) {
    query += ' AND client_id = ?'
    params.push(filters.client_id)
  }

  if (filters.hours) {
    const cutoffTime = new Date(Date.now() - filters.hours * 60 * 60 * 1000).toISOString()
    query += ' AND timestamp >= ?'
    params.push(cutoffTime)
  }

  if (filters.search) {
    query += ' AND message LIKE ?'
    params.push(`%${filters.search}%`)
  }

  query += ' ORDER BY timestamp DESC'

  if (filters.limit) {
    query += ' LIMIT ?'
    params.push(filters.limit)

    if (filters.offset) {
      query += ' OFFSET ?'
      params.push(filters.offset)
    }
  }

  const stmt = db.prepare(query)
  const results = stmt.all(...params) as LogRow[]

  // Parse JSON metadata
  return results.map(result => ({
    ...result,
    metadata: result.metadata && typeof result.metadata === 'string'
      ? JSON.parse(result.metadata)
      : result.metadata,
  }))
}

export function getLogStats(
  event: H3Event,
  hours: number = 24,
): {
  period: string
  total_logs: number
  by_level: Record<string, number>
  by_source: Record<string, number>
  timestamp: string
} {
  const db = getDatabase()

  const cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString()

  // Total logs
  const totalStmt = db.prepare('SELECT COUNT(*) as count FROM logs WHERE timestamp >= ?')
  const totalResult = totalStmt.get(cutoffTime) as { count: number }

  // Count by level
  const levelStmt = db.prepare(`
    SELECT level, COUNT(*) as count
    FROM logs
    WHERE timestamp >= ?
    GROUP BY level
  `)
  const levelResults = levelStmt.all(cutoffTime) as Array<{ level: string, count: number }>
  const byLevel: Record<string, number> = {}
  levelResults.forEach((row) => {
    byLevel[row.level] = row.count
  })

  // Count by source
  const sourceStmt = db.prepare(`
    SELECT source, COUNT(*) as count
    FROM logs
    WHERE timestamp >= ?
    GROUP BY source
  `)
  const sourceResults = sourceStmt.all(cutoffTime) as Array<{ source: string, count: number }>
  const bySource: Record<string, number> = {}
  sourceResults.forEach((row) => {
    bySource[row.source] = row.count
  })

  return {
    period: `last_${hours}_hours`,
    total_logs: totalResult.count,
    by_level: byLevel,
    by_source: bySource,
    timestamp: new Date().toISOString(),
  }
}
