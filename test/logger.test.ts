import type { H3Event } from 'nitro/h3'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { getDatabase, resetDatabase } from '~/server/database/index'
import { addLog, getLogs, getLogStats } from '~/server/database/methods/logs'
import { StructuredLogger } from '~/server/logger/logger'

// Create a minimal mock H3Event for database methods that accept one
function mockEvent(): H3Event {
  return {} as H3Event
}

describe('logger database methods', () => {
  beforeEach(() => {
    // Ensure clean database state
    const db = getDatabase()
    db.exec('DELETE FROM logs')
  })

  afterEach(() => {
    resetDatabase()
  })

  describe('addLog', () => {
    it('should insert a log and return the log id', () => {
      const logId = addLog(mockEvent(), {
        level: 'info',
        message: 'test message',
        source: 'system',
      })
      expect(logId).toBeGreaterThan(0)
    })

    it('should store optional fields', () => {
      const logId = addLog(mockEvent(), {
        level: 'error',
        message: 'something failed',
        source: 'client',
        client_id: 'client-123',
        user_agent: 'TestBot/1.0',
        ip_address: '192.168.1.1',
        metadata: { key: 'value' },
      })
      expect(logId).toBeGreaterThan(0)

      const logs = getLogs(mockEvent(), { limit: 1 })
      expect(logs).toHaveLength(1)
      expect(logs[0].level).toBe('error')
      expect(logs[0].message).toBe('something failed')
      expect(logs[0].source).toBe('client')
      expect(logs[0].client_id).toBe('client-123')
      expect(logs[0].user_agent).toBe('TestBot/1.0')
      expect(logs[0].ip_address).toBe('192.168.1.1')
      expect(logs[0].metadata).toEqual({ key: 'value' })
    })

    it('should use provided timestamp', () => {
      const ts = '2025-01-01T00:00:00.000Z'
      addLog(mockEvent(), {
        level: 'info',
        message: 'backdated',
        source: 'system',
        timestamp: ts,
      })

      const logs = getLogs(mockEvent(), { hours: 24 * 365 * 10, limit: 10 })
      const found = logs.find(l => l.message === 'backdated')
      expect(found).toBeDefined()
      expect(found!.timestamp).toBe(ts)
    })
  })

  describe('getLogs', () => {
    beforeEach(() => {
      addLog(mockEvent(), { level: 'info', message: 'info msg 1', source: 'system' })
      addLog(mockEvent(), { level: 'error', message: 'error msg 1', source: 'client' })
      addLog(mockEvent(), { level: 'info', message: 'info msg 2', source: 'pusher', client_id: 'c1' })
      addLog(mockEvent(), { level: 'warn', message: 'warn msg 1', source: 'system' })
    })

    it('should return all logs when no filters', () => {
      const logs = getLogs(mockEvent(), {})
      expect(logs.length).toBe(4)
    })

    it('should filter by level', () => {
      const logs = getLogs(mockEvent(), { level: 'info' })
      expect(logs.length).toBe(2)
      expect(logs.every(l => l.level === 'info')).toBe(true)
    })

    it('should filter by source', () => {
      const logs = getLogs(mockEvent(), { source: 'client' })
      expect(logs.length).toBe(1)
      expect(logs[0].source).toBe('client')
    })

    it('should filter by client_id', () => {
      const logs = getLogs(mockEvent(), { client_id: 'c1' })
      expect(logs.length).toBe(1)
      expect(logs[0].client_id).toBe('c1')
    })

    it('should respect limit', () => {
      const logs = getLogs(mockEvent(), { limit: 2 })
      expect(logs.length).toBe(2)
    })

    it('should filter by search term', () => {
      const logs = getLogs(mockEvent(), { search: 'error' })
      expect(logs.length).toBe(1)
      expect(logs[0].message).toContain('error')
    })

    it('should order by timestamp descending', () => {
      const logs = getLogs(mockEvent(), {})
      for (let i = 0; i < logs.length - 1; i++) {
        expect(logs[i].timestamp >= logs[i + 1].timestamp).toBe(true)
      }
    })
  })

  describe('getLogStats', () => {
    beforeEach(() => {
      addLog(mockEvent(), { level: 'info', message: 'msg', source: 'system' })
      addLog(mockEvent(), { level: 'info', message: 'msg', source: 'system' })
      addLog(mockEvent(), { level: 'error', message: 'msg', source: 'client' })
      addLog(mockEvent(), { level: 'warn', message: 'msg', source: 'pusher' })
    })

    it('should return total log count', () => {
      const stats = getLogStats(mockEvent(), 24)
      expect(stats.total_logs).toBe(4)
    })

    it('should break down by level', () => {
      const stats = getLogStats(mockEvent(), 24)
      expect(stats.by_level.info).toBe(2)
      expect(stats.by_level.error).toBe(1)
      expect(stats.by_level.warn).toBe(1)
    })

    it('should break down by source', () => {
      const stats = getLogStats(mockEvent(), 24)
      expect(stats.by_source.system).toBe(2)
      expect(stats.by_source.client).toBe(1)
      expect(stats.by_source.pusher).toBe(1)
    })

    it('should include period and timestamp', () => {
      const stats = getLogStats(mockEvent(), 12)
      expect(stats.period).toBe('last_12_hours')
      expect(stats.timestamp).toBeDefined()
    })
  })
})

describe('structuredLogger', () => {
  let loggerInstance: StructuredLogger

  beforeEach(() => {
    loggerInstance = new StructuredLogger()
    const db = getDatabase()
    db.exec('DELETE FROM logs')
    vi.spyOn(console, 'log').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
    resetDatabase()
  })

  it('should log to database and return log id', async () => {
    const logId = await loggerInstance.log(
      mockEvent(),
      'info',
      'test log message',
      'system',
    )
    expect(logId).toBeGreaterThan(0)

    const logs = getLogs(mockEvent(), { limit: 1 })
    expect(logs[0].message).toBe('test log message')
    expect(logs[0].level).toBe('info')
  })

  it('should log to console as JSON', async () => {
    await loggerInstance.log(mockEvent(), 'warn', 'console test', 'system')

    expect(console.log).toHaveBeenCalledOnce()
    const call = (console.log as any).mock.calls[0][0]
    const parsed = JSON.parse(call)
    expect(parsed.level).toBe('warn')
    expect(parsed.message).toBe('console test')
    expect(parsed.source).toBe('system')
    expect(parsed.timestamp).toBeDefined()
  })

  it('should store metadata', async () => {
    await loggerInstance.log(
      mockEvent(),
      'info',
      'with metadata',
      'system',
      null,
      null,
      null,
      { foo: 'bar' },
    )

    const logs = getLogs(mockEvent(), { limit: 1 })
    expect(logs[0].metadata).toEqual({ foo: 'bar' })
  })

  describe('convenience methods', () => {
    it('debug() should log at debug level', async () => {
      const id = await loggerInstance.debug(mockEvent(), 'debug msg')
      expect(id).toBeGreaterThan(0)
      const logs = getLogs(mockEvent(), { level: 'debug' })
      expect(logs).toHaveLength(1)
    })

    it('info() should log at info level', async () => {
      const id = await loggerInstance.info(mockEvent(), 'info msg')
      expect(id).toBeGreaterThan(0)
      const logs = getLogs(mockEvent(), { level: 'info' })
      expect(logs).toHaveLength(1)
    })

    it('warn() should log at warn level', async () => {
      const id = await loggerInstance.warn(mockEvent(), 'warn msg')
      expect(id).toBeGreaterThan(0)
      const logs = getLogs(mockEvent(), { level: 'warn' })
      expect(logs).toHaveLength(1)
    })

    it('error() should log at error level', async () => {
      const id = await loggerInstance.error(mockEvent(), 'error msg')
      expect(id).toBeGreaterThan(0)
      const logs = getLogs(mockEvent(), { level: 'error' })
      expect(logs).toHaveLength(1)
    })

    it('critical() should log at critical level', async () => {
      const id = await loggerInstance.critical(mockEvent(), 'critical msg')
      expect(id).toBeGreaterThan(0)
      const logs = getLogs(mockEvent(), { level: 'critical' })
      expect(logs).toHaveLength(1)
    })

    it('should pass options through convenience methods', async () => {
      await loggerInstance.info(mockEvent(), 'opts test', {
        source: 'pusher',
        clientId: 'c-1',
        userAgent: 'Agent/1',
        ipAddress: '10.0.0.1',
        metadata: { extra: true },
      })

      const logs = getLogs(mockEvent(), { limit: 1 })
      expect(logs[0].source).toBe('pusher')
      expect(logs[0].client_id).toBe('c-1')
      expect(logs[0].user_agent).toBe('Agent/1')
      expect(logs[0].ip_address).toBe('10.0.0.1')
      expect(logs[0].metadata).toEqual({ extra: true })
    })
  })
})
