/**
 * Validates and normalizes web-push subscription keys
 * web-push library requires:
 * - p256dh: base64url string that decodes to exactly 65 bytes
 * - auth: base64url string that decodes to exactly 16 bytes
 */

export interface SubscriptionKeys {
  p256dh: string
  auth: string
}

/**
 * Validates that a string is a valid base64url string
 */
function isValidBase64Url(str: string): boolean {
  // Base64url uses A-Z, a-z, 0-9, -, and _
  // Remove padding for validation
  const base64UrlPattern = /^[\w-]+={0,2}$/
  return base64UrlPattern.test(str)
}

/**
 * Decodes a base64url string to a Buffer
 */
function base64UrlToBuffer(base64Url: string): Buffer {
  // Convert base64url to base64
  let base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')

  // Add padding if needed
  const padding = base64.length % 4
  if (padding) {
    base64 += '='.repeat(4 - padding)
  }

  return Buffer.from(base64, 'base64')
}

/**
 * Validates subscription keys format
 * @throws Error if keys are invalid
 */
export function validateSubscriptionKeys(keys: SubscriptionKeys): void {
  if (!keys || typeof keys !== 'object') {
    throw new Error('Keys must be an object with p256dh and auth properties')
  }

  if (!keys.p256dh || typeof keys.p256dh !== 'string') {
    throw new Error('p256dh key is required and must be a string')
  }

  if (!keys.auth || typeof keys.auth !== 'string') {
    throw new Error('auth key is required and must be a string')
  }

  // Validate base64url format
  if (!isValidBase64Url(keys.p256dh)) {
    throw new Error('p256dh key must be a valid base64url string')
  }

  if (!isValidBase64Url(keys.auth)) {
    throw new Error('auth key must be a valid base64url string')
  }

  // Validate decoded lengths
  try {
    const p256dhBuffer = base64UrlToBuffer(keys.p256dh)
    if (p256dhBuffer.length !== 65) {
      throw new Error(
        `p256dh key must decode to exactly 65 bytes, got ${p256dhBuffer.length} bytes`,
      )
    }

    const authBuffer = base64UrlToBuffer(keys.auth)
    if (authBuffer.length !== 16) {
      throw new Error(
        `auth key must decode to exactly 16 bytes, got ${authBuffer.length} bytes`,
      )
    }
  }
  catch (error: any) {
    if (error.message.includes('must decode')) {
      throw error
    }
    throw new Error(`Invalid base64url encoding in keys: ${error.message}`)
  }
}

/**
 * Normalizes keys (ensures they're valid base64url strings)
 * This can be used to clean up keys that might have been stored incorrectly
 */
export function normalizeSubscriptionKeys(keys: SubscriptionKeys): SubscriptionKeys {
  // First validate
  validateSubscriptionKeys(keys)

  // Return normalized (trimmed) keys
  return {
    p256dh: keys.p256dh.trim(),
    auth: keys.auth.trim(),
  }
}
