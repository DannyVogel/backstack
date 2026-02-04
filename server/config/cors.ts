/**
 * CORS Configuration
 *
 * Allowed origins are loaded from NITRO_ALLOWED_ORIGINS environment variable.
 * Multiple origins can be comma-separated: "https://app.example.com,https://staging.example.com"
 *
 * For development, localhost origins can be added.
 */

const envOrigins = process.env.NITRO_ALLOWED_ORIGINS || ''

// Parse comma-separated origins and filter empty strings
const configuredOrigins = envOrigins
  .split(',')
  .map(origin => origin.trim())
  .filter(Boolean)

// Default development origins (only used if no production origins configured)
const devOrigins = process.env.NODE_ENV !== 'production'
  ? ['http://localhost:3000', 'http://localhost:5173', 'http://127.0.0.1:3000', 'http://127.0.0.1:5173']
  : []

export const corsConfig = {
  /**
   * List of allowed origins.
   * In production, only configured origins are allowed.
   * In development, localhost origins are also allowed.
   */
  allowedOrigins: [...configuredOrigins, ...devOrigins],

  /**
   * Check if an origin is allowed.
   */
  isOriginAllowed(origin: string | null | undefined): boolean {
    if (!origin)
      return false
    return this.allowedOrigins.includes(origin)
  },

  /**
   * Get CORS headers for a request.
   * Returns null for Access-Control-Allow-Origin if origin not allowed.
   */
  getHeaders(origin: string | null | undefined): Record<string, string> {
    const allowOrigin = this.isOriginAllowed(origin) ? origin! : ''

    return {
      'Access-Control-Allow-Origin': allowOrigin,
      'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
      'Access-Control-Allow-Headers': 'x-api-key, Content-Type, Authorization, Origin',
      'Access-Control-Allow-Credentials': allowOrigin ? 'true' : 'false',
      'Access-Control-Max-Age': '86400', // 24 hours
    }
  },
}
