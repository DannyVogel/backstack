import type { H3Event } from 'nitro/deps/h3'
import type { LogLevel, LogSource } from './types'
import { addLog } from '~/server/database/methods/logs'

export class StructuredLogger {
  async log(
    event: H3Event,
    level: LogLevel,
    message: string,
    source: LogSource = 'logger',
    clientId?: string | null,
    userAgent?: string | null,
    ipAddress?: string | null,
    metadata?: Record<string, any> | null,
  ): Promise<number | null> {
    // Always log to console
    const logData = {
      timestamp: new Date().toISOString(),
      level,
      message,
      source,
      client_id: clientId,
      user_agent: userAgent,
      ip_address: ipAddress,
      metadata,
    }

    console.log(JSON.stringify(logData))

    // Try to log to database
    try {
      const logId = addLog(event, {
        level,
        message,
        source,
        client_id: clientId,
        user_agent: userAgent,
        ip_address: ipAddress,
        metadata,
      })
      return logId
    }
    catch (error) {
      console.error(`Failed to log to database: ${error}`)
      return null
    }
  }

  async debug(
    event: H3Event,
    message: string,
    options?: {
      source?: LogSource
      clientId?: string | null
      userAgent?: string | null
      ipAddress?: string | null
      metadata?: Record<string, any> | null
    },
  ): Promise<number | null> {
    return this.log(
      event,
      'debug',
      message,
      options?.source || 'logger',
      options?.clientId,
      options?.userAgent,
      options?.ipAddress,
      options?.metadata,
    )
  }

  async info(
    event: H3Event,
    message: string,
    options?: {
      source?: LogSource
      clientId?: string | null
      userAgent?: string | null
      ipAddress?: string | null
      metadata?: Record<string, any> | null
    },
  ): Promise<number | null> {
    return this.log(
      event,
      'info',
      message,
      options?.source || 'logger',
      options?.clientId,
      options?.userAgent,
      options?.ipAddress,
      options?.metadata,
    )
  }

  async warn(
    event: H3Event,
    message: string,
    options?: {
      source?: LogSource
      clientId?: string | null
      userAgent?: string | null
      ipAddress?: string | null
      metadata?: Record<string, any> | null
    },
  ): Promise<number | null> {
    return this.log(
      event,
      'warn',
      message,
      options?.source || 'logger',
      options?.clientId,
      options?.userAgent,
      options?.ipAddress,
      options?.metadata,
    )
  }

  async error(
    event: H3Event,
    message: string,
    options?: {
      source?: LogSource
      clientId?: string | null
      userAgent?: string | null
      ipAddress?: string | null
      metadata?: Record<string, any> | null
    },
  ): Promise<number | null> {
    return this.log(
      event,
      'error',
      message,
      options?.source || 'logger',
      options?.clientId,
      options?.userAgent,
      options?.ipAddress,
      options?.metadata,
    )
  }

  async critical(
    event: H3Event,
    message: string,
    options?: {
      source?: LogSource
      clientId?: string | null
      userAgent?: string | null
      ipAddress?: string | null
      metadata?: Record<string, any> | null
    },
  ): Promise<number | null> {
    return this.log(
      event,
      'critical',
      message,
      options?.source || 'logger',
      options?.clientId,
      options?.userAgent,
      options?.ipAddress,
      options?.metadata,
    )
  }
}

export const logger = new StructuredLogger()
