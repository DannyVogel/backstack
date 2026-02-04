export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'critical'

// Extensible log source type - add your own service names
export type LogSource = 'pusher' | 'logger' | 'client' | 'system' | 'example' | string

export interface LogEntry {
  level: LogLevel
  message: string
  source: LogSource
  client_id?: string | null
  user_agent?: string | null
  ip_address?: string | null
  metadata?: Record<string, any> | null
  timestamp?: string
}

export interface LogResponse {
  success: boolean
  log_id?: number | null
  message: string
}
