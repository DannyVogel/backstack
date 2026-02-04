import { useCallback, useMemo } from 'react'

interface LoggerConfig {
  baseUrl: string
  apiKey?: string
}

type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'critical'

interface UseLoggerResult {
  log: (level: LogLevel, message: string, metadata?: Record<string, any>) => Promise<void>
  debug: (message: string, metadata?: Record<string, any>) => Promise<void>
  info: (message: string, metadata?: Record<string, any>) => Promise<void>
  warn: (message: string, metadata?: Record<string, any>) => Promise<void>
  error: (message: string, metadata?: Record<string, any>) => Promise<void>
  critical: (message: string, metadata?: Record<string, any>) => Promise<void>
  logError: (error: Error, metadata?: Record<string, any>) => Promise<void>
}

function getClientId(): string {
  if (typeof window === 'undefined') return ''
  let id = localStorage.getItem('backstack_client_id')
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem('backstack_client_id', id)
  }
  return id
}

export function useLogger(config: LoggerConfig): UseLoggerResult {
  const log = useCallback(async (
    level: LogLevel,
    message: string,
    metadata: Record<string, any> = {}
  ) => {
    try {
      await fetch(`${config.baseUrl}/logger`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(config.apiKey ? { 'X-API-Key': config.apiKey } : {})
        },
        body: JSON.stringify({
          level,
          message,
          source: 'client',
          client_id: getClientId(),
          metadata
        })
      })
    } catch (err) {
      console.error('Failed to log:', err)
    }
  }, [config])

  const debug = useCallback(
    (message: string, metadata?: Record<string, any>) => log('debug', message, metadata),
    [log]
  )

  const info = useCallback(
    (message: string, metadata?: Record<string, any>) => log('info', message, metadata),
    [log]
  )

  const warn = useCallback(
    (message: string, metadata?: Record<string, any>) => log('warn', message, metadata),
    [log]
  )

  const error = useCallback(
    (message: string, metadata?: Record<string, any>) => log('error', message, metadata),
    [log]
  )

  const critical = useCallback(
    (message: string, metadata?: Record<string, any>) => log('critical', message, metadata),
    [log]
  )

  const logError = useCallback(
    (err: Error, metadata: Record<string, any> = {}) =>
      log('error', err.message, { ...metadata, stack: err.stack, name: err.name }),
    [log]
  )

  return useMemo(() => ({
    log,
    debug,
    info,
    warn,
    error,
    critical,
    logError
  }), [log, debug, info, warn, error, critical, logError])
}
